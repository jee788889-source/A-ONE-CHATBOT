/**
 * A-ONE Restaurant — WhatsApp Channel Copy
 * Exclusively branded for A-ONE Restaurant.
 */

import type { ReplyButton } from "./types";

export type SupportedLanguage = "en" | "ur" | "ur_roman";
type Localised = Record<SupportedLanguage, string>;

export const RESTAURANT_ACTION_PREFIX = "act:";

function pick(copy: Localised, language: SupportedLanguage): string {
  return copy[language] ?? copy.en;
}

// ---------------------------------------------------------------- Welcome ---

const WELCOME: Localised = {
  en: "🍔 *Welcome to A-ONE Restaurant!* 🍕\n\nTaste of Purity, Tradition of Quality. How may we serve you today?\n\nSend *Menu* to browse our dishes or tap an option below.",
  ur: "🍔 *اے ون ریسٹورنٹ میں خوش آمدید!* 🍕\n\nخالص ذائقہ، روایتی معیار۔ ہم آپ کی کیا خدمت کر سکتے ہیں؟\n\nہمارا مینو دیکھنے کے لیے *Menu* لکھیں یا نیچے سے آپشن منتخب کریں۔",
  ur_roman:
    "🍔 *A-ONE Restaurant mein khush aamdeed!* 🍕\n\nZaiqa aur mayaar ka behtareen intikhab. Aaj hum aap ki kya khidmat karein?\n\nMenu dekhne ke liye *Menu* likhein ya neeche diye gaye options mein se select karein.",
};

const WELCOME_FOOTER: Localised = {
  en: "Reply Menu or Order anytime",
  ur: "مینو کے لیے کسی بھی وقت Menu لکھیں",
  ur_roman: "Menu ke liye kisi bhi waqt Menu likhein",
};

export function welcomeMessage(language: SupportedLanguage = "en"): {
  text: string;
  buttons: ReplyButton[];
  footer: string;
} {
  return {
    text: pick(WELCOME, language),
    footer: pick(WELCOME_FOOTER, language),
    buttons: [
      {
        id: `${RESTAURANT_ACTION_PREFIX}VIEW_MENU`,
        title: "📋 View Menu",
      },
      {
        id: `${RESTAURANT_ACTION_PREFIX}ORDER_NOW`,
        title: "🛒 Order Now",
      },
      {
        id: `${RESTAURANT_ACTION_PREFIX}TALK_STAFF`,
        title: "👨‍🍳 Staff Support",
      },
    ],
  };
}

// ----------------------------------------------------------- Quick actions --

const ORDER_CONFIRMED: Localised = {
  en: "✅ *Order Received Successfully!*\n\nThank you for ordering with A-ONE Restaurant. Our kitchen is now preparing your delicious meal. We will update you when it's out for delivery!",
  ur: "✅ *آپ کا آرڈر موصول ہو چکا ہے!*\n\nاے ون ریسٹورنٹ پر اعتماد کا شکریہ۔ ہمارا کچن آپ کے لذیذ کھانے کی تیاری میں مصروف ہے۔ ڈیلیوری نکلتے ہی آپ کو مطلع کر دیا جائے گا۔",
  ur_roman:
    "✅ *Aap ka order receive ho gaya hai!*\n\nA-ONE Restaurant se order karne ka shukriya. Hamara kitchen aap ka khana tayar kar raha hai. Delivery nikalte hi aap ko update mil jayegi!",
};

export function orderConfirmationMessage(orderNumber: string, total: number, language: SupportedLanguage = "en"): string {
  return `${pick(ORDER_CONFIRMED, language)}\n\n📋 *Order #:* ${orderNumber}\n💰 *Total Amount:* Rs. ${total.toLocaleString()}`;
}

const HUMAN_HANDOFF: Localised = {
  en: "👨‍🍳 *Connecting with A-ONE Staff*\n\nA member of our restaurant team has been notified and will assist you shortly.",
  ur: "👨‍🍳 *اے ون ٹیم سے رابطہ*\n\nہماری ٹیم کو اطلاع دے دی گئی ہے، نمائندہ جلد آپ سے رابطہ کرے گا۔",
  ur_roman:
    "👨‍🍳 *A-ONE Team se rabta*\n\nHamari restaurant team ko notify kar diya gaya hai, jaldi koi staff member aap ko reply karega.",
};

export function staffHandoffNotice(language: SupportedLanguage = "en"): string {
  return pick(HUMAN_HANDOFF, language);
}
