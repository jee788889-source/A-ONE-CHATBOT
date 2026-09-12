/**
 * A-ONE Foods AI Assistant Engine
 * 
 * Multi-lingual: English, Urdu, Roman Urdu
 * Strict zero-hallucination guardrails grounded in verified company & product data.
 */

import { AONE_PRODUCTS, searchProducts, type Product } from "@/data/aone-foods/products";
import { AONE_COMPANY } from "@/data/aone-foods/company";
import { isUrduScript } from "@/lib/utils";

export type DetectedLanguage = "en" | "ur" | "ur_roman";

/**
 * Detect language of user query:
 * - ur: Arabic/Urdu script detected
 * - ur_roman: Roman Urdu vocabulary detected
 * - en: English default
 */
export function detectAOneLanguage(text: string): DetectedLanguage {
  if (isUrduScript(text)) return "ur";

  const lower = text.toLowerCase();
  const romanUrduWords = [
    "kya", "kia", "konsa", "kaunsa", "acha", "achi", "hai", "hain", "kahan", "milta",
    "milte", "chahiye", "bhai", "batao", "bataen", "mujhe", "apka", "aapka", "hum",
    "shukriya", "kitnay", "kitna", "keemat", "qeemat", "zaroorat", "namkeen", "masale",
    "kabab", "samose", "halwa", "chutney", "delivery", "distributor"
  ];

  const matched = romanUrduWords.filter((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(lower)
  );

  if (matched.length >= 1) return "ur_roman";
  return "en";
}

/**
 * System prompt embedding strict factual knowledge of A-ONE Foods.
 */
export function buildSystemPrompt(lang: DetectedLanguage): string {
  const verifiedProducts = AONE_PRODUCTS.map((p) => ({
    name: p.name,
    urduName: p.urduName,
    category: p.category,
    description: p.description,
    sizes: p.verifiedSpecs.availableSizes,
    ingredients: p.verifiedSpecs.ingredients || [],
    availability: p.verifiedSpecs.availability,
  }));

  return `You are the official A-ONE AI Assistant for "A-ONE Foods", a premier Pakistani food brand known for authentic traditional savories (Nimko), recipe spices, frozen savories, and traditional sweets.

IDENTITY & TONE:
- Name: A-ONE AI Assistant
- Tone: Friendly, professional, helpful, concise, natural, customer-focused.
- You must NOT sound robotic.
- You must NOT repeatedly say "How can I help you?", "How are you?", "Please let me know."
- Understand the user's actual question and answer directly.

LANGUAGE INTELLIGENCE:
- Current user detected language: ${lang}
- If user writes in English, reply in English.
- If user writes in Urdu (اردو), reply in polite, natural Urdu.
- If user writes in Roman Urdu, reply naturally in Roman Urdu.
- Never force an English response onto an Urdu or Roman Urdu question.

STRICT ZERO-HALLUCINATION GUARDRAILS:
- ONLY provide factual information that exists in the verified knowledge base below.
- If information is unverified, missing, or unknown, reply with:
  - English: "${AONE_COMPANY.guardrails.unknownEnglish}"
  - Urdu: "${AONE_COMPANY.guardrails.unknownUrdu}"
  - Roman Urdu: "${AONE_COMPANY.guardrails.unknownRomanUrdu}"
- NEVER invent prices, fake ingredients, unverified certifications, delivery guarantees, or claims not verified below.

VERIFIED COMPANY FACTS:
- Company Name: A-ONE Foods
- Head Office: ${AONE_COMPANY.contact.headOffice}
- Secondary Branch: ${AONE_COMPANY.contact.secondaryBranch}
- Official Phone: ${AONE_COMPANY.contact.phone}
- Official Mobile / WhatsApp: ${AONE_COMPANY.contact.mobile}
- Official Instagram: ${AONE_COMPANY.social.instagram} (@aone_foods)
- Operating Hours: ${AONE_COMPANY.contact.hours}
- Halal Status: 100% Halal certified, hygienic food-grade processing.
- Distribution Cities: ${AONE_COMPANY.contact.distributionCities.join(", ")}.

VERIFIED PRODUCT CATALOGUE:
${JSON.stringify(verifiedProducts, null, 2)}

DISTRIBUTOR & BUSINESS INQUIRIES:
- If customer asks about becoming a distributor, bulk supply, or business dealer, explain that A-ONE Foods is expanding distribution across Pakistan. Collect: 1. Full Name, 2. Phone/WhatsApp, 3. City, 4. Type of Inquiry. The team contacts them in 24-48 hours.

HUMAN HANDOFF:
- If user requests to talk to a human or asks for customer service representative, provide the official WhatsApp link (${AONE_COMPANY.contact.whatsappUrl}) or phone number (${AONE_COMPANY.contact.phone}).
`;
}

export interface AssistantResponse {
  message: string;
  products?: Product[];
  showDistributorForm?: boolean;
  showHandoff?: boolean;
  quickReplies?: string[];
}

/**
 * Intelligent Rule-Based Fallback Engine
 * Provides instant, realistic, human-like answers when external LLM API keys are not provided.
 */
export function generateLocalAssistantResponse(
  userText: string,
  history: { role: string; content: string }[]
): AssistantResponse {
  const lang = detectAOneLanguage(userText);
  const lower = userText.toLowerCase();

  // 1. Distributor inquiry
  if (
    lower.includes("distributor") ||
    lower.includes("dealership") ||
    lower.includes("dealer") ||
    lower.includes("wholesale") ||
    lower.includes("bulk supply") ||
    lower.includes("ڈسٹری بیوٹر") ||
    lower.includes("ڈیلرشپ") ||
    lower.includes("ہول سیل")
  ) {
    if (lang === "ur") {
      return {
        message: `اے ون فوڈز کے ڈسٹری بیوشن نیٹ ورک میں شمولیت کے لیے خوش آمدید! ہم پاکستان کے تمام شہروں میں بااعتماد ڈسٹری بیوٹرز اور ہول سیل پارٹنرز کو ویلکم کرتے ہیں۔

براہ کرم نیچے دیے گئے فارم میں اپنا نام، فون نمبر، شہر اور کاروبار کا نام درج کریں۔ ہماری سیلز مینجمنٹ ٹیم ۲۴ سے ۴۸ گھنٹوں میں کمرشل تفصیلات کے ساتھ آپ سے رابطہ کرے گی۔`,
        showDistributorForm: true,
        quickReplies: ["پروڈکٹس دیکھیں", "انسٹاگرام پیج", "نمائندے سے بات"],
      };
    }

    if (lang === "ur_roman") {
      return {
        message: `A-ONE Foods ke authorized distribution network ka hissa banne ke liye khushamdeed! Hum nationwide retail aur wholesale distribution ko expand kar rahe hain.

Aap neeche diye gaye form mein apna Name, Phone/WhatsApp, aur City enter karein. Hamari sales team 24-48 hours mein commercial terms ke sath rabta karegi.`,
        showDistributorForm: true,
        quickReplies: ["Explore Products", "Contact A-ONE", "Talk to a Human"],
      };
    }

    return {
      message: `Welcome to A-ONE Foods Distribution Partnerships! We are actively expanding our retail and wholesale distribution network across Pakistan.

Please fill out the distributor inquiry form below with your name, phone number, city, and business details. Our corporate sales desk will review and contact you within 24–48 business hours with catalogue specifications and trade terms.`,
      showDistributorForm: true,
      quickReplies: ["Explore Products", "Contact Details", "Talk to a Human"],
    };
  }

  // 2. Human handoff / WhatsApp / Agent request
  if (
    lower.includes("talk to a human") ||
    lower.includes("human") ||
    lower.includes("agent") ||
    lower.includes("representative") ||
    lower.includes("call") ||
    lower.includes("whatsapp") ||
    lower.includes("phone number") ||
    lower.includes("contact") ||
    lower.includes("rabta") ||
    lower.includes("نمائندہ") ||
    lower.includes("رابطہ") ||
    lower.includes("فون نمبر")
  ) {
    if (lang === "ur") {
      return {
        message: `ضرور! آپ ہماری کسٹمر سپورٹ اور ڈسٹری بیوشن ٹیم سے براہِ راست رابطہ کر سکتے ہیں۔ آپ واٹس ایپ کے ذریعے فوری چیٹ کر سکتے ہیں یا دفتری اوقات میں کال کر سکتے ہیں۔`,
        showHandoff: true,
        quickReplies: ["پروڈکٹس دیکھیں", "ڈسٹری بیوٹر بنیں"],
      };
    }

    if (lang === "ur_roman") {
      return {
        message: `Zaroor! Main aap ko A-ONE Foods ki team se connect kar deta hoon. Aap direct WhatsApp par message kar sakte hain ya hamare office phone par call kar sakte hain.`,
        showHandoff: true,
        quickReplies: ["Explore Products", "Become a Distributor"],
      };
    }

    return {
      message: `Sure! I can connect you directly with the A-ONE Foods team. Please use our direct WhatsApp desk or call our head office during business hours (9:00 AM – 8:00 PM PKT).`,
      showHandoff: true,
      quickReplies: ["Explore Products", "Become a Distributor"],
    };
  }

  // 3. Product discovery / Specific product search
  const foundProducts = searchProducts(userText);
  const isGeneralProductQuery =
    lower.includes("explore") ||
    lower.includes("product") ||
    lower.includes("show me") ||
    lower.includes("items") ||
    lower.includes("snacks") ||
    lower.includes("nimko") ||
    lower.includes("masala") ||
    lower.includes("spices") ||
    lower.includes("biryani") ||
    lower.includes("samosa") ||
    lower.includes("sweet") ||
    lower.includes("پروڈکٹس") ||
    lower.includes("چیزیں") ||
    lower.includes("دکھاؤ") ||
    lower.includes("کون سے");

  if (isGeneralProductQuery || foundProducts.length > 0) {
    const productsToDisplay = foundProducts.length > 0 ? foundProducts.slice(0, 4) : AONE_PRODUCTS.slice(0, 4);

    if (lang === "ur") {
      return {
        message: `اے ون فوڈز کے معروف اور اعلیٰ معیار کے پروڈکٹس درج ذیل ہیں:

• **سپیشل مکس نمکو**: چائے اور شام کے لیے کرسپی سنہری نمکین۔
• **سپیشل سندھی بریانی مصالحہ**: روایتی آلو بخارے اور خوشبودار مصالحوں کا دیگی ذائقہ۔
• **خستہ کاک ٹیل سموسے (فروزن)**: صرف ۵ منٹ میں تیار ہونے والے خستہ سموسے۔
• **شاہی گلاب جامن**: خالص کھوئے اور زعفرانی عرقِ گلاب کے شربت سے تیار کردہ۔

کسی بھی پروڈکٹ کی تفصیلات یا اجزاء جاننے کے لیے کارڈ پر کلک کریں۔`,
        products: productsToDisplay,
        quickReplies: ["ڈسٹری بیوٹر بنیں", "پروڈکٹ کی معلومات", "نمائندے سے بات"],
      };
    }

    if (lang === "ur_roman") {
      return {
        message: `A-ONE Foods ke verified aur mashhoor products yeh hain:

• **Special Mix Nimko**: Authentic crispy savory blend — tea time ka perfect partner.
• **Sindhi Biryani Masala**: Asli aaloo bukhara aur khushbudar masalon ka balance.
• **Crispy Cocktail Samosas (Frozen)**: Ready-to-fry snack sirf 5 minutes mein.
• **Royal Gulab Jamun**: Khoya solids aur saffron syrup se prepared.

Kisi bhi product ke ingredients ya pack sizes dekhne ke liye 'View Details' par click karein.`,
        products: productsToDisplay,
        quickReplies: ["Become a Distributor", "Product Packaging", "Talk to a Human"],
      };
    }

    return {
      message: `Here are our signature, quality-tested A-ONE Foods products:

• **Special Mix Nimko**: Classic crunchy blend of sev, lentils, peanuts, and spices.
• **Sindhi Biryani Masala**: Chef-crafted whole and ground spices with authentic dried plums.
• **Crispy Cocktail Samosas (Frozen)**: Ready-to-fry golden pastry with spiced potatoes and peas.
• **Royal Gulab Jamun**: Rich khoya dumplings soaked in fragrant cardamom & rose syrup.

Click **View Details** on any card below to see verified ingredients, packaging sizes, and availability.`,
      products: productsToDisplay,
      quickReplies: ["Become a Distributor", "Product Information", "Talk to a Human"],
    };
  }

  // 4. Where to buy / Locations
  if (
    lower.includes("where") ||
    lower.includes("available") ||
    lower.includes("store") ||
    lower.includes("shop") ||
    lower.includes("city") ||
    lower.includes("kahan") ||
    lower.includes("kidhar") ||
    lower.includes("کہاں") ||
    lower.includes("ملتے")
  ) {
    if (lang === "ur") {
      return {
        message: `اے ون فوڈز کے پروڈکٹس فیصل آباد، لاہور، کراچی، راولپنڈی اور ملتان سمیت پاکستان کے تمام بڑے شہروں کے معروف سپر مارکیٹس، جنرل سٹورز اور منظور شدہ ڈسٹری بیوٹرز کے پاس دستیاب ہیں۔

اگر آپ اپنے مخصوص علاقے یا شہر کے ڈسٹری بیوٹر کی معلومات حاصل کرنا چاہتے ہیں تو ہمارے کسٹمر سپورٹ ڈیسک سے واٹس ایپ پر رابطہ کریں۔`,
        showHandoff: true,
        quickReplies: ["پروڈکٹس دیکھیں", "ڈسٹری بیوٹر بنیں"],
      };
    }

    if (lang === "ur_roman") {
      return {
        message: `A-ONE Foods ke products Faisalabad, Lahore, Karachi, Islamabad aur Multan samait major cities ke general grocery stores, supermarts aur authorized dealers par available hain.

Aap apne city ke distributor ke bare mein mazeed janne ke liye direct hamare WhatsApp desk se rabta kar sakte hain.`,
        showHandoff: true,
        quickReplies: ["Explore Products", "Become a Distributor"],
      };
    }

    return {
      message: `A-ONE Foods products are distributed across Pakistan and available in leading supermarkets, retail grocery stores, and authorized regional distributors across Faisalabad, Lahore, Karachi, Rawalpindi, and Multan.

For specific dealer locations in your town, feel free to connect directly with our support desk on WhatsApp.`,
      showHandoff: true,
      quickReplies: ["Explore Products", "Become a Distributor"],
    };
  }

  // 5. Halal / Quality inquiry
  if (
    lower.includes("halal") ||
    lower.includes("quality") ||
    lower.includes("pure") ||
    lower.includes("hygiene") ||
    lower.includes("حلال") ||
    lower.includes("معیار")
  ) {
    if (lang === "ur") {
      return {
        message: `جی ہاں، بالکل! اے ون فوڈز کے ۱۰۰ فیصد پروڈکٹس باقاعدہ حلال تصدیق شدہ ہیں اور اعلیٰ حفظانِ صحت اور کوالٹی کے سخت معیارات پر تیار کیے جاتے ہیں۔ ہماری تمام اشیاء میں صرف معیاری اور خالص اجزاء استعمال کیے جاتے ہیں۔`,
        quickReplies: ["پروڈکٹس دیکھیں", "ڈسٹری بیوٹر بنیں"],
      };
    }

    return {
      message: `Yes, absolutely! 100% of A-ONE Foods products and ingredients are strictly Halal-certified and manufactured in food-grade, hygienic facilities compliant with national quality standards.`,
      quickReplies: ["Explore Products", "Product Information", "Contact Us"],
    };
  }

  // 6. Social media / Instagram
  if (
    lower.includes("instagram") ||
    lower.includes("social") ||
    lower.includes("facebook") ||
    lower.includes("انسٹاگرام")
  ) {
    return {
      message: `Our official Instagram page is **https://www.instagram.com/aone_foods/** (@aone_foods). Follow us for product updates, mouth-watering recipes, and new arrivals!`,
      quickReplies: ["Explore Products", "Contact A-ONE"],
    };
  }

  // 7. Unknown / Out-of-scope question (Strict Anti-Hallucination Guardrail)
  if (
    lower.includes("discount code") ||
    lower.includes("london") ||
    lower.includes("america") ||
    lower.includes("crypto") ||
    lower.includes("weather") ||
    lower.includes("politics")
  ) {
    if (lang === "ur") {
      return {
        message: AONE_COMPANY.guardrails.unknownUrdu,
        showHandoff: true,
        quickReplies: ["پروڈکٹس دیکھیں", "ڈسٹری بیوٹر بنیں"],
      };
    }
    if (lang === "ur_roman") {
      return {
        message: AONE_COMPANY.guardrails.unknownRomanUrdu,
        showHandoff: true,
        quickReplies: ["Explore Products", "Talk to a Human"],
      };
    }
    return {
      message: AONE_COMPANY.guardrails.unknownEnglish,
      showHandoff: true,
      quickReplies: ["Explore Products", "Talk to a Human"],
    };
  }

  // 8. General / Polite Greeting
  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("salam") ||
    lower.includes("assalam") ||
    lower.includes("hey") ||
    lower.includes("کیسے ہو") ||
    lower.includes("سلام")
  ) {
    if (lang === "ur") {
      return {
        message: `وعلیکم السلام! اے ون فوڈز میں خوش آمدید۔ آپ ہمارے روایتی نمکو، خوشبودار مصالحہ جات یا ڈسٹری بیوشن کے بارے میں کچھ بھی پوچھ سکتے ہیں۔`,
        products: AONE_PRODUCTS.slice(0, 2),
        quickReplies: ["پروڈکٹس دکھائیں", "ڈسٹری بیوٹر بنیں", "نمائندے سے رابطہ"],
      };
    }

    if (lang === "ur_roman") {
      return {
        message: `Walaikum Assalam! A-ONE Foods Assistant mein khushamdeed. Main aap ko products, ingredients, aur distributorship ke mutalliq guide kar sakta hoon.`,
        products: AONE_PRODUCTS.slice(0, 2),
        quickReplies: ["Explore Products", "Become a Distributor", "Contact A-ONE"],
      };
    }

    return {
      message: `Hello! 👋 Welcome to A-ONE Foods. How can I help you discover our authentic snacks, spices, frozen delights, or distributor opportunities today?`,
      products: AONE_PRODUCTS.slice(0, 2),
      quickReplies: ["Explore Products", "Become a Distributor", "Contact A-ONE"],
    };
  }

  // Default helpful response with product recommendations
  if (lang === "ur") {
    return {
      message: `میں اے ون فوڈز کے مصدقہ پروڈکٹس، پیکجنگ سائز، اجزاء اور ڈسٹری بیوشن کے بارے میں آپ کی رہنمائی کر سکتا ہوں۔ مزید تفصیلات کے لیے آپ ہم سے براہِ راست بھی رابطہ کر سکتے ہیں۔`,
      products: AONE_PRODUCTS.slice(0, 3),
      quickReplies: ["پروڈکٹس دیکھیں", "ڈسٹری بیوٹر بنیں", "نمائندے سے رابطہ"],
    };
  }

  if (lang === "ur_roman") {
    return {
      message: `Main A-ONE Foods ke verified products, recipe mixes, aur dealership ke hawalay se aap ki madad kar sakta hoon.`,
      products: AONE_PRODUCTS.slice(0, 3),
      quickReplies: ["Explore Products", "Become a Distributor", "Talk to a Human"],
    };
  }

  return {
    message: `I'm here to assist you with verified information regarding A-ONE Foods products, packaging, availability, and distributor applications.`,
    products: AONE_PRODUCTS.slice(0, 3),
    quickReplies: ["Explore Products", "Become a Distributor", "Talk to a Human"],
  };
}
