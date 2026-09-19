/**
 * Multilingual support for A-ONE Restaurant — English · Urdu · Roman Urdu · Punjabi
 * Copyright (c) A-ONE Restaurant.
 */

export type Language = "en" | "ur" | "ur_roman" | "pa";

export const LANGUAGES: readonly Language[] = ["en", "ur", "ur_roman", "pa"] as const;

export interface LanguageProfile {
  id: Language;
  label: string;
  nativeLabel: string;
  speechTag: string;
  rtl: boolean;
  promptDirective: string;
}

export const LANGUAGE_PROFILES: Record<Language, LanguageProfile> = {
  en: {
    id: "en",
    label: "English",
    nativeLabel: "English",
    speechTag: "en-US",
    rtl: false,
    promptDirective: "Reply in clear, professional English.",
  },
  ur: {
    id: "ur",
    label: "Urdu",
    nativeLabel: "اردو",
    speechTag: "ur-PK",
    rtl: true,
    promptDirective:
      "Reply in simple, natural Urdu using Urdu script. Keep menu dish names in English/Urdu.",
  },
  ur_roman: {
    id: "ur_roman",
    label: "Roman Urdu",
    nativeLabel: "Roman Urdu",
    speechTag: "ur-PK",
    rtl: false,
    promptDirective:
      "Reply in conversational Roman Urdu (Urdu words written in English letters).",
  },
  pa: {
    id: "pa",
    label: "Punjabi",
    nativeLabel: "پنجابی",
    speechTag: "pa-PK",
    rtl: true,
    promptDirective: "Reply in natural Punjabi using Shahmukhi script.",
  },
};

const ARABIC_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

const PUNJABI_SCRIPT_MARKERS = [
  "تُسی", "تسی", "اسی", "کِنج", "کیویں", "ہَیگا", "ہَے نا", "میں تینوں",
  "تینوں", "سانوں", "ودھیا", "چنگا", "گل", "نال", "لئی", "دسو", "کر دیو",
];

const ROMAN_URDU_MARKERS = [
  "aap", "ap ", "kya", "kia", "kaise", "kese", "kesay", "kaisay", "hai", "hain",
  "nahi", "nahin", "mujhe", "mujhy", "mera", "meri", "hum", "tum", "kitna",
  "kitni", "kitne", "chahiye", "chahye", "batao", "bataen", "bta", "krna",
  "karna", "kar", "acha", "theek", "thik", "shukriya", "salam", "assalam",
  "janab", "bhai", "sir ji", "ji han", "jee", "please batao", "khana",
  "burger", "biryani", "nimko", "order", "delivery", "rate", "qeemat",
];

const ROMAN_PUNJABI_MARKERS = [
  "tusi", "tussi", "tuhada", "tuhadi", "tuhanu", "asi", "assi", "sanu",
  "menu ", "mainu", "ohna", "ohde", "kiddan", "kidan", "kihda", "kehda",
  "kihdi", "kine", "kinna", "kinni", "ki haal", "ki gall", "kyu ji",
  "karda", "kardi", "karde", "karan", "hunda", "hundi", "hunde",
  "gaya si", "aaya si", "dasso", "dasso ji", "dassan", "changa", "wadhiya",
  "vadhiya", "sohna", "sohni", "gall", "gallan", "naal", "labhna", "chahida",
];

export function detectLanguage(text: string): Language {
  const raw = (text ?? "").trim();
  if (!raw) return "en";

  if (ARABIC_SCRIPT.test(raw)) {
    const punjabiHits = PUNJABI_SCRIPT_MARKERS.filter((m) => raw.includes(m)).length;
    return punjabiHits >= 2 ? "pa" : "ur";
  }

  const lower = ` ${raw.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ")} `;
  const words = lower.trim().split(" ").filter(Boolean);

  const punjabiHits = countMarkers(lower, ROMAN_PUNJABI_MARKERS);
  const urduHits = countMarkers(lower, ROMAN_URDU_MARKERS);

  if (punjabiHits >= 2 || (punjabiHits >= 1 && words.length <= 4)) return "pa";
  if (urduHits >= 2 || (urduHits >= 1 && words.length <= 4)) return "ur_roman";

  return "en";
}

function countMarkers(haystack: string, markers: readonly string[]): number {
  let hits = 0;
  for (const marker of markers) {
    if (haystack.includes(marker.includes(" ") ? marker : ` ${marker} `)) hits += 1;
  }
  return hits;
}

export function isRtl(language: Language): boolean {
  return LANGUAGE_PROFILES[language].rtl;
}

export function speechTagFor(text: string): string {
  return LANGUAGE_PROFILES[detectLanguage(text)].speechTag;
}

export function asLanguage(value: unknown): Language | null {
  return LANGUAGES.includes(value as Language) ? (value as Language) : null;
}

// --------------------------------------------------------------- Dictionary --

type UiKey =
  | "welcome.title"
  | "welcome.subtitle"
  | "welcome.restaurant"
  | "welcome.kitchen"
  | "welcome.restaurantHint"
  | "welcome.kitchenHint"
  | "chat.placeholder"
  | "chat.online"
  | "chat.newChat"
  | "chat.menu"
  | "chat.switch"
  | "chat.voice"
  | "chat.emptyTitle"
  | "chat.disclaimer"
  | "chat.tryAsking"
  | "form.submit"
  | "form.cancel"
  | "form.required";

