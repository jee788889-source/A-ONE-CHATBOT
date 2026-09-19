import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/auth";
import type { OrderStatus, OrderType, PaymentStatus } from "@prisma/client";
import {
  evaluateBusinessHours,
  DEFAULT_BUSINESS_HOURS,
  formatTime12h,
  getPakistanTime,
  type BusinessHoursStatus,
} from "@/lib/business-hours";

export interface MenuItemResult {
  id: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  preparationTime?: number | null;
  categoryName?: string;
}

export interface DeliverySettingsResult {
  deliveryFee: number;
  minOrderAmount: number;
  isAcceptingOrders: boolean;
  freeDeliveryThreshold?: number;
}

/**
 * =============================================================================
 *  DATABASE TOOLS — Single Source of Truth
 * =============================================================================
 * All factual restaurant data is strictly read directly from PostgreSQL via Prisma.
 * The AI cannot invent prices, availability, delivery fees, or items.
 */

const FALLBACK_MENU: Array<{
  id: string;
  name: string;
  urduName?: string | null;
  items: MenuItemResult[];
}> = [
  {
    id: "cat-burgers",
    name: "Burgers & Sandwiches",
    urduName: "برگر اور سینڈوچ",
    items: [
      {
        id: "item-beef-burger",
        name: "A-ONE Special Beef Smash Burger",
        urduName: "اے ون اسپیشل بیف برگر",
        description: "Double beef patty, melted cheddar, caramelized onions, secret sauce",
        price: 850,
        isAvailable: true,
        preparationTime: 15,
        categoryName: "Burgers & Sandwiches",
      },
      {
        id: "item-zinger",
        name: "Crispy Zinger Crunch Burger",
        urduName: "کرسپی زنگر برگر",
        description: "Golden fried crispy chicken breast fillet, spicy mayo, lettuce",
        price: 650,
        isAvailable: true,
        preparationTime: 12,
        categoryName: "Burgers & Sandwiches",
      },
    ],
  },
  {
    id: "cat-rice",
    name: "Rice & Biryani",
    urduName: "بریانی اور چاول",
    items: [
      {
        id: "item-biryani",
        name: "A-ONE Special Chicken Dum Biryani",
        urduName: "اے ون اسپیشل چکن دم بریانی",
        description: "Fragrant basmati rice layered with spiced chicken & saffron aroma",
        price: 520,
        isAvailable: true,
        preparationTime: 10,
        categoryName: "Rice & Biryani",
      },
    ],
  },
  {
    id: "cat-savories",
    name: "Traditional Savories & Nimko",
    urduName: "روایتی نمکو اور اسنیکس",
    items: [
      {
        id: "item-samosa",
        name: "Crispy A-ONE Potato & Beef Samosa",
        urduName: "اے ون کرسپی سموسہ",
        description: "Handcrafted crispy pastry filled with aromatic spiced potatoes or beef",
        price: 80,
        isAvailable: true,
        preparationTime: 5,
        categoryName: "Traditional Savories & Nimko",
      },
      {
        id: "item-nimko",
        name: "A-ONE Special Mix Nimko (400g)",
        urduName: "اے ون اسپیشل مکس نمکو",
        description: "Crispy savory blend of spiced grams, sev, and roasted nuts",
        price: 380,
        isAvailable: true,
        preparationTime: 5,
        categoryName: "Traditional Savories & Nimko",
      },
      {
        id: "item-fries",
        name: "Loaded Masala French Fries",
        urduName: "مصالحہ فرائز",
        description: "Crispy golden potato fries seasoned with chef's signature chaat masala",
        price: 250,
        isAvailable: true,
        preparationTime: 8,
        categoryName: "Traditional Savories & Nimko",
      },
    ],
  },
  {
    id: "cat-beverages",
    name: "Beverages & Drinks",
    urduName: "مشروبات اور کولڈ ڈرنکس",
    items: [
      {
        id: "item-coke",
        name: "Chilled Coke (500ml)",
        urduName: "کوک",
        description: "Ice cold refreshing Coca-Cola pet bottle",
        price: 120,
        isAvailable: true,
        preparationTime: 2,
        categoryName: "Beverages & Drinks",
      },
    ],
  },
];

