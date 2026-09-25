import { NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/db";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// In-Memory Multi-User Session Store with Human Handoff & Auto-Timeout Support
const userSessions = new Map();
const HUMAN_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes auto-resume timeout

function getUserSession(phone) {
  if (!userSessions.has(phone)) {
    userSessions.set(phone, {
      step: "IDLE",
      status: "AI_ACTIVE",
      aiActive: true,
      unreadAlert: false,
      humanRequestedAt: null,
      selectedItem: null,
      quantity: null,
      address: null,
      lastInteractionAt: Date.now(),
    });
  }
  const session = userSessions.get(phone);

  // Check automated AI Resume timeout (15 minutes inactivity in HUMAN_REQUESTED state)
  if (!session.aiActive && session.humanRequestedAt) {
    if (Date.now() - session.humanRequestedAt > HUMAN_TIMEOUT_MS) {
      session.aiActive = true;
      session.status = "AI_ACTIVE";
      session.unreadAlert = false;
      session.humanRequestedAt = null;
      session.step = "IDLE";

      // Best-effort DB update
      prisma.customer.findUnique({ where: { phone } }).then((cust) => {
        if (cust) {
          prisma.conversation.updateMany({
            where: { customerId: cust.id, status: "PENDING" },
            data: { status: "OPEN" },
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }

  session.lastInteractionAt = Date.now();
  return session;
}

function resetUserSession(phone) {
  const existing = userSessions.get(phone);
  userSessions.set(phone, {
    step: "IDLE",
    status: "AI_ACTIVE",
    aiActive: true,
    unreadAlert: false,
    humanRequestedAt: null,
    selectedItem: null,
    quantity: null,
    address: null,
    lastInteractionAt: Date.now(),
  });
}

// Hardcoded Menu
const MENU_DATA = {
  cat_pizza: {
    title: "Pizzas",
    rows: [
      { id: "pz_reg_s", title: "Regular Pizza (Small)", description: "Rs. 440 (Tikka, Fajita, Supreme)" },
      { id: "pz_reg_m", title: "Regular Pizza (Medium)", description: "Rs. 900 (Tikka, Fajita, Supreme)" },
      { id: "pz_reg_l", title: "Regular Pizza (Large)", description: "Rs. 1300 (Tikka, Fajita, Supreme)" },
      { id: "pz_reg_xl", title: "Regular Pizza (XL)", description: "Rs. 1900 (Tikka, Fajita, Supreme)" },
      { id: "pz_sp_m", title: "Special A-One (Medium)", description: "Rs. 1000 (Malai Boti, BBQ, Achari)" },
      { id: "pz_sp_l", title: "Special A-One (Large)", description: "Rs. 1450 (Malai Boti, BBQ, Achari)" },
      { id: "pz_crust_l", title: "Special Crust (Large)", description: "Rs. 1200 (Kabab / Cheese Stuffer)" },
    ],
  },
  cat_deals: {
    title: "Special Deals",
    rows: [
      { id: "deal_1", title: "Deal 1 - Rs. 580", description: "1 Small Pizza + 350ml Drink" },
      { id: "deal_2", title: "Deal 2 - Rs. 500", description: "1 Patty Burger + 1 Sm Fries + 350ml Drink" },
      { id: "deal_3", title: "Deal 3 - Rs. 810", description: "2 Zinger Burgers + 2 Drinks 350ml" },
      { id: "deal_4", title: "Deal 4 - Rs. 1150", description: "2 Zinger Burgers + 2 Fries + 2 Drinks" },
      { id: "deal_5", title: "Deal 5 - Rs. 750", description: "1 Zinger + 1 Patty + 1 Fries + 2 Drinks" },
      { id: "deal_6", title: "Deal 6 - Rs. 1700", description: "1 Large Pizza + 1 Med Pizza + 1.5L Drink" },
      { id: "deal_7", title: "Deal 7 - Rs. 2650", description: "2 Large Pizzas + 1.5L Drink" },
      { id: "deal_8", title: "Deal 8 - Rs. 480", description: "1 Small Pizza + 1 Zinger + 350ml Drink" },
    ],
  },
  cat_burgers: {
    title: "Broast & Burgers",
    rows: [
      { id: "br_q", title: "Quarter Broast - Rs. 700", description: "Crispy fried chicken broast" },
      { id: "br_h", title: "Half Broast - Rs. 1200", description: "Crispy fried chicken broast" },
      { id: "bg_z", title: "Zinger Burger - Rs. 370", description: "Crispy fried chicken fillet" },
      { id: "bg_m", title: "Mighty Zinger - Rs. 430", description: "Double zinger patty loaded" },
      { id: "bg_s", title: "Steaker Burger - Rs. 530", description: "Chef special beef/chicken burger" },
      { id: "wp_z", title: "Zinger Wrap - Rs. 420", description: "Tortilla roll with zinger chunks" },
    ],
  },
  cat_shawarma: {
    title: "Shawarma & Parathas",
    rows: [
      { id: "sh_chk", title: "Chicken Shawarma - Rs. 200", description: "Fresh rolled chicken shawarma" },
      { id: "sh_zng", title: "Zinger Shawarma - Rs. 280", description: "Crispy zinger wrapped with mayo" },
      { id: "pr_kbb", title: "Kabab Paratha - Rs. 320", description: "Grilled kabab in crispy paratha" },
      { id: "pr_mli", title: "Malai Boti Paratha - Rs. 360", description: "Creamy boti in hot paratha" },
      { id: "pr_zng", title: "Zinger Paratha - Rs. 300", description: "Crispy chicken paratha roll" },
    ],
  },
  cat_pasta: {
    title: "Pasta & Fries",
    rows: [
      { id: "pa_sp_s", title: "Special Pasta (S) - Rs. 430", description: "Cheese baked creamy pasta" },
      { id: "pa_sp_l", title: "Special Pasta (L) - Rs. 720", description: "Large baked cheese pasta" },
      { id: "fr_load", title: "Loaded Fries - Rs. 620", description: "Fries with cheese & crispy bites" },
      { id: "fr_pzz", title: "Pizza Fries - Rs. 600", description: "Fries with melted pizza toppings" },
    ],
  },
  cat_rice: {
    title: "Rice & Traditional",
    rows: [
      { id: "rc_chk_b", title: "Chicken Biryani - Rs. 380", description: "Fresh hot chicken biryani" },
      { id: "rc_sp_b", title: "Special Biryani - Rs. 440", description: "Double chicken loaded biryani" },
      { id: "rc_chk_p", title: "Chicken Pulao - Rs. 380", description: "Aroma rice with spiced chicken" },
      { id: "rc_bf_p", title: "Beef Pulao - Rs. 430", description: "Traditional seasoned beef pulao" },
    ],
  },
  cat_family: {
    title: "Family & Summer Deals",
    rows: [
      { id: "fam_1", title: "Family Deal 1 - Rs. 3180", description: "2 Large Pizza + Fries + Broast + 1.5L Drink" },
      { id: "fam_2", title: "Family Deal 2 - Rs. 3000", description: "2 Large Pizzas + 1.5L Drink" },
      { id: "sum_2", title: "Summer Deal 2 - Rs. 1900", description: "4 Zingers + 2 Brownies + 1.5L Drink" },
      { id: "sum_4", title: "Summer Deal 4 - Rs. 690", description: "2 Chicken Burgers + 1 Sm Fries + 1 Drink" },
    ],
  },
};

async function sendToWhatsApp(to, data) {
  try {
    const formattedTo = to.replace(/[^0-9]/g, "");
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to: formattedTo, ...data },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
  } catch (err) {
    console.error("WhatsApp Error:", err.response?.data || err.message);
  }
}

// Persist message to database for real-time Staff Operations Inbox
async function persistDbMessage(phone, senderName, role, content, statusOverride) {
  try {
    const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;
    let customer = await prisma.customer.findUnique({ where: { phone: formattedPhone } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone: formattedPhone,
          name: senderName || "WhatsApp Customer",
        },
      });
    }

    let conversation = await prisma.conversation.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    const convStatus = statusOverride || (role === "USER" ? undefined : "OPEN");

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          customerId: customer.id,
          channel: "WHATSAPP",
          status: convStatus || "OPEN",
          unreadCount: role === "USER" ? 1 : 0,
          lastMessageAt: new Date(),
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          status: convStatus !== undefined ? convStatus : conversation.status,
          unreadCount: role === "USER" ? conversation.unreadCount + 1 : 0,
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: role === "USER" ? "USER" : "ASSISTANT",
        content,
        messageType: "TEXT",
        status: "DELIVERED",
      },
    });

    return conversation;
  } catch (e) {
    console.warn("[persistDbMessage] best-effort DB notice:", e?.message);
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === (VERIFY_TOKEN || "aone_webhook_secret_token")) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];
    const contact = entry?.contacts?.[0];
    const profileName = contact?.profile?.name;

    if (!message) return NextResponse.json({ status: "ignored" });
    const from = message.from;
    const session = getUserSession(from);

    // Text Messages Handling
    if (message.type === "text") {
      const text = message.text.body.trim();
      const lower = text.toLowerCase();

      // Log inbound user message in DB for staff inbox
      await persistDbMessage(from, profileName, "USER", text);

      // Check if user is triggering Staff Support via keywords
      if (
        lower.includes("staff") ||
        lower.includes("human") ||
        lower.includes("agent") ||
        lower.includes("representative") ||
        lower.includes("operator") ||
        lower.includes("madad") ||
        lower.includes("help")
      ) {
        session.status = "HUMAN_REQUESTED";
        session.aiActive = false;
        session.unreadAlert = true;
        session.humanRequestedAt = Date.now();

        await persistDbMessage(from, profileName, "USER", text, "PENDING");

        const handoffReply = "Aapki request staff ko forward kar di gayi hai. Hamara representative jald hi aapse baat karega.";
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: handoffReply },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", handoffReply, "PENDING");
        return NextResponse.json({ status: "success" });
      }

      // If customer wants to reset or restart via "menu", "hi", "salam" -> Auto-resume AI
      if (lower === "hi" || lower === "hello" || lower === "hey" || lower === "menu" || lower.includes("salam") || lower.includes("سلام")) {
        resetUserSession(from);
        await persistDbMessage(from, profileName, "USER", text, "OPEN");
      }

      // If Human Mode is actively handling this customer and not timed out, don't let AI intervene
      if (!session.aiActive && session.status === "HUMAN_REQUESTED") {
        await persistDbMessage(from, profileName, "USER", text, "PENDING");
        return NextResponse.json({ status: "human_handling" });
      }

      // Check if user is in an active ordering step
      if (session.step === "AWAITING_QUANTITY") {
        session.quantity = text;
        session.step = "AWAITING_ADDRESS";
        const replyMsg = `Quantity: *${text}* note ho gayi hai.\n\nAb meharbani farma kar apna **Mukammal Delivery Address** likh kar bhej dein:`;
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: replyMsg },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", replyMsg);
        return NextResponse.json({ status: "success" });
      }

      if (session.step === "AWAITING_ADDRESS") {
        session.address = text;
        const summary =
          `Shukriya! Aapka Order confirm ho chuka hai:\n\n` +
          `🍽️ Item: *${session.selectedItem}*\n` +
          `🔢 Quantity: *${session.quantity}*\n` +
          `📍 Delivery Address: *${session.address}*\n` +
          `📞 Phone: *${from}*\n\n` +
          `Hamari team jald hi aap se contact karegi. JazakAllah!`;

        await sendToWhatsApp(from, { type: "text", text: { body: summary } });
        await persistDbMessage(from, profileName, "ASSISTANT", summary);
        resetUserSession(from);
        return NextResponse.json({ status: "success" });
      }

      // Greetings & Common triggers
      if (lower.includes("salam") || lower.includes("سلام")) {
        resetUserSession(from);
        const replyBody = "Walaikum Assalam! Ji main A-One Foods se baat kar raha hoon. Aapki khidmat ke liye hazir hain. Neeche button se menu dekhein:";
        await sendToWhatsApp(from, {
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: replyBody },
            action: {
              buttons: [
                { type: "reply", reply: { id: "btn_show_menu", title: "📜 View Menu" } },
                { type: "reply", reply: { id: "btn_show_deals", title: "🔥 Special Deals" } },
                { type: "reply", reply: { id: "btn_staff_support", title: "👨‍🍳 Staff Support" } },
              ],
            },
          },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", replyBody);
      } else if (lower === "hi" || lower === "hello" || lower === "hey" || lower === "menu") {
        resetUserSession(from);
        const replyBody = "Assalam-o-Alaikum! A-One Foods mein khushamdeed. Main A-One se baat kar raha hoon. Neeche click karke menu check karein:";
        await sendToWhatsApp(from, {
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: replyBody },
            action: {
              buttons: [
                { type: "reply", reply: { id: "btn_show_menu", title: "📜 View Menu" } },
                { type: "reply", reply: { id: "btn_show_deals", title: "🔥 Special Deals" } },
                { type: "reply", reply: { id: "btn_staff_support", title: "👨‍🍳 Staff Support" } },
              ],
            },
          },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", replyBody);
      } else if (lower.includes("kam") || lower.includes("discount") || lower.includes("riayat") || lower.includes("mehanga")) {
        const replyBody = "Janab hamari quality aur taza ingredients par koi compromise nahi hota, is liye rates bilkul fixed aur munasib hain. Aap ek baar try karein, inshallah paisa wasool hoga!";
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: replyBody },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", replyBody);
      } else {
        const replyBody = "Khana order karne ke liye 'Hi' ya 'Menu' likh kar bhejein aur options select karein.";
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: replyBody },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", replyBody);
      }
    }

    // Interactive Button / List Handling
    if (message.type === "interactive") {
      const actionId = message.interactive.button_reply?.id || message.interactive.list_reply?.id;
      const title = message.interactive.button_reply?.title || message.interactive.list_reply?.title;

      await persistDbMessage(from, profileName, "USER", `[Tapped: ${title || actionId}]`);

      // Staff Support Handoff Trigger
      if (actionId === "btn_staff_support") {
        session.status = "HUMAN_REQUESTED";
        session.aiActive = false;
        session.unreadAlert = true;
        session.humanRequestedAt = Date.now();

        await persistDbMessage(from, profileName, "USER", "[Requested Staff Support]", "PENDING");

        const handoffReply = "Aapki request staff ko forward kar di gayi hai. Hamara representative jald hi aapse baat karega.";
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: handoffReply },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", handoffReply, "PENDING");
        return NextResponse.json({ status: "success" });
      }

      if (actionId === "btn_show_menu") {
        resetUserSession(from);
        await persistDbMessage(from, profileName, "USER", "[View Menu Tap]", "OPEN");
        await sendToWhatsApp(from, {
          type: "interactive",
          interactive: {
            type: "list",
            header: { type: "text", text: "A-One Foods Menu" },
            body: { text: "Apni pasand ki category choose karein:" },
            action: {
              button: "Categories",
              sections: [
                {
                  title: "Categories",
                  rows: [
                    { id: "cat_pizza", title: "🍕 Pizza", description: "Regular, Special & Stuffed Crust" },
                    { id: "cat_deals", title: "🔥 Special Deals", description: "Deal 1 se Deal 8 tak" },
                    { id: "cat_burgers", title: "🍔 Broast & Burgers", description: "Broast, zingers aur wraps" },
                    { id: "cat_shawarma", title: "🌯 Shawarma & Parathas", description: "Shawarma aur crispy rolls" },
                    { id: "cat_pasta", title: "🍝 Pasta & Fries", description: "Baked pasta aur fries" },
                    { id: "cat_rice", title: "🍚 Rice & Traditional", description: "Biryani, pulao aur traditional" },
                    { id: "cat_family", title: "👨‍👩‍👧‍👦 Family & Summer Deals", description: "Family boxes aur combos" },
                  ],
                },
              ],
            },
          },
        });
      } else if (actionId === "btn_show_deals" || actionId.startsWith("cat_")) {
        const catKey = actionId === "btn_show_deals" ? "cat_deals" : actionId;
        const catData = MENU_DATA[catKey];
        if (catData) {
          await sendToWhatsApp(from, {
            type: "interactive",
            interactive: {
              type: "list",
              header: { type: "text", text: catData.title },
              body: { text: "Apna manpasand item select karein:" },
              action: {
                button: "Items List",
                sections: [{ title: catData.title, rows: catData.rows }],
              },
            },
          });
        }
      } else {
        // Item is selected by the user
        session.selectedItem = title;
        session.step = "AWAITING_QUANTITY";

        const replyBody = `Aapne select kiya: *${title}*\n\nKitni quantity chahiye? (Jaise 1, 2, 3...)`;
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: replyBody },
        });
        await persistDbMessage(from, profileName, "ASSISTANT", replyBody);
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[webhook POST error]:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
