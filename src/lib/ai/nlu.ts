export type NluIntent =
  | "GREETING"
  | "VIEW_MENU"
  | "CHECK_AVAILABILITY"
  | "ASK_PRICE"
  | "GET_BUSINESS_HOURS"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "SET_QUANTITY"
  | "VIEW_CART"
  | "CLEAR_CART"
  | "GET_TOTAL"
  | "GET_DELIVERY_FEE"
  | "CHECKOUT"
  | "SELECT_ONLINE_PAYMENT"
  | "SELECT_COD"
  | "SUBMIT_TRANSACTION_ID"
  | "CONFIRM_ORDER"
  | "CANCEL_ORDER"
  | "REQUEST_HUMAN"
  | "QUANTITY_ANSWER"
  | "OTHER_QUANTITY"
  | "UNKNOWN";

export interface ParsedQuantity {
  value: number;
  rawMatched: string;
}

export interface NluResult {
  intent: NluIntent;
  confidence: number;
  itemQuery?: string;
  quantity?: number;
  orderNumber?: string;
  transactionId?: string;
  rawText: string;
  language: "en" | "ur" | "ur_roman";
}

const URDU_NUMBERS: Record<string, number> = {
  ek: 1,
  aik: 1,
  ik: 1,
  one: 1,
  "1": 1,
  do: 2,
  two: 2,
  "2": 2,
  teen: 3,
  three: 3,
  "3": 3,
  char: 4,
  chaar: 4,
  four: 4,
  "4": 4,
  paanch: 5,
  panch: 5,
  five: 5,
  "5": 5,
  che: 6,
  chhe: 6,
  chhay: 6,
  six: 6,
  "6": 6,
  saat: 7,
  seven: 7,
  "7": 7,
  aath: 8,
  ath: 8,
  eight: 8,
  "8": 8,
  nau: 9,
  no: 9,
  nine: 9,
  "9": 9,
  das: 10,
  dus: 10,
  ten: 10,
  "10": 10,
  gyara: 11,
  bara: 12,
  tera: 13,
  chauda: 14,
  pandra: 15,
  bees: 20,
  tees: 30,
  chalis: 40,
  pachaas: 50,
  pachas: 50,
  sau: 100,
  so: 100,
  do_sau: 200,
};

/**
 * Extract integer quantity from user input (handles digits, Roman Urdu words, phrases)
 */
export function parseQuantity(text: string): ParsedQuantity | null {
  const clean = text.toLowerCase().trim();

  // 1. Direct digit match (e.g. "100", "5", "25", "100 samosay")
  const digitMatch = clean.match(/^(\d+)\b/) || clean.match(/\b(\d+)\s*(?:pc|pcs|piece|pieces|adet|taadad|adad|burger|biryani|samosa|samosay|pizza|coke|deal|portion)?\b/);
  if (digitMatch && !isNaN(Number(digitMatch[1]))) {
    const qty = Number(digitMatch[1]);
    if (qty > 0 && qty <= 1000) {
      return { value: qty, rawMatched: digitMatch[1] };
    }
  }

  // 2. Named word matches
  for (const [word, num] of Object.entries(URDU_NUMBERS)) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(clean)) {
      return { value: num, rawMatched: word };
    }
  }

  return null;
}

/**
 * Detect language of query: 'ur' | 'ur_roman' | 'en'
 */
export function detectLanguage(text: string): "en" | "ur" | "ur_roman" {
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  const lower = text.toLowerCase();
  const romanKeywords = [
    "kya", "kia", "hai", "hain", "chahiye", "bhai", "yaar", "laga", "kardo", "hata", "batao",
    "kitna", "kitne", "mera", "meri", "hum", "aap", "dost", "samosay", "daal", "do", "bohat"
  ];
  if (romanKeywords.some((w) => new RegExp(`\\b${w}\\b`, "i").test(lower))) {
    return "ur_roman";
  }
  return "en";
}

/**
 * Clean food item name extracted from intent phrases
 */