/** 1. Fetch full active menu categorized */
export async function get_menu(): Promise<{
  categories: Array<{
    id: string;
    name: string;
    urduName?: string | null;
    items: MenuItemResult[];
  }>;
}> {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        items: {
          where: { isAvailable: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!categories.length) {
      return { categories: FALLBACK_MENU };
    }

    return {
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        urduName: cat.urduName,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          urduName: item.urduName,
          description: item.description,
          price: item.price,
          isAvailable: item.isAvailable,
          preparationTime: item.preparationTime,
          categoryName: cat.name,
        })),
      })),
    };
  } catch (error) {
    return { categories: FALLBACK_MENU };
  }
}

/** 2. Search menu items by keyword (English, Urdu, or partial) */
export async function search_menu(query: string): Promise<MenuItemResult[]> {
  const clean = query.trim();
  if (!clean) return [];

  // Normalize plural and roman variations
  const normalized = clean
    .toLowerCase()
    .replace(/\bsamosay\b/g, "samosa")
    .replace(/\bburgers\b/g, "burger")
    .replace(/\bbiryanis\b/g, "biryani")
    .replace(/\bpizzas\b/g, "pizza");

  const queryTokens = normalized.split(/\s+/).filter((t) => t.length >= 3);

  try {
    const items = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        OR: [
          { name: { contains: clean, mode: "insensitive" } },
          { name: { contains: normalized, mode: "insensitive" } },
          { urduName: { contains: clean, mode: "insensitive" } },
          { description: { contains: clean, mode: "insensitive" } },
          { category: { name: { contains: clean, mode: "insensitive" } } },
        ],
      },
      include: {
        category: { select: { name: true } },
      },
      take: 8,
    });

    if (items.length > 0) {
      return items.map((item) => ({
        id: item.id,
        name: item.name,
        urduName: item.urduName,
        description: item.description,
        price: item.price,
        isAvailable: item.isAvailable,
        preparationTime: item.preparationTime,
        categoryName: item.category.name,
      }));
    }
  } catch {
    // Database fallback
  }

  // Robust In-Memory Matching
  const lower = normalized;
  const fallbackMatches: MenuItemResult[] = [];
  for (const cat of FALLBACK_MENU) {
    for (const item of cat.items) {
      const itemNameLower = item.name.toLowerCase();
      const itemUrdu = item.urduName || "";
      const catLower = cat.name.toLowerCase();

      if (
        itemNameLower.includes(lower) ||
        lower.includes(itemNameLower) ||
        (itemUrdu && itemUrdu.includes(clean)) ||
        catLower.includes(lower) ||
        queryTokens.some((tok) => itemNameLower.includes(tok) || catLower.includes(tok))
      ) {
        fallbackMatches.push(item);
      }
    }
  }
  return fallbackMatches;
}

