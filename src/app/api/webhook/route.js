import { NextResponse } from "next/server";
import axios from "axios";
import { getRestaurantSettings } from "@/lib/settings-store";
import { getWhatsAppCredentials } from "@/lib/whatsapp/client";
import { MENU_CATEGORIES_LIST, MENU_DATA, findItemById } from "@/lib/whatsapp/menu-catalog";
import { generateMultiProviderReply } from "@/lib/ai/multi-provider";

// Multi-User Session Map (Track each customer phone number separately)
const userSessions = new Map();

function getSession(phone) {
  if (!userSessions.has(phone)) {
    userSessions.set(phone, {
      language: "ROMAN_URDU",
      step: "IDLE",
      selectedItem: null,
      selectedItemDetails: null,
      quantity: null,
      address: null,
      cart: [],
    });
  }
  return userSessions.get(phone);
}

function resetSession(phone) {
  const current = getSession(phone);
  userSessions.set(phone, {
    language: current.language || "ROMAN_URDU",
    step: "IDLE",
    selectedItem: null,
    selectedItemDetails: null,
    quantity: null,
    address: null,
    cart: [],
  });
}

async function sendWhatsApp(to, data) {
  try {
    const creds = await getWhatsAppCredentials();
    if (!creds.phoneId || !creds.token) {
      console.warn("[webhook route] WHATSAPP_TOKEN or PHONE_NUMBER_ID not configured.");
      return;
    }
    await axios.post(
      `https://graph.facebook.com/${creds.apiVersion || "v21.0"}/${creds.phoneId}/messages`,
      { messaging_product: "whatsapp", to, ...data },
      { headers: { Authorization: `Bearer ${creds.token}` } }
    );
  } catch (err) {
    console.error("WhatsApp Send Error:", err.response?.data || err.message);
  }
}

// =============================================================================
//  DETERMINISTIC FLOWS (100% NATIVE WHATSAPP - NO GEMINI)
// =============================================================================

// Flow 1: Greeting & Language Trigger
async function sendLanguageSelection(to) {
  const bodyText =
    "Assalam-o-Alaikum! A-One Foods mein khushamdeed.\nApni zaban muntakhib karein / Select Language:";

  await sendWhatsApp(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: [
          { type: "reply", reply: { id: "set_lang_roman", title: "🇵🇰 Roman Urdu" } },
          { type: "reply", reply: { id: "set_lang_urdu", title: "🇵🇰 اردو" } },
          { type: "reply", reply: { id: "set_lang_en", title: "🇬🇧 English" } },
        ],
      },
    },
  });
}

// Flow 2: Main Menu Buttons (Based on locked user language)
async function sendMainMenuButtons(to, language = "ROMAN_URDU") {
  let bodyText =
    "Aapki khidmat ke liye hazir hain. Khana dekhne ke liye neeche button par tap karein:";
  let btnMenuTitle = "📜 View Menu";
  let btnDealsTitle = "🔥 Special Deals";
  let btnStaffTitle = "👨‍🍳 Staff Support";

  if (language === "URDU") {
    bodyText =
      "اے ون فوڈز میں خوش آمدید! کھانا دیکھنے کے لیے نیچے دیے گئے بٹن پر ٹیپ کریں:";
    btnMenuTitle = "📜 مینو دیکھیں";
    btnDealsTitle = "🔥 اسپیشل ڈیلز";
    btnStaffTitle = "👨‍🍳 عملے سے رابطہ";
  } else if (language === "ENGLISH") {
    bodyText =
      "Welcome to A-One Foods! Please tap a button below to view our menu and deals:";
    btnMenuTitle = "📜 View Menu";
    btnDealsTitle = "🔥 Special Deals";
    btnStaffTitle = "👨‍🍳 Staff Support";
  }

  await sendWhatsApp(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: [
          { type: "reply", reply: { id: "btn_show_menu", title: btnMenuTitle.slice(0, 20) } },
          { type: "reply", reply: { id: "btn_show_deals", title: btnDealsTitle.slice(0, 20) } },
          { type: "reply", reply: { id: "btn_staff_help", title: btnStaffTitle.slice(0, 20) } },
        ],
      },
    },
  });
}

