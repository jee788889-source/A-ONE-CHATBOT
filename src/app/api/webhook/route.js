import { NextResponse } from "next/server";
import axios from "axios";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

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
      { id: "pz_crust_l", title: "Special Crust (Large)", description: "Rs. 1200 (Kabab / Cheese Stuffer)" }
    ]
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
      { id: "deal_8", title: "Deal 8 - Rs. 480", description: "1 Small Pizza + 1 Zinger + 350ml Drink" }
    ]
  },
  cat_burgers: {
    title: "Broast & Burgers",
    rows: [
      { id: "br_q", title: "Quarter Broast - Rs. 700", description: "Crispy fried chicken broast" },
      { id: "br_h", title: "Half Broast - Rs. 1200", description: "Crispy fried chicken broast" },
      { id: "bg_z", title: "Zinger Burger - Rs. 370", description: "Crispy fried chicken fillet" },
      { id: "bg_m", title: "Mighty Zinger - Rs. 430", description: "Double zinger patty loaded" },
      { id: "bg_s", title: "Steaker Burger - Rs. 530", description: "Chef special beef/chicken burger" },
      { id: "wp_z", title: "Zinger Wrap - Rs. 420", description: "Tortilla roll with zinger chunks" }
    ]
  },
  cat_shawarma: {
    title: "Shawarma & Parathas",
    rows: [
      { id: "sh_chk", title: "Chicken Shawarma - Rs. 200", description: "Fresh rolled chicken shawarma" },
      { id: "sh_zng", title: "Zinger Shawarma - Rs. 280", description: "Crispy zinger wrapped with mayo" },
      { id: "pr_kbb", title: "Kabab Paratha - Rs. 320", description: "Grilled kabab in crispy paratha" },
      { id: "pr_mli", title: "Malai Boti Paratha - Rs. 360", description: "Creamy boti in hot paratha" },
      { id: "pr_zng", title: "Zinger Paratha - Rs. 300", description: "Crispy chicken paratha roll" }
    ]
  },
  cat_pasta: {
    title: "Pasta & Fries",
    rows: [
      { id: "pa_sp_s", title: "Special Pasta (S) - Rs. 430", description: "Cheese baked creamy pasta" },
      { id: "pa_sp_l", title: "Special Pasta (L) - Rs. 720", description: "Large baked cheese pasta" },
      { id: "fr_load", title: "Loaded Fries - Rs. 620", description: "Fries with cheese & crispy bites" },
      { id: "fr_pzz", title: "Pizza Fries - Rs. 600", description: "Fries with melted pizza toppings" }
    ]
  },
  cat_rice: {
    title: "Rice & Traditional",
    rows: [
      { id: "rc_chk_b", title: "Chicken Biryani - Rs. 380", description: "Fresh hot chicken biryani" },
      { id: "rc_sp_b", title: "Special Biryani - Rs. 440", description: "Double chicken loaded biryani" },
      { id: "rc_chk_p", title: "Chicken Pulao - Rs. 380", description: "Aroma rice with spiced chicken" },
      { id: "rc_bf_p", title: "Beef Pulao - Rs. 430", description: "Traditional seasoned beef pulao" }
    ]
  },
  cat_family: {
    title: "Family & Summer Deals",
    rows: [
      { id: "fam_1", title: "Family Deal 1 - Rs. 3180", description: "2 Large Pizza + Fries + Broast + 1.5L Drink" },
      { id: "fam_2", title: "Family Deal 2 - Rs. 3000", description: "2 Large Pizzas + 1.5L Drink" },
      { id: "sum_2", title: "Summer Deal 2 - Rs. 1900", description: "4 Zingers + 2 Brownies + 1.5L Drink" },
      { id: "sum_4", title: "Summer Deal 4 - Rs. 690", description: "2 Chicken Burgers + 1 Sm Fries + 1 Drink" }
    ]
  }
};

async function sendToWhatsApp(to, data) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to, ...data },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
  } catch (err) {
    console.error("WhatsApp Error:", err.response?.data || err.message);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const entry = body?.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    if (!message) return NextResponse.json({ status: "ignored" });
    const from = message.from;

    if (message.type === "text") {
      const text = message.text.body.toLowerCase().trim();

      if (text.includes("salam") || text.includes("سلام")) {
        await sendToWhatsApp(from, {
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: "Walaikum Assalam! Ji main A-One Foods se baat kar raha hoon. Aapki khidmat ke liye hazir hain. Neeche button se menu dekhein:" },
            action: {
              buttons: [
                { type: "reply", reply: { id: "btn_show_menu", title: "📜 View Menu" } },
                { type: "reply", reply: { id: "btn_show_deals", title: "🔥 Special Deals" } },
                { type: "reply", reply: { id: "btn_lang_menu", title: "🌐 Language" } }
              ]
            }
          }
        });
      } else if (text === "hi" || text === "hello" || text === "hey") {
        await sendToWhatsApp(from, {
          type: "interactive",
          interactive: {
            type: "button",
            body: { text: "Assalam-o-Alaikum! A-One Foods mein khushamdeed. Main A-One se baat kar raha hoon. Neeche click karke menu check karein:" },
            action: {
              buttons: [
                { type: "reply", reply: { id: "btn_show_menu", title: "📜 View Menu" } },
                { type: "reply", reply: { id: "btn_show_deals", title: "🔥 Special Deals" } },
                { type: "reply", reply: { id: "btn_lang_menu", title: "🌐 Language" } }
              ]
            }
          }
        });
      } else if (text.includes("kam") || text.includes("discount") || text.includes("riayat") || text.includes("kam karo")) {
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: "Janab hamari quality aur taza ingredients par koi compromise nahi hota, is liye rates bilkul fixed aur munasib hain. Aap ek baar try karein, inshallah paisa wasool hoga!" }
        });
      } else {
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: "Shukriya! Aapka message mil gaya hai. Naya order select karne ke liye 'Hi' likh kar bhejein." }
        });
      }
    }

    if (message.type === "interactive") {
      const actionId = message.interactive.button_reply?.id || message.interactive.list_reply?.id;
      const title = message.interactive.button_reply?.title || message.interactive.list_reply?.title;

      if (actionId === "btn_show_menu") {
        await sendToWhatsApp(from, {
          type: "interactive",
          interactive: {
            type: "list",
            header: { type: "text", text: "A-One Foods Menu" },
            body: { text: "Apni pasand ki category choose karein:" },
            action: {
              button: "Categories",
              sections: [{
                title: "Categories",
                rows: [
                  { id: "cat_pizza", title: "🍕 Pizza", description: "Regular, Special & Stuffed Crust" },
                  { id: "cat_deals", title: "🔥 Special Deals", description: "Deal 1 se Deal 17 tak" },
                  { id: "cat_burgers", title: "🍔 Broast & Burgers", description: "Broast, zingers aur wraps" },
                  { id: "cat_shawarma", title: "🌯 Shawarma & Parathas", description: "Shawarma aur crispy rolls" },
                  { id: "cat_pasta", title: "🍝 Pasta & Fries", description: "Baked pasta aur fries" },
                  { id: "cat_rice", title: "🍚 Rice & Traditional", description: "Biryani, pulao aur zarda" }
                ]
              }]
            }
          }
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
                sections: [{ title: catData.title, rows: catData.rows }]
              }
            }
          });
        }
      } else {
        await sendToWhatsApp(from, {
          type: "text",
          text: { body: `Aapne select kiya: *${title}*\n\nAb bas 2 cheezein likh kar bhej dein:\n1. Quantity (kitne chahiye)\n2. Delivery Address aur Phone Number` }
        });
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