export function cleanItemName(raw: string): string {
  return raw
    // 1. First strip multi-word conversational phrases & actions
    .replace(/\b(laga\s*do|lagado|add\s*kar\s*do|add\s*karo|add\s*kardo|add|daal\s*do|daaldo|hata\s*do|hatado|remove|nikaal\s*do|chahiye|bhejo|bhej\s*do|mangwao|kitne\s*ka\s*hai|kitne\s*ki\s*hai|available\s*hai|dastyab\s*hai|hai|hain)\b/gi, "")
    // 2. Then strip pronouns, filler words, and quantities/numbers
    .replace(/\b(mujhe|bhai|yaar|dost|please|plz|bhi|aur|sirf|ek|aik|ik|do|teen|char|chaar|paanch|panch|che|saat|aath|nau|das|dus|sau|\d+)\b/gi, "")
    // 3. Normalize non-alphanumeric except hyphen and space
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Analyze customer text and detect structured intent with extracted entities
 */
export function parseNlu(text: string, pendingContext?: {
  pendingQuantityItem?: boolean;
  pendingOrderConfirmation?: boolean;
}): NluResult {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const lang = detectLanguage(clean);

  // 1. Human Handoff Intent
  if (
    lower.includes("human se baat") ||
    lower.includes("staff se baat") ||
    lower.includes("manager se baat") ||
    lower.includes("manager ko bulao") ||
    lower.includes("insan se baat") ||
    lower.includes("insaan se baat") ||
    lower.includes("bande se baat") ||
    lower.includes("agent") ||
    lower.includes("representative") ||
    lower.includes("talk to human") ||
    lower.includes("talk to staff") ||
    lower.includes("talk to manager") ||
    lower.includes("talk to person") ||
    lower.includes("human required") ||
    lower.includes("support team") ||
    lower === "act:talk_staff" ||
    lower === "human" ||
    lower === "staff"
  ) {
    return { intent: "REQUEST_HUMAN", confidence: 0.99, rawText: clean, language: lang };
  }

  // 1.1 Online Payment & COD Selection Intents
  if (
    lower === "online payment" ||
    lower === "online" ||
    lower === "online pay" ||
    lower === "online transfer" ||
    lower === "act:pay_online" ||
    lower.includes("jazzcash") ||
    lower.includes("easypaisa") ||
    lower.includes("bank transfer") ||
    lower.includes("account number") ||
    lower.includes("account details") ||
    lower.includes("online bhej")
  ) {
    return { intent: "SELECT_ONLINE_PAYMENT", confidence: 0.98, rawText: clean, language: lang };
  }

  if (lower === "cod" || lower === "cash on delivery" || lower === "act:pay_cod" || lower.includes("cash on delivery")) {
    return { intent: "SELECT_COD", confidence: 0.98, rawText: clean, language: lang };
  }

  // 1.2 Transaction ID Submission Intent
  const trxMatch = clean.match(/(?:trx|txn|ref|reference|tid|id|number)?\s*[:#-]?\s*([A-Za-z0-9]{5,24})/i);
  if (
    (lower.includes("trx") ||
      lower.includes("txn") ||
      lower.includes("transaction") ||
      lower.includes("reference") ||
      lower.includes("receipt") ||
      lower.includes("bhej diya") ||
      lower.includes("bhej diye") ||
      lower.includes("transfer kar diya") ||
      lower.includes("screenshot")) &&
    trxMatch
  ) {
    return {
      intent: "SUBMIT_TRANSACTION_ID",
      transactionId: trxMatch[1] || clean,
      confidence: 0.95,
      rawText: clean,
      language: lang,
    };
  }

  // 2. Pending Quantity Answer Context Check
  if (pendingContext?.pendingQuantityItem) {
    if (lower === "other" || lower === "aur" || lower === "ziyada" || lower === "other quantity" || lower === "act:qty_other") {
      return { intent: "OTHER_QUANTITY", confidence: 0.99, rawText: clean, language: lang };
    }
    const parsed = parseQuantity(clean);
    if (parsed) {
      return {
        intent: "QUANTITY_ANSWER",
        quantity: parsed.value,
        confidence: 0.95,
        rawText: clean,
        language: lang,
      };
    }
  }

  // 3. Pending Order Confirmation Context Check
  if (pendingContext?.pendingOrderConfirmation) {
    if (
      lower === "haan" ||
      lower === "yes" ||
      lower === "confirm" ||
      lower === "haan confirm" ||
      lower === "order confirm hai" ||
      lower === "confirm order" ||
      lower === "ok" ||
      lower === "theek hai" ||
      lower === "act:confirm_order" ||
      lower.includes("confirm kar do") ||
      lower.includes("haan kardo")
    ) {
      return { intent: "CONFIRM_ORDER", confidence: 0.98, rawText: clean, language: lang };
    }
    if (lower === "cancel" || lower === "nahi" || lower === "no" || lower === "rok do" || lower === "act:cancel_order") {
      return { intent: "CANCEL_ORDER", confidence: 0.95, rawText: clean, language: lang };
    }
  }

  // 4. Cart View & Clear Intents
  if (
    lower === "cart" ||
    lower.includes("mera cart") ||
    lower.includes("cart dikhao") ||
    lower.includes("cart batao") ||
    lower.includes("cart mein kya hai") ||
    lower === "view cart" ||
    lower === "act:view_cart"
  ) {
    return { intent: "VIEW_CART", confidence: 0.95, rawText: clean, language: lang };
  }

  if (
    lower.includes("cart clear") ||
    lower.includes("cart khali") ||
    lower.includes("clear cart") ||
    lower.includes("poora cart clear")
  ) {
    return { intent: "CLEAR_CART", confidence: 0.95, rawText: clean, language: lang };
  }

  // 5. Total & Delivery Fee Queries
  if (
    lower === "total" ||
    lower === "total?" ||
    lower.includes("total kitna") ||
    lower.includes("total kitna bana") ||
    lower.includes("kitne paise bane")
  ) {
    return { intent: "GET_TOTAL", confidence: 0.95, rawText: clean, language: lang };
  }

  if (
    lower.includes("delivery charge") ||
    lower.includes("delivery fee") ||
    lower.includes("delivery charges kitne") ||
    lower.includes("delivery kitni hai")
  ) {
    return { intent: "GET_DELIVERY_FEE", confidence: 0.95, rawText: clean, language: lang };
  }

  // 5.1 Business Hours & Opening Schedule Trigger
  if (
    lower.includes("kab open") ||
    lower.includes("kab khulta") ||
    lower.includes("kab band") ||
    lower.includes("band hotay") ||
    lower.includes("band kab") ||
    lower.includes("aaj open") ||
    lower.includes("kal open") ||
    lower.includes("kal order") ||
    lower.includes("abhi order ho") ||
    lower.includes("timing") ||
    lower.includes("timings") ||
    lower.includes("opening hours") ||
    lower.includes("closing time") ||
    lower.includes("business hours") ||
    lower.includes("oqaat") ||
    lower.includes("kya time hai")
  ) {
    return { intent: "GET_BUSINESS_HOURS", confidence: 0.95, rawText: clean, language: lang };
  }

  // 6. Checkout / Finalize Trigger
  if (
    lower === "order" ||
    lower === "checkout" ||
    lower.includes("order karna hai") ||
    lower.includes("order kar do") ||
    lower.includes("order kardo") ||
    lower.includes("place order") ||
    lower === "act:order_now" ||
    lower === "act:checkout"
  ) {
    return { intent: "CHECKOUT", confidence: 0.92, rawText: clean, language: lang };
  }

  // 7. Explicit Cancel Order
  if (
    lower.includes("cancel order") ||
    lower.includes("order cancel kar do") ||
    lower.includes("cancel my order") ||
    lower.includes("order cancel karna hai")
  ) {
    const orderMatch = clean.match(/AONE-\d+/i);
    return {
      intent: "CANCEL_ORDER",
      orderNumber: orderMatch ? orderMatch[0].toUpperCase() : undefined,
      confidence: 0.9,
      rawText: clean,
      language: lang,
    };
  }

  // 8. Remove from Cart
  if (
    lower.includes("hata do") ||
    lower.includes("remove") ||
    lower.includes("nikaal do") ||
    lower.includes("mat dalo") ||
    lower.includes("cancel kar do")
  ) {
    const itemQuery = cleanItemName(clean);
    if (itemQuery.length >= 2) {
      return {
        intent: "REMOVE_FROM_CART",
        itemQuery,
        confidence: 0.9,
        rawText: clean,
        language: lang,
      };
    }
  }

  // 9. Update / Set Quantity (e.g. "burger 3 kar do", "burger ki quantity 5 kar do")
  if (
    (lower.includes("kar do") || lower.includes("kardo") || lower.includes("quantity")) &&
    /\b\d+\b/.test(clean) &&
    !lower.includes("add")
  ) {
    const parsedQty = parseQuantity(clean);
    const itemQuery = cleanItemName(clean);
    if (parsedQty && itemQuery) {
      return {
        intent: "SET_QUANTITY",
        itemQuery,
        quantity: parsedQty.value,
        confidence: 0.88,
        rawText: clean,
        language: lang,
      };
    }
  }

  // 10. Add to Cart (e.g. "2 burger laga do", "ek coke bhi add kar do", "bhai 5 samosay daal do")
  const isAddKeyword =
    lower.includes("laga do") ||
    lower.includes("lagado") ||
    lower.includes("add") ||
    lower.includes("daal do") ||
    lower.includes("chahiye") ||
    lower.includes("bhejo") ||
    lower.includes("de do");

  const parsedQty = parseQuantity(clean);
  if (isAddKeyword && parsedQty) {
    const itemQuery = cleanItemName(clean);
    if (itemQuery.length >= 2) {
      return {
        intent: "ADD_TO_CART",
        itemQuery,
        quantity: parsedQty.value,
        confidence: 0.92,
        rawText: clean,
        language: lang,
      };
    }
  }

  // 11. Asking Price (e.g. "burger kitne ka hai?", "biryani price?")
  if (
    lower.includes("kitne ka") ||
    lower.includes("kitne ki") ||
    lower.includes("price") ||
    lower.includes("rate") ||
    lower.includes("qeemat")
  ) {
    const itemQuery = cleanItemName(clean);
    return {
      intent: "ASK_PRICE",
      itemQuery: itemQuery || undefined,
      confidence: 0.88,
      rawText: clean,
      language: lang,
    };
  }

  // 12. Check Availability (e.g. "bhai samosa hai?", "coke available hai?")
  if (
    (lower.includes("hai?") || lower.includes("available") || lower.includes("dastyab") || lower.includes("mil jaye")) &&
    !isAddKeyword
  ) {
    const itemQuery = cleanItemName(clean);
    if (itemQuery.length >= 2) {
      return {
        intent: "CHECK_AVAILABILITY",
        itemQuery,
        confidence: 0.88,
        rawText: clean,
        language: lang,
      };
    }
  }

  // 13. Menu / Catalog Queries
  if (
    lower === "menu" ||
    lower === "m" ||
    lower.includes("menu dikhao") ||
    lower.includes("kya kya hai") ||
    lower.includes("kya dishes hain") ||
    lower.includes("items dikhao") ||
    lower === "act:view_menu"
  ) {
    return { intent: "VIEW_MENU", confidence: 0.95, rawText: clean, language: lang };
  }

  // 14. Friendly Greetings
  if (
    lower === "hi" ||
    lower === "hello" ||
    lower === "hey" ||
    lower === "salam" ||
    lower === "assalam o alaikum" ||
    lower === "assalam-o-alaikum" ||
    lower === "assalamu alaikum" ||
    lower === "aoa" ||
    lower === "start" ||
    lower === "restart"
  ) {
    return { intent: "GREETING", confidence: 0.98, rawText: clean, language: lang };
  }

  return { intent: "UNKNOWN", confidence: 0.5, rawText: clean, language: lang };
}