// Flow 3: Drawer/Folder Style Category List (WhatsApp type: "list")
async function sendCategoriesList(to, language = "ROMAN_URDU") {
  let headerText = "A-One Foods Menu";
  let bodyText = "Categories dekhne ke liye neeche button par tap karein:";
  let buttonTitle = "Categories";

  if (language === "URDU") {
    headerText = "اے ون فوڈز مینو";
    bodyText = "مینو کیٹیگریز دیکھنے کے لیے نیچے بٹن دبائیں:";
    buttonTitle = "کیٹیگریز";
  } else if (language === "ENGLISH") {
    headerText = "A-One Foods Menu";
    bodyText = "Tap the button below to browse categories:";
    buttonTitle = "Categories";
  }

  await sendWhatsApp(to, {
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: headerText },
      body: { text: bodyText },
      footer: { text: "A-One Foods Delivery" },
      action: {
        button: buttonTitle.slice(0, 20),
        sections: [
          {
            title: "Menu Categories",
            rows: MENU_CATEGORIES_LIST,
          },
        ],
      },
    },
  });
}

// Flow 4: Items List Popup (WhatsApp type: "list")
async function sendCategoryItemsList(to, catKey, language = "ROMAN_URDU") {
  const cat = MENU_DATA[catKey] || MENU_DATA.cat_special_deals;
  if (!cat) {
    await sendCategoriesList(to, language);
    return;
  }

  let bodyText = "Apna manpasand item select karein:";
  let buttonTitle = "Items List";

  if (language === "URDU") {
    bodyText = "اپنا پسندیدہ آئٹم منتخب کریں:";
    buttonTitle = "آئٹمز لسٹ";
  } else if (language === "ENGLISH") {
    bodyText = "Please select your favorite item:";
    buttonTitle = "Items List";
  }

  await sendWhatsApp(to, {
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: cat.title.substring(0, 60) },
      body: { text: bodyText },
      action: {
        button: buttonTitle.slice(0, 20),
        sections: [
          {
            title: cat.title.substring(0, 24),
            rows: cat.rows.slice(0, 10),
          },
        ],
      },
    },
  });
}

// Flow 5: 1-Tap Item Confirmation Buttons
async function sendItemConfirmation(to, item, language = "ROMAN_URDU") {
  let bodyText = `Aapne select kiya: *${item.title}*\n${item.description}\n\nKya yehi finalize karna hai?`;
  let btnConfirm = "✅ Order Now";
  let btnMore = "➕ Aur Dekhein";
  let btnLang = "🌐 Zaban Badlein";

  if (language === "URDU") {
    bodyText = `آپ کا انتخاب: *${item.title}*\n${item.description}\n\nکیا آپ یہ آرڈر فائنل کرنا چاہتے ہیں؟`;
    btnConfirm = "✅ آرڈر کریں";
    btnMore = "➕ مزید دیکھیں";
    btnLang = "🌐 زبان تبدیل کریں";
  } else if (language === "ENGLISH") {
    bodyText = `You selected: *${item.title}*\n${item.description}\n\nWould you like to confirm this order?`;
    btnConfirm = "✅ Order Now";
    btnMore = "➕ View More";
    btnLang = "🌐 Change Lang";
  }

  await sendWhatsApp(to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: [
          { type: "reply", reply: { id: "btn_confirm_order", title: btnConfirm.slice(0, 20) } },
          { type: "reply", reply: { id: "btn_show_menu", title: btnMore.slice(0, 20) } },
          { type: "reply", reply: { id: "btn_change_lang", title: btnLang.slice(0, 20) } },
        ],
      },
    },
  });
}

// Meta Webhook Verification
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const creds = await getWhatsAppCredentials();
  const validToken = creds.verifyToken || process.env.VERIFY_TOKEN;

  if (mode === "subscribe" && token === validToken) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// Incoming Messages Handler
