/**
 * Shared Domain Types for A-ONE Restaurant.
 * Exclusively branded for A-ONE Restaurant.
 */

export type Role = "OWNER" | "MANAGER" | "STAFF";
export type UserStatus = "ACTIVE" | "INACTIVE" | "INVITED";
export type Channel = "WHATSAPP" | "WEB";
export type ConversationStatus = "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
export type MessageRole = "USER" | "ASSISTANT" | "STAFF" | "SYSTEM";
export type MessageType = "TEXT" | "MENU" | "ORDER_SUMMARY" | "IMAGE" | "LOCATION" | "TEMPLATE";
export type MessageStatus = "SENT" | "DELIVERED" | "READ" | "FAILED";

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "DELIVERY" | "PICKUP" | "DINE_IN";
export type PaymentStatus = "PENDING" | "PAID" | "CASH_ON_DELIVERY" | "FAILED";

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  phone?: string | null;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
}

export interface MenuItemSummary {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  displayOrder: number;
  preparationTime?: number | null;
}

export interface MenuCategorySummary {
  id: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  itemsCount?: number;
  items?: MenuItemSummary[];
}

export interface OrderItemSummary {
  id: string;
  orderId?: string;
  menuItemId?: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  notes?: string | null;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  conversationId?: string | null;
  estimatedDeliveryAt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemSummary[];
}

export interface CustomerSummary {
  id: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
}

export interface MessageSummary {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  messageType: MessageType;
  whatsappMessageId?: string | null;
  status: MessageStatus;
  mediaUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  customerId: string;
  customerPhone: string;
  customerName?: string | null;
  customerAddress?: string | null;
  channel: Channel;
  status: ConversationStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  unreadCount: number;
  lastMessageAt: string;
  lastMessageContent?: string;
  createdAt: string;
  messages?: MessageSummary[];
  orders?: OrderSummary[];
}

export interface RestaurantSettingsSummary {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  deliveryFee: number;
  minOrderAmount: number;
  isAcceptingOrders: boolean;
  openingHours: Record<string, { open: string; close: string; isOpen: boolean }>;
  deliverySettings: {
    standardDeliveryFee: number;
    freeDeliveryThreshold: number;
    estimatedMinutes: number;
    allowedAreas: string[];
  };
  whatsappConfig: {
    welcomeMessage: string;
    autoReplyEnabled: boolean;
    fallbackMessage: string;
  };
  aiSettings: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    strictGuardrails: boolean;
  };
}

export interface AuditLogSummary {
  id: string;
  actorId?: string | null;
  actorEmail: string;
  action: string;
  target?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SubmissionResult {
  ok: boolean;
  reference?: string;
  message?: string;
}

export interface KnowledgeEntry {
  id: string;
  department?: string;
  kind?: string;
  category?: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface ChatAction {
  type: string;
  payload?: Record<string, unknown>;
}