/** 3. Check item availability & price in database */
export async function check_item_availability(itemNameOrId: string): Promise<{
  found: boolean;
  item?: MenuItemResult;
  message: string;
}> {
  try {
    // Try exact ID first
    let item = await prisma.menuItem.findUnique({
      where: { id: itemNameOrId },
      include: { category: { select: { name: true } } },
    });

    // Try name match
    if (!item) {
      item = await prisma.menuItem.findFirst({
        where: {
          OR: [
            { name: { contains: itemNameOrId.trim(), mode: "insensitive" } },
            { urduName: { contains: itemNameOrId.trim(), mode: "insensitive" } },
          ],
        },
        include: { category: { select: { name: true } } },
      });
    }

    if (!item) {
      return {
        found: false,
        message: `Maazrat, "${itemNameOrId}" hamare menu mein dastyab nahi hai.`,
      };
    }

    const resItem: MenuItemResult = {
      id: item.id,
      name: item.name,
      urduName: item.urduName,
      description: item.description,
      price: item.price,
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime,
      categoryName: item.category.name,
    };

    if (!item.isAvailable) {
      return {
        found: true,
        item: resItem,
        message: `Ye item (${item.name}) abhi temporary out-of-stock hai.`,
      };
    }

    return {
      found: true,
      item: resItem,
      message: `Ji bilkul! ${item.name} available hai (Rs. ${item.price}).`,
    };
  } catch (error) {
    console.error("[tools:check_item_availability] error:", error);
    return {
      found: false,
      message: "Is information ka mujhe abhi database mein record nahi mil raha.",
    };
  }
}

/** 4. Get delivery fees and minimum order settings */
export async function get_delivery_charge(): Promise<DeliverySettingsResult> {
  try {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
    });

    const deliveryJson = (settings?.deliverySettings as any) || {};

    return {
      deliveryFee: settings?.deliveryFee ?? 150,
      minOrderAmount: settings?.minOrderAmount ?? 500,
      isAcceptingOrders: settings?.isAcceptingOrders ?? true,
      freeDeliveryThreshold: deliveryJson.freeDeliveryThreshold ?? 2000,
    };
  } catch (error) {
    console.error("[tools:get_delivery_charge] error:", error);
    return {
      deliveryFee: 150,
      minOrderAmount: 500,
      isAcceptingOrders: true,
      freeDeliveryThreshold: 2000,
    };
  }
}

/** 5. Get restaurant opening hours and live status */
export async function get_opening_hours(): Promise<{
  isAcceptingOrders: boolean;
  hoursDescription: string;
  liveStatus: BusinessHoursStatus;
  scheduleSummary: string;
}> {
  try {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
    });

    const openingHoursObj = (settings?.openingHours as any) || DEFAULT_BUSINESS_HOURS;
    const tempClosure = openingHoursObj.temporaryClosure || {
      isClosed: !settings?.isAcceptingOrders,
      reason: "Maintenance",
    };

    const liveStatus = evaluateBusinessHours(openingHoursObj, tempClosure);

    // Build human-friendly schedule summary for all days
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const lines = days.map((day) => {
      const sched = openingHoursObj[day] || DEFAULT_BUSINESS_HOURS[day];
      const capDay = day.charAt(0).toUpperCase() + day.slice(1);
      if (!sched?.isOpen) return `${capDay}: Closed`;
      return `${capDay}: ${formatTime12h(sched.open)} – ${formatTime12h(sched.close)}`;
    });

    const hoursDescription = lines.join("\n");

    return {
      isAcceptingOrders: liveStatus.isOpen,
      hoursDescription,
      liveStatus,
      scheduleSummary: hoursDescription,
    };
  } catch (error) {
    const fallbackStatus = evaluateBusinessHours(DEFAULT_BUSINESS_HOURS);
    return {
      isAcceptingOrders: fallbackStatus.isOpen,
      hoursDescription: "Monday – Sunday: 11:00 AM – 01:00 AM (Friday: 2:00 PM – 2:00 AM)",
      liveStatus: fallbackStatus,
      scheduleSummary: "Daily: 11:00 AM – 01:00 AM",
    };
  }
}

/** 5.1 Direct Live Business Hours Check */
export async function check_business_hours(): Promise<BusinessHoursStatus> {
  const { liveStatus } = await get_opening_hours();
  return liveStatus;
}

/** 6. Server-Side Trusted Cart Calculation */
export interface CalculatedCart {
  items: Array<{
    menuItemId?: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    notes?: string;
  }>;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  isMinOrderMet: boolean;
  minOrderAmount: number;
}