export async function POST(request) {
  try {
    const body = await request.json();
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    console.log(">>> [ACTIVE WEBHOOK HIT: /api/webhook] Received incoming message:", JSON.stringify(message, null, 2));

    if (!message) return NextResponse.json({ status: "ignored" });
    const from = message.from;
    const session = getSession(from);

    // =========================================================================
    //  1. TEXT INBOUND MESSAGES
    // =========================================================================
    if (message.type === "text") {
      const text = message.text.body.trim();
      const lower = text.toLowerCase();

      // Flow: Awaiting Order Details (Quantity & Address)
      if (session.step === "AWAITING_ORDER_DETAILS" || session.step === "AWAITING_QUANTITY") {
        if (!session.quantity) {
          session.quantity = text;
          session.step = "AWAITING_ADDRESS";
          await sendWhatsApp(from, {
            type: "text",
            text: {
              body: `Quantity: *${text}* note ho gayi hai.\n\nAb baraye meherbani apna **Delivery Address** bhej dein:`,
            },
          });
          return NextResponse.json({ status: "success" });
        }
      }

      if (session.step === "AWAITING_ADDRESS") {
        session.address = text;
        const summary =
          `✅ *Order Received Successfully!*\n\n` +
          `🍽️ Item: *${session.selectedItem || "Selected Item"}*\n` +
          `🔢 Quantity: *${session.quantity || "1"}*\n` +
          `📍 Delivery Address: *${session.address}*\n` +
          `📞 Phone: *${from}*\n\n` +
          `A-One Kitchen aapka order prepare kar rahi hai. Shukriya! 🛵`;

        await sendWhatsApp(from, { type: "text", text: { body: summary } });
        resetSession(from);
        return NextResponse.json({ status: "success" });
      }

      // Flow 1 Trigger: Greetings / Language Request
      if (
        lower === "hi" ||
        lower === "hello" ||
        lower === "hey" ||
        lower === "start" ||
        lower === "language" ||
        lower === "zaban" ||
        lower === "help" ||
        lower.includes("salam") ||
        lower.includes("سلام")
      ) {
        resetSession(from);
        await sendLanguageSelection(from);
        return NextResponse.json({ status: "success" });
      }

      // Flow 2 / Flow 3 Trigger: Menu Requests
      if (
        lower === "menu" ||
        lower === "m" ||
        lower === "food" ||
        lower === "khana" ||
        lower === "view menu" ||
        lower === "show menu"
      ) {
        resetSession(from);
        await sendCategoriesList(from, session.language);
        return NextResponse.json({ status: "success" });
      }

      // Flow Deals Trigger
      if (lower === "deals" || lower === "deal" || lower === "special deals" || lower === "offers") {
        await sendCategoryItemsList(from, "cat_special_deals", session.language);
        return NextResponse.json({ status: "success" });
      }

      // Price Bargaining Defense (DETERMINISTIC - NEVER CALL GEMINI)
      if (
        lower.includes("kam") ||
        lower.includes("discount") ||
        lower.includes("riayat") ||
        lower.includes("mehanga") ||
        lower.includes("sasta")
      ) {
        await sendWhatsApp(from, {
          type: "text",
          text: {
            body: "Janab hamari quality aur fresh ingredients par koi compromise nahi hota, is liye rates bilkul fixed aur munasib hain. ⭐",
          },
        });
        await sendMainMenuButtons(from, session.language);
        return NextResponse.json({ status: "success" });
      }

      // =======================================================================
      //  CONSTRAINED FALLBACK AI (Gemini 1.5 Pro - General Inquiries Only)
      // =======================================================================
      try {
        const langName =
          session.language === "URDU"
            ? "Urdu"
            : session.language === "ENGLISH"
            ? "English"
            : "Roman Urdu";

        const strictInstruction = `You are the customer assistant for A-One Foods. You must respond in STRICTLY ${langName} (Roman Urdu by default). Maximum 1 short sentence. NEVER generate menu lists or prices. Always tell the user to click the menu button below to order.`;

        const aiResult = await generateMultiProviderReply(text, strictInstruction);
        const reply = aiResult.text || "Ji janab, khana dekhne ke liye 'View Menu' par tap karein.";
        
        await sendWhatsApp(from, { type: "text", text: { body: reply } });
        await sendMainMenuButtons(from, session.language);
      } catch (e) {
        await sendMainMenuButtons(from, session.language);
      }
      return NextResponse.json({ status: "success" });
    }

    // =========================================================================
    //  2. INTERACTIVE BUTTONS & LISTS INBOUND
    // =========================================================================
    if (message.type === "interactive") {
      const actionId = message.interactive.button_reply?.id || message.interactive.list_reply?.id;
      const title = message.interactive.button_reply?.title || message.interactive.list_reply?.title;

      // 2a. Language Selection (Flow 1 -> Flow 2)
      if (
        actionId === "set_lang_roman" ||
        actionId === "set_lang_urdu" ||
        actionId === "set_lang_en" ||
        actionId === "lang_roman" ||
        actionId === "lang_urdu" ||
        actionId === "lang_en"
      ) {
        session.language =
          actionId.includes("urdu") ? "URDU" : actionId.includes("en") ? "ENGLISH" : "ROMAN_URDU";
        await sendMainMenuButtons(from, session.language);
        return NextResponse.json({ status: "success" });
      }

      // 2b. Change Language Button Tapped
      if (actionId === "btn_change_lang") {
        await sendLanguageSelection(from);
        return NextResponse.json({ status: "success" });
      }

      // 2c. View Menu Button Tapped -> Send Category List (Flow 3)
      if (actionId === "btn_show_menu") {
        resetSession(from);
        await sendCategoriesList(from, session.language);
        return NextResponse.json({ status: "success" });
      }

      // 2d. Special Deals Button Tapped -> Send Deals Items List (Flow 4)
      if (actionId === "btn_show_deals") {
        await sendCategoryItemsList(from, "cat_special_deals", session.language);
        return NextResponse.json({ status: "success" });
      }

      // 2e. Staff Support Tapped
      if (actionId === "btn_staff_help") {
        let fallbackMsg =
          "Aapki request staff ko forward kar di gayi hai. Hamara representative jald hi aapse raabta karega.";
        try {
          const { settings } = await getRestaurantSettings();
          if (settings?.whatsappConfig?.fallbackMessage) {
            fallbackMsg = settings.whatsappConfig.fallbackMessage;
          }
        } catch {}

        await sendWhatsApp(from, {
          type: "text",
          text: {
            body: fallbackMsg,
          },
        });
        return NextResponse.json({ status: "success" });
      }

      // 2f. Category Row Tapped -> Send Items List for that category (Flow 4)
      if (actionId && actionId.startsWith("cat_")) {
        await sendCategoryItemsList(from, actionId, session.language);
        return NextResponse.json({ status: "success" });
      }

      // 2g. Confirm Order Tapped -> Ask for Quantity & Delivery Address (Flow 5)
      if (
        actionId === "btn_confirm_order" ||
        actionId === "btn_confirm_item"
      ) {
        session.step = "AWAITING_ORDER_DETAILS";
        await sendWhatsApp(from, {
          type: "text",
          text: {
            body: "Meharbani farma kar Quantity (1, 2...) aur Delivery Address likh kar bhej dein.",
          },
        });
        return NextResponse.json({ status: "success" });
      }

      // 2h. Food Item Row Tapped -> 1-Tap Confirmation Buttons (Flow 5)
      if (actionId) {
        const item = findItemById(actionId) || { id: actionId, title: title || "Selected Item", description: "" };
        session.selectedItem = item.title;
        session.selectedItemDetails = item;
        await sendItemConfirmation(from, item, session.language);
        return NextResponse.json({ status: "success" });
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Webhook POST Error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