const DICTIONARY: Record<UiKey, Record<Language, string>> = {
  "welcome.title": {
    en: "Welcome to A-ONE Restaurant",
    ur: "اے ون ریسٹورنٹ میں خوش آمدید",
    ur_roman: "A-ONE Restaurant mein khush aamdeed",
    pa: "اے ون ریسٹورنٹ وچ جی آیاں نوں",
  },
  "welcome.subtitle": {
    en: "Taste of Purity, Tradition of Quality. How may we serve you?",
    ur: "خالص ذائقہ، روایتی معیار۔ ہم آپ کی کیا خدمت کر سکتے ہیں؟",
    ur_roman: "Zaiqa aur mayaar ka intikhab. Aaj aap kya mangwayenge?",
    pa: "خالص سواد تے ودھیا کوالٹی۔ اج کیہڑا کھانا کھاؤ گے؟",
  },
  "welcome.restaurant": {
    en: "A-ONE Menu & Ordering",
    ur: "اے ون مینو اور آرڈر",
    ur_roman: "A-ONE Menu & Order",
    pa: "اے ون مینو",
  },
  "welcome.kitchen": {
    en: "Traditional Savories & Nimko",
    ur: "روایتی نمکو اور اسنیکس",
    ur_roman: "Savories & Nimko",
    pa: "نمکو تے اسنیکس",
  },
  "welcome.restaurantHint": {
    en: "Burgers, Biryani, BBQ, Pizzas & Desserts",
    ur: "برگر، دم بریانی، باربی کیو، پیزا اور میٹھے",
    ur_roman: "Burgers, Biryani, BBQ, Pizza aur Meethe",
    pa: "برگر، بریانی، تکے تے پیزا",
  },
  "welcome.kitchenHint": {
    en: "Signature Mix Nimko, Daal Moth & Snacks",
    ur: "اسپیشل مکس نمکو، دال موٹھ اور چائے کے اسنیکس",
    ur_roman: "Special Mix Nimko, Daal Moth aur Snacks",
    pa: "مکس نمکو تے دال موٹھ",
  },
  "chat.placeholder": {
    en: "Ask about menu, prices, deals or placing an order…",
    ur: "مینو، قیمت، ڈیلز یا آرڈر کے بارے میں پوچھیں…",
    ur_roman: "Menu, prices ya order ke baare mein poochein…",
    pa: "مینو، ریٹ یا آرڈر بارے پُچھو…",
  },
  "chat.online": {
    en: "Online · Ready to take your order",
    ur: "آن لائن · آرڈر کے لیے حاضر",
    ur_roman: "Online · Order ke liye tayar",
    pa: "آن لائن",
  },
  "chat.newChat": {
    en: "New Order",
    ur: "نیا آرڈر",
    ur_roman: "Naya Order",
    pa: "نواں آرڈر",
  },
  "chat.menu": {
    en: "Menu",
    ur: "مینو",
    ur_roman: "Menu",
    pa: "مینو",
  },
  "chat.switch": {
    en: "Categories",
    ur: "اقسام",
    ur_roman: "Categories",
    pa: "کیٹگریز",
  },
  "chat.voice": {
    en: "Voice",
    ur: "آواز",
    ur_roman: "Awaaz",
    pa: "آواز",
  },
  "chat.emptyTitle": {
    en: "What would you like to order today?",
    ur: "آج آپ کا کیا کھانے کا موڈ ہے؟",
    ur_roman: "Aaj aap kya order karna chahte hain?",
    pa: "اج کیہڑا کھانا منگوانا اے؟",
  },
  "chat.disclaimer": {
    en: "Official A-ONE Restaurant assistant. All orders verified directly with kitchen.",
    ur: "اے ون ریسٹورنٹ کا باضابطہ اسسٹنٹ۔ تمام آرڈرز کچن میں تصدیق کیے جاتے ہیں۔",
    ur_roman: "Official A-ONE Restaurant assistant. Tamam orders kitchen se verify hote hain.",
    pa: "اے ون ریسٹورنٹ اسسٹنٹ۔",
  },
  "chat.tryAsking": {
    en: "Popular queries",
    ur: "عام سوالات",
    ur_roman: "Common sawalaat",
    pa: "پُچھو",
  },
  "form.submit": {
    en: "Submit",
    ur: "جمع کرائیں",
    ur_roman: "Submit karein",
    pa: "بھیجو",
  },
  "form.cancel": {
    en: "Cancel",
    ur: "منسوخ",
    ur_roman: "Cancel",
    pa: "منسوخ",
  },
  "form.required": {
    en: "Required",
    ur: "لازمی",
    ur_roman: "Zaroori",
    pa: "لازمی",
  },
};

export function t(key: UiKey, language: Language = "en"): string {
  const entry = DICTIONARY[key];
  if (!entry) return key;
  return entry[language] ?? entry.en;
}
