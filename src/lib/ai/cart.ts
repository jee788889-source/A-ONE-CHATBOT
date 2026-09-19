import { prisma } from "@/lib/db";
import { calculate_cart_total, type CalculatedCart } from "./tools";

export interface CartItem {
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface ConversationState {
  conversationId: string;
  customerId: string;
  cart: CartItem[];
  pendingQuantityItem?: {
    menuItemId?: string;
    name: string;
    price: number;
  } | null;
  pendingOrderConfirmation?: boolean;
  pendingOnlinePayment?: boolean;
  pendingTransactionId?: boolean;
  paymentMethod?: "CASH_ON_DELIVERY" | "ONLINE_TRANSFER";
  lastCreatedOrderNumber?: string;
  lastCreatedOrderId?: string;
  deliveryAddress?: string | null;
  lastDiscussedItem?: {
    menuItemId?: string;
    name: string;
    price: number;
  } | null;
  isHumanHandoff?: boolean;
  updatedAt: number;
}

// In-Memory store keyed strictly by conversationId for instant speed and atomic updates
const stateMap = new Map<string, ConversationState>();

// Mutex queues per conversation to prevent race conditions during rapid message bursts from the same user
const lockQueues = new Map<string, Promise<any>>();

/**
 * Run an async function under a per-conversation mutex lock.
 * Ensures rapid sequential messages from the same customer do not overwrite state concurrently.
 */
export async function withConversationLock<T>(
  conversationId: string,
  fn: () => Promise<T>
): Promise<T> {
  const current = lockQueues.get(conversationId) || Promise.resolve();
  let release: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });

  lockQueues.set(conversationId, current.then(() => next));

  try {
    await current;
    return await fn();
  } finally {
    release!();
    if (lockQueues.get(conversationId) === next) {
      lockQueues.delete(conversationId);
    }
  }
}

/**
 * Retrieve state for a specific conversation.
 * 100% isolated per customer and conversation ID.
 */
export async function getConversationState(
  conversationId: string,
  customerId: string
): Promise<ConversationState> {
  const cached = stateMap.get(conversationId);
  if (cached) {
    return cached;
  }

  // Attempt to restore persistent state from Customer.notes if available
  let restoredCart: CartItem[] = [];
  try {
    const customer = await prisma.customer
      .findUnique({
        where: { id: customerId },
        select: { notes: true, address: true },
      })
      .catch(() => null);

    if (customer?.notes && customer.notes.startsWith("{")) {
      const parsed = JSON.parse(customer.notes);
      if (Array.isArray(parsed.cart)) {
        restoredCart = parsed.cart;
      }
    }
  } catch {
    // Ignore parse errors, start with clean cart
  }

  const newState: ConversationState = {
    conversationId,
    customerId,
    cart: restoredCart,
    pendingQuantityItem: null,
    pendingOrderConfirmation: false,
    deliveryAddress: null,
    lastDiscussedItem: null,
    isHumanHandoff: false,
    updatedAt: Date.now(),
  };

  stateMap.set(conversationId, newState);
  return newState;
}

/**
 * Update conversation state safely
 */
export async function updateConversationState(
  conversationId: string,
  partial: Partial<ConversationState>,
  customerId?: string
): Promise<ConversationState> {
  const current = await getConversationState(conversationId, customerId || "");
  const updated: ConversationState = {
    ...current,
    ...partial,
    updatedAt: Date.now(),
  };

  stateMap.set(conversationId, updated);

  // Background persist cart state to Customer record
  if (updated.customerId && partial.cart !== undefined) {
    prisma.customer
      .update({
        where: { id: updated.customerId },
        data: {
          notes: JSON.stringify({ cart: updated.cart, updatedAt: updated.updatedAt }),
        },
      })
      .catch(() => {});
  }

  return updated;
}

/**
 * Add an item to the customer's cart
 */