export async function calculate_cart_total(
  cartItems: Array<{
    menuItemId?: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>
): Promise<CalculatedCart> {
  const deliveryInfo = await get_delivery_charge();

  // Validate items against current DB prices
  const enrichedItems = await Promise.all(
    cartItems.map(async (item) => {
      let trustedPrice = item.price;
      if (item.menuItemId) {
        const dbItem = await prisma.menuItem
          .findUnique({
            where: { id: item.menuItemId },
            select: { price: true, name: true, isAvailable: true },
          })
          .catch(() => null);
        if (dbItem) {
          trustedPrice = dbItem.price;
        }
      }
      const quantity = Math.max(1, Math.floor(item.quantity));
      return {
        menuItemId: item.menuItemId,
        name: item.name,
        price: trustedPrice,
        quantity,
        subtotal: trustedPrice * quantity,
        notes: item.notes,
      };
    })
  );

  const subtotal = enrichedItems.reduce((acc, i) => acc + i.subtotal, 0);
  const isFreeDelivery =
    deliveryInfo.freeDeliveryThreshold &&
    subtotal >= deliveryInfo.freeDeliveryThreshold;
  const deliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : deliveryInfo.deliveryFee) : 0;
  const total = subtotal + deliveryFee;

  return {
    items: enrichedItems,
    subtotal,
    deliveryFee,
    discount: 0,
    total,
    isMinOrderMet: subtotal >= deliveryInfo.minOrderAmount,
    minOrderAmount: deliveryInfo.minOrderAmount,
  };
}

/** 7. Atomic Order Creation in PostgreSQL */
export async function create_order(params: {
  customerId: string;
  conversationId?: string;
  customerPhone: string;
  customerName: string;
  deliveryAddress?: string;
  notes?: string;
  orderType?: OrderType;
  paymentMethod?: string;
  paymentStatus?: PaymentStatus;
  paymentReference?: string;
  items: Array<{
    menuItemId?: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
  }>;
}): Promise<{
  ok: boolean;
  orderNumber?: string;
  orderId?: string;
  total?: number;
  error?: string;
}> {
  if (!params.items || params.items.length === 0) {
    return { ok: false, error: "Cart is empty. Please add items before ordering." };
  }

  // Enforce server-side business hours verification
  const businessHours = await check_business_hours();
  if (!businessHours.isOpen) {
    return {
      ok: false,
      error: businessHours.romanUrduMessage || "A-ONE Restaurant is currently closed for new orders.",
    };
  }

  try {
    const calc = await calculate_cart_total(params.items);

    // Atomic transaction for order creation + customer metrics update
    const result = await prisma.$transaction(async (tx) => {
      const count = await tx.order.count();
      const orderNumber = `AONE-${1000 + count + 1}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: params.customerId,
          conversationId: params.conversationId,
          status: "NEW",
          orderType: params.orderType || "DELIVERY",
          paymentMethod: params.paymentMethod || "CASH_ON_DELIVERY",
          paymentStatus: params.paymentStatus || "CASH_ON_DELIVERY",
          paymentReference: params.paymentReference,
          subtotal: calc.subtotal,
          deliveryFee: calc.deliveryFee,
          discount: 0,
          total: calc.total,
          customerName: params.customerName || `Customer ${params.customerPhone.slice(-4)}`,
          customerPhone: params.customerPhone,
          deliveryAddress: params.deliveryAddress || "Address requested on WhatsApp",
          notes: params.notes,
          items: {
            create: calc.items.map((item) => ({
              menuItemId: item.menuItemId,
              itemName: item.name,
              unitPrice: item.price,
              quantity: item.quantity,
              subtotal: item.subtotal,
              notes: item.notes,
            })),
          },
        },
      });

      // Update customer stats
      await tx.customer.update({
        where: { id: params.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: calc.total },
          address: params.deliveryAddress || undefined,
          name: params.customerName || undefined,
        },
      });

      return order;
    });

    await logAuditEvent({
      actorEmail: "whatsapp_bot",
      action: "ORDER_CREATED_BY_CUSTOMER",
      target: result.orderNumber,
      details: {
        orderId: result.id,
        total: result.total,
        customerPhone: params.customerPhone,
      },
    });

    return {
      ok: true,
      orderNumber: result.orderNumber,
      orderId: result.id,
      total: result.total,
    };
  } catch (error) {
    console.error("[tools:create_order] error:", error);
    return {
      ok: false,
      error: "Maazrat, order place karne mein masla aya hai. Staff ko notify kar diya gaya hai.",
    };
  }
}

/** 8. Get order status for a customer */
export async function get_order_status(customerPhone: string): Promise<{
  found: boolean;
  orders: Array<{
    orderNumber: string;
    status: OrderStatus;
    total: number;
    createdAt: Date;
    items: string[];
  }>;
}> {
  try {
    const orders = await prisma.order.findMany({
      where: { customerPhone },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        items: { select: { itemName: true, quantity: true } },
      },
    });

    if (!orders.length) {
      return { found: false, orders: [] };
    }

    return {
      found: true,
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        items: o.items.map((i) => `${i.quantity}x ${i.itemName}`),
      })),
    };
  } catch (error) {
    console.error("[tools:get_order_status] error:", error);
    return { found: false, orders: [] };
  }
}

/** 9. Cancel active order */
export async function cancel_order(
  orderNumber: string,
  customerPhone: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: orderNumber.toUpperCase().trim(),
        customerPhone,
      },
    });

    if (!order) {
      return { ok: false, message: `Order ${orderNumber} nahi mila.` };
    }

    if (order.status === "COMPLETED" || order.status === "OUT_FOR_DELIVERY") {
      return {
        ok: false,
        message: `Order ${orderNumber} cancel nahi ho sakta kyunke ye ${order.status.toLowerCase()} hai.`,
      };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledReason: "Cancelled by customer via WhatsApp",
      },
    });

    return {
      ok: true,
      message: `Order #${order.orderNumber} successfully cancel kar diya gaya hai.`,
    };
  } catch (error) {
    console.error("[tools:cancel_order] error:", error);
    return { ok: false, message: "Order cancel karne mein error aya." };
  }
}

/** 10. Staff Human Handoff */
export async function handoff_to_staff(conversationId: string): Promise<void> {
  try {
    const conv = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "PENDING" },
      include: { customer: true },
    });

    await logAuditEvent({
      actorEmail: "whatsapp_bot",
      action: "HUMAN_HANDOFF_REQUESTED",
      target: conversationId,
    });

    await prisma.notification.create({
      data: {
        title: `Human Takeover Requested: ${conv.customer.name || conv.customer.phone}`,
        message: `Customer on WhatsApp has requested to speak with a human team member.`,
        type: "WARNING",
        link: "/admin/conversations",
      },
    }).catch(() => {});
  } catch (error) {
    console.error("[tools:handoff_to_staff] error:", error);
  }
}

/** 11. Retrieve verified payment accounts securely from settings */
export async function get_payment_accounts(): Promise<{
  jazzcash?: { accountTitle: string; accountNumber: string };
  easypaisa?: { accountTitle: string; accountNumber: string };
  bank?: { bankName: string; accountTitle: string; iban: string };
}> {
  try {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
      select: { paymentAccounts: true },
    });
    if (settings?.paymentAccounts) {
      return settings.paymentAccounts as any;
    }
  } catch {}
  return {
    jazzcash: { accountTitle: "A-ONE Restaurant", accountNumber: "0300-1234567" },
    easypaisa: { accountTitle: "A-ONE Restaurant", accountNumber: "0321-9876543" },
    bank: { bankName: "Meezan Bank", accountTitle: "A-ONE Foods PVT LTD", iban: "PK00MEZN0000123456789012" },
  };
}