export async function addToCart(
  conversationId: string,
  customerId: string,
  item: {
    menuItemId?: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }
): Promise<{ state: ConversationState; cartSummary: CalculatedCart }> {
  const state = await getConversationState(conversationId, customerId);
  const qty = Math.max(1, Math.floor(item.quantity));

  const existingIndex = state.cart.findIndex(
    (c) =>
      (item.menuItemId && c.menuItemId === item.menuItemId) ||
      c.name.toLowerCase() === item.name.toLowerCase()
  );

  let newCart = [...state.cart];
  if (existingIndex >= 0) {
    newCart[existingIndex] = {
      ...newCart[existingIndex],
      quantity: newCart[existingIndex].quantity + qty,
    };
  } else {
    newCart.push({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: qty,
      notes: item.notes,
    });
  }

  const updatedState = await updateConversationState(
    conversationId,
    {
      cart: newCart,
      pendingQuantityItem: null,
      lastDiscussedItem: { menuItemId: item.menuItemId, name: item.name, price: item.price },
    },
    customerId
  );

  const cartSummary = await calculate_cart_total(updatedState.cart);
  return { state: updatedState, cartSummary };
}

/**
 * Set exact quantity of an item in cart
 */
export async function setItemQuantity(
  conversationId: string,
  customerId: string,
  itemName: string,
  quantity: number
): Promise<{ state: ConversationState; cartSummary: CalculatedCart }> {
  const state = await getConversationState(conversationId, customerId);
  const cleanName = itemName.toLowerCase().trim();

  let newCart = [...state.cart];
  const index = newCart.findIndex((i) => i.name.toLowerCase().includes(cleanName) || cleanName.includes(i.name.toLowerCase()));

  if (index >= 0) {
    if (quantity <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index] = { ...newCart[index], quantity: Math.floor(quantity) };
    }
  }

  const updatedState = await updateConversationState(
    conversationId,
    { cart: newCart },
    customerId
  );

  const cartSummary = await calculate_cart_total(updatedState.cart);
  return { state: updatedState, cartSummary };
}

/**
 * Remove an item from the customer's cart
 */
export async function removeFromCart(
  conversationId: string,
  customerId: string,
  itemName: string
): Promise<{ state: ConversationState; cartSummary: CalculatedCart; removedItemName?: string }> {
  const state = await getConversationState(conversationId, customerId);
  const cleanName = itemName.toLowerCase().trim();

  const index = state.cart.findIndex(
    (i) => i.name.toLowerCase().includes(cleanName) || cleanName.includes(i.name.toLowerCase())
  );

  let removedItemName: string | undefined;
  let newCart = [...state.cart];

  if (index >= 0) {
    removedItemName = newCart[index].name;
    newCart.splice(index, 1);
  }

  const updatedState = await updateConversationState(
    conversationId,
    { cart: newCart },
    customerId
  );

  const cartSummary = await calculate_cart_total(updatedState.cart);
  return { state: updatedState, cartSummary, removedItemName };
}

/**
 * Clear the entire cart for a conversation
 */
export async function clearCart(
  conversationId: string,
  customerId: string
): Promise<ConversationState> {
  return updateConversationState(
    conversationId,
    {
      cart: [],
      pendingQuantityItem: null,
      pendingOrderConfirmation: false,
    },
    customerId
  );
}

/**
 * Format calculated cart into customer-friendly multi-lingual message
 */
export function formatCartText(
  calc: CalculatedCart,
  lang: "en" | "ur" | "ur_roman" = "ur_roman"
): string {
  if (!calc.items.length) {
    if (lang === "ur") return "آپ کا کارٹ ابھی خالی ہے۔ مینو دیکھنے کے لیے *Menu* لکھیں۔";
    if (lang === "ur_roman") return "Aap ka cart abhi khali hai. Menu dekhne ke liye *Menu* likhein.";
    return "Your cart is currently empty. Reply *Menu* to browse dishes.";
  }

  let out = "🛒 *A-ONE RESTAURANT CART:*\n\n";
  calc.items.forEach((item, idx) => {
    out += `${idx + 1}. *${item.name}* × ${item.quantity}\n`;
    out += `   Rs. ${item.price} = *Rs. ${item.subtotal}*\n`;
  });

  out += `\n───────────────\n`;
  out += `Subtotal: *Rs. ${calc.subtotal.toLocaleString()}*\n`;
  out += `Delivery Charges: *Rs. ${calc.deliveryFee}*${calc.deliveryFee === 0 ? " _(Free Delivery)_" : ""}\n`;
  out += `💰 *Total Amount: Rs. ${calc.total.toLocaleString()}*\n`;

  if (!calc.isMinOrderMet) {
    out += `\n⚠️ _Minimum order limit Rs. ${calc.minOrderAmount} hai._\n`;
  }

  return out;
}
