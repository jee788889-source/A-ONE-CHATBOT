import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import {
  get_menu,
  search_menu,
  check_item_availability,
  get_delivery_charge,
  get_opening_hours,
  check_business_hours,
  calculate_cart_total,
  create_order,
  get_order_status,
  cancel_order,
  handoff_to_staff,
  get_payment_accounts,
} from "./tools";
import {
  withConversationLock,
  getConversationState,
  updateConversationState,
  addToCart,
  setItemQuantity,
  removeFromCart,
  clearCart,
  formatCartText,
} from "./cart";
import { parseNlu, parseQuantity, type NluResult } from "./nlu";
import type { ReplyButton, ListRow } from "@/lib/whatsapp/types";
import { MENU_CATEGORIES_LIST, MENU_DATA, findItemById } from "@/lib/whatsapp/menu-catalog";
import { getRestaurantSettings } from "@/lib/settings-store";
import { generateMultiProviderReply } from "@/lib/ai/multi-provider";
import { getProvider } from "./index";

export interface BotReply {
  text: string;
  buttons?: ReplyButton[];
  list?: {
    buttonLabel: string;
    header?: string;
    rows: ListRow[];
  };
  isHandoff?: boolean;
  orderCreated?: {
    orderNumber: string;
    total: number;
  };
}

/**
 * Main AI Engine for A-ONE Restaurant.
 * Integrates database truth, tool execution, multi-lingual NLU, LLM reasoning,
 * per-conversation state isolation, and zero-hallucination guardrails.
 */
export async function processCustomerMessage(params: {
  rawText: string;
  conversationId: string;
  customerId: string;
  customerPhone: string;
  customerName?: string;
  isButtonPayload?: boolean;
}): Promise<BotReply> {
  return withConversationLock(params.conversationId, async () => {
    const { rawText, conversationId, customerId, customerPhone, customerName } = params;
    const cleanText = rawText.trim();
    const lower = cleanText.toLowerCase();

    // 0. Direct Native WhatsApp Interactive Routing (Language / Menu / Categories / Items / Confirm)
    if (cleanText === "btn_change_lang" || cleanText === "language" || cleanText === "zaban") {
      return {
        text: "Assalam-o-Alaikum! A-One Foods mein khushamdeed.\nApni zaban muntakhib karein / Select Language:",
        buttons: [
          { id: "set_lang_roman", title: "🇵🇰 Roman Urdu" },
          { id: "set_lang_urdu", title: "🇵🇰 اردو" },
          { id: "set_lang_en", title: "🇬🇧 English" },
        ],
      };
    }

    if (
      cleanText === "set_lang_roman" ||
      cleanText === "set_lang_urdu" ||
      cleanText === "set_lang_en" ||
      cleanText === "lang_roman" ||
      cleanText === "lang_urdu" ||
      cleanText === "lang_en"
    ) {
      const selectedLang = cleanText.includes("urdu") ? "ur" : cleanText.includes("en") ? "en" : "roman";
      await updateConversationState(conversationId, { language: selectedLang }, customerId);
      
      let bodyText = "Aapki khidmat ke liye hazir hain. Khana dekhne ke liye neeche button par tap karein:";
      let btnMenu = "📜 View Menu";
      let btnDeals = "🔥 Special Deals";
      let btnStaff = "👨‍🍳 Staff Support";

      if (selectedLang === "ur") {
        bodyText = "اے ون فوڈز میں خوش آمدید! کھانا دیکھنے کے لیے نیچے دیے گئے بٹن پر ٹیپ کریں:";
        btnMenu = "📜 مینو دیکھیں";
        btnDeals = "🔥 اسپیشل ڈیلز";
        btnStaff = "👨‍🍳 عملے سے رابطہ";
      } else if (selectedLang === "en") {
        bodyText = "Welcome to A-One Foods! Please tap a button below to view our menu and deals:";
      }

      return {
        text: bodyText,
        buttons: [
          { id: "btn_show_menu", title: btnMenu.slice(0, 20) },
          { id: "btn_show_deals", title: btnDeals.slice(0, 20) },
          { id: "btn_staff_help", title: btnStaff.slice(0, 20) },
        ],
      };
    }

    if (cleanText === "btn_show_menu" || cleanText === "act:view_menu") {
      return {
        text: "Categories dekhne ke liye neeche button par tap karein:",
        list: {
          buttonLabel: "Categories",
          header: "A-One Foods Menu",
          rows: MENU_CATEGORIES_LIST,
        },
      };
    }

    if (cleanText === "btn_show_deals") {
      return {
        text: "Apna manpasand deal select karein:",
        list: {
          buttonLabel: "Special Deals",
          header: "🔥 Special Deals",
          rows: MENU_DATA.cat_special_deals.rows,
        },
      };
    }

    if (cleanText.startsWith("cat_")) {
      const cat = MENU_DATA[cleanText] || MENU_DATA.cat_special_deals;
      if (cat) {
        return {
          text: "Apna item select karein:",
          list: {
            buttonLabel: "Items List",
            header: cat.title.substring(0, 60),
            rows: cat.rows.slice(0, 10),
          },
        };
      }
    }

    const clickedItem = findItemById(cleanText);
    if (clickedItem) {
      await updateConversationState(
        conversationId,
        {
          pendingOrderConfirmation: true,
          lastDiscussedItem: {
            name: clickedItem.title,
            price: 0,
          },
        },
        customerId
      );
      return {
        text: `Aapne select kiya: *${clickedItem.title}*\n${clickedItem.description}\n\nKya yehi finalize karna hai?`,
        buttons: [
          { id: "btn_confirm_order", title: "✅ Order Now" },
          { id: "btn_show_menu", title: "➕ Aur Dekhein" },
          { id: "btn_change_lang", title: "🌐 Zaban Badlein" },
        ],
      };
    }

    if (cleanText === "btn_confirm_item" || cleanText === "btn_confirm_order") {
      await updateConversationState(
        conversationId,
        { pendingOrderConfirmation: true },
        customerId
      );
      return {
        text: "Meharbani farma kar Quantity (1, 2...) aur Delivery Address likh kar bhej dein.",
      };
    }

    // 1. Check conversation status & Human Handoff State
    let conversationStatus = "OPEN";
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { status: true },
      });
      if (conversation?.status) {
        conversationStatus = conversation.status;
      }
    } catch {
      // Memory state fallback
    }

    if (conversationStatus === "PENDING") {
      // Human Staff has taken over. If customer sends explicit re-activation "menu" or "start", we can resume AI.
      if (lower === "restart" || lower === "start" || lower === "menu" || lower === "act:restart_ai") {
        await prisma.conversation
          .update({
            where: { id: conversationId },
            data: { status: "OPEN" },
          })
          .catch(() => {});
        await updateConversationState(conversationId, { isHumanHandoff: false }, customerId);
      } else {
        // Staff is handling manually — do not auto-reply
        return {
          text: "",
          isHandoff: true,
        };
      }
    }

    // 2. Load conversation isolated state
    const state = await getConversationState(conversationId, customerId);

    // 3. Parse NLU with active conversation context
    const nlu = parseNlu(cleanText, {
      pendingQuantityItem: Boolean(state.pendingQuantityItem),
      pendingOrderConfirmation: Boolean(state.pendingOrderConfirmation),
    });

    const lang = nlu.language;

    // =========================================================================
    //  HANDLE STRUCTURED INTENTS & TOOLS
    // =========================================================================

    // A. HUMAN HANDOFF REQUEST
    if (nlu.intent === "REQUEST_HUMAN" || cleanText === "btn_staff_help") {
      await handoff_to_staff(conversationId);
      await updateConversationState(conversationId, { isHumanHandoff: true }, customerId);
      return {
        text:
          lang === "ur"
            ? "👨‍🍳 *اے ون ٹیم سے رابطہ*\n\nہماری ریسٹورنٹ ٹیم کو مطلع کر دیا گیا ہے۔ ہمارا اسٹاف ممبر جلد آپ سے رابطہ کرے گا۔\n\n_دوبارہ AI آن کرنے کے لیے 'Menu' لکھیں۔_"
            : "👨‍🍳 *Connecting with A-ONE Staff*\n\nA member of our restaurant team has been notified and will assist you shortly in this chat.\n\n_Type 'Menu' anytime to resume automated assistant._",
        isHandoff: true,
      };
    }

    // B. GREETING -> Language Selection
    if (nlu.intent === "GREETING") {
      let welcome = "Assalam-o-Alaikum! A-One Foods mein khushamdeed. Zaban muntakhib karein / Select language:";
      try {
        const { settings } = await getRestaurantSettings();
        if (settings?.whatsappConfig?.welcomeMessage) {
          welcome = settings.whatsappConfig.welcomeMessage;
        }
      } catch {}

      return {
        text: welcome,
        buttons: [
          { id: "lang_roman", title: "🇵🇰 Roman Urdu" },
          { id: "lang_urdu", title: "🇵🇰 اردو" },
          { id: "lang_en", title: "🇬🇧 English" },
        ],
      };
    }

    // C. VIEW MENU -> Native WhatsApp Interactive List (No text dumping)
    if (nlu.intent === "VIEW_MENU") {
      return {
        text: "Categories dekhne ke liye neeche button par tap karein:",
        list: {
          buttonLabel: "Categories",
          header: "A-One Foods Menu",
          rows: MENU_CATEGORIES_LIST,
        },
      };
    }

    // D. CHECK ITEM AVAILABILITY / ASK PRICE
    if (nlu.intent === "CHECK_AVAILABILITY" || nlu.intent === "ASK_PRICE") {
      const query = nlu.itemQuery || cleanText;
      const searchResults = await search_menu(query);

      if (searchResults.length > 0) {
        const item = searchResults[0];

        // Save pending quantity item for quantity flow
        await updateConversationState(
          conversationId,
          {
            pendingQuantityItem: {
              menuItemId: item.id,
              name: item.name,
              price: item.price,
            },
            lastDiscussedItem: {
              menuItemId: item.id,
              name: item.name,
              price: item.price,
            },
          },
          customerId
        );

        const responseText =
          `Ji bilkul! *${item.name}* available hai (Rs. ${item.price}).\n` +
          `Aap kitne ${item.name} lena chahenge?`;

        return {
          text: responseText,
          buttons: [
            { id: "1", title: "1" },
            { id: "2", title: "2" },
            { id: "act:qty_other", title: "Other Quantity" },
          ],
        };
      } else {
        return {
          text: `Maazrat, "${query}" hamare menu mein dastyab nahi hai. Aap hamara poora menu dekhne ke liye *Menu* likhein.`,
          buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
        };
      }
    }

    // E. QUANTITY FLOW: OTHER QUANTITY TRIGGER
    if (nlu.intent === "OTHER_QUANTITY" && state.pendingQuantityItem) {
      const item = state.pendingQuantityItem;
      return {
        text: `Ji, kitne *${item.name}* chahiye? Quantity type kar dein (e.g. 5, 10, 20, 50, 100).`,
      };
    }

    // F. QUANTITY FLOW: QUANTITY ANSWER
    if (nlu.intent === "QUANTITY_ANSWER" && state.pendingQuantityItem && nlu.quantity) {
      const item = state.pendingQuantityItem;
      const qty = nlu.quantity;

      const { cartSummary } = await addToCart(conversationId, customerId, {
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: qty,
      });

      const formatted = formatCartText(cartSummary, lang);
      const text =
        `✅ *${qty}x ${item.name}* cart mein add kar diye gaye hain!\n\n` +
        `${formatted}\n\n` +
        `_Kya mazeed kuch add karna hai ya order confirm karein?_`;

      return {
        text,
        buttons: [
          { id: "act:checkout", title: "✅ Checkout" },
          { id: "act:view_menu", title: "📋 Add More" },
          { id: "act:view_cart", title: "🛒 View Cart" },
        ],
      };
    }

    // G. ADD TO CART DIRECTLY (e.g. "2 burger laga do", "ek coke bhi add karo")
    if (nlu.intent === "ADD_TO_CART") {
      const query = nlu.itemQuery || "";
      const qty = nlu.quantity || 1;

      let matchedItem: { id?: string; name: string; price: number } | null = null;

      if (query) {
        const results = await search_menu(query);
        if (results.length > 0) {
          matchedItem = results[0];
        }
      }

      // If no query extracted but customer previously discussed an item, use context
      if (!matchedItem && state.lastDiscussedItem) {
        matchedItem = state.lastDiscussedItem;
      }

      if (matchedItem) {
        const { cartSummary } = await addToCart(conversationId, customerId, {
          menuItemId: matchedItem.id,
          name: matchedItem.name,
          price: matchedItem.price,
          quantity: qty,
        });

        const formatted = formatCartText(cartSummary, lang);
        return {
          text:
            `✅ *${qty}x ${matchedItem.name}* cart mein add ho gaya!\n\n` +
            `${formatted}\n\n` +
            `_Order place karne ke liye 'Order' ya 'Checkout' likhein._`,
          buttons: [
            { id: "act:checkout", title: "✅ Checkout" },
            { id: "act:view_menu", title: "📋 View Menu" },
            { id: "act:view_cart", title: "🛒 View Cart" },
          ],
        };
      } else {
        // Ask which item
        return {
          text: `Aap kon sa item add karna chahte hain? Humare menu mein Burgers, Biryani, BBQ, Pizza aur Savories hain. Menu dekhne ke liye *Menu* likhein.`,
          buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
        };
      }
    }

    // H. SET QUANTITY (e.g. "burger 3 kar do")
    if (nlu.intent === "SET_QUANTITY" && nlu.itemQuery && nlu.quantity !== undefined) {
      const { cartSummary } = await setItemQuantity(
        conversationId,
        customerId,
        nlu.itemQuery,
        nlu.quantity
      );

      const formatted = formatCartText(cartSummary, lang);
      return {
        text: `✅ Quantity update ho gayi hai.\n\n${formatted}`,
        buttons: [
          { id: "act:checkout", title: "✅ Checkout" },
          { id: "act:view_cart", title: "🛒 View Cart" },
        ],
      };
    }

    // I. REMOVE FROM CART
    if (nlu.intent === "REMOVE_FROM_CART" && nlu.itemQuery) {
      const { cartSummary, removedItemName } = await removeFromCart(
        conversationId,
        customerId,
        nlu.itemQuery
      );

      const formatted = formatCartText(cartSummary, lang);
      return {
        text: removedItemName
          ? `🗑️ *${removedItemName}* cart se remove kar diya gaya hai.\n\n${formatted}`
          : `Item cart mein nahi mila.\n\n${formatted}`,
        buttons: [
          { id: "act:view_cart", title: "🛒 View Cart" },
          { id: "act:view_menu", title: "📋 Add Items" },
        ],
      };
    }

    // J. VIEW CART
    if (nlu.intent === "VIEW_CART") {
      const calc = await calculate_cart_total(state.cart);
      const formatted = formatCartText(calc, lang);

      return {
        text: formatted,
        buttons: calc.items.length
          ? [
              { id: "act:checkout", title: "✅ Checkout" },
              { id: "act:view_menu", title: "📋 Add More" },
              { id: "act:clear_cart", title: "🗑️ Clear Cart" },
            ]
          : [{ id: "act:view_menu", title: "📋 View Menu" }],
      };
    }

    // K. CLEAR CART
    if (nlu.intent === "CLEAR_CART") {
      await clearCart(conversationId, customerId);
      return {
        text: "🗑️ Aap ka cart poora clear kar diya gaya hai. Naya order shuru karne ke liye *Menu* likhein.",
        buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
      };
    }

    // L. GET TOTAL
    if (nlu.intent === "GET_TOTAL") {
      const calc = await calculate_cart_total(state.cart);
      if (!calc.items.length) {
        return {
          text: "Aap ka cart abhi khali hai. Total calculate karne ke liye pehle menu se items add karein.",
          buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
        };
      }

      return {
        text:
          `💰 *Total Summary:*\n` +
          `• Subtotal: *Rs. ${calc.subtotal.toLocaleString()}*\n` +
          `• Delivery Fee: *Rs. ${calc.deliveryFee}*\n` +
          `• *Total: Rs. ${calc.total.toLocaleString()}*\n\n` +
          `Order place karne ke liye *Order* likhein.`,
        buttons: [{ id: "act:checkout", title: "✅ Checkout" }],
      };
    }

    // M. GET DELIVERY FEE
    if (nlu.intent === "GET_DELIVERY_FEE") {
      const del = await get_delivery_charge();
      return {
        text:
          `🚚 *Delivery Information:*\n` +
          `• Standard Delivery Charges: *Rs. ${del.deliveryFee}*\n` +
          `• Free Delivery: *Rs. ${del.freeDeliveryThreshold?.toLocaleString()}* se ooper ke orders par free delivery!\n` +
          `• Minimum Order: *Rs. ${del.minOrderAmount}*\n` +
          `• Estimated Time: ~35-45 minutes.`,
        buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
      };
    }

    // M.1 GET BUSINESS HOURS / SCHEDULE INQUIRY
    if (nlu.intent === "GET_BUSINESS_HOURS") {
      const { hoursDescription, liveStatus } = await get_opening_hours();
      let timingText = "";

      if (lang === "ur") {
        timingText =
          `🕒 *اے ون ریسٹورنٹ کے اوقاتِ کار*\n\n` +
          `${hoursDescription}\n\n` +
          (liveStatus.isOpen
            ? `🟢 *اس وقت ریسٹورنٹ کھلا ہے اور آرڈرز قبول کیے جا رہے ہیں!*\nکھانا آرڈر کرنے کے لیے *Menu* لکھیں۔`
            : `🔴 *${liveStatus.urduMessage}*\nآپ مینو چیک کر سکتے ہیں اور اوقاتِ کار کے دوران اپنا آرڈر پلیس کر سکتے ہیں۔`);
      } else {
        timingText =
          `🕒 *A-ONE RESTAURANT BUSINESS HOURS*\n\n` +
          `${hoursDescription}\n\n` +
          (liveStatus.isOpen
            ? `🟢 *We are currently OPEN and accepting orders!*\nType *Menu* to browse dishes or start your order.`
            : `🔴 *${liveStatus.romanUrduMessage}*\nYou can browse our menu anytime and order during open hours.`);
      }

      return {
        text: timingText,
        buttons: [
          { id: "act:view_menu", title: "📋 View Menu" },
          { id: "act:talk_staff", title: "👨‍🍳 Staff Support" },
        ],
      };
    }

    // N. CHECKOUT / ORDER INITIATION
    if (nlu.intent === "CHECKOUT") {
      // 1. Enforce business hours check
      const businessHours = await check_business_hours();
      if (!businessHours.isOpen) {
        return {
          text:
            lang === "ur"
              ? `🔴 *اے ون ریسٹورنٹ اس وقت بند ہے*\n\n${businessHours.urduMessage}\n\nآپ ہمارے مینو آئٹمز دیکھ سکتے ہیں۔ آرڈر دینے کے لیے برائے مہربانی اوقاتِ کار میں تشریف لائیں۔`
              : `🔴 *A-ONE Restaurant is currently closed*\n\n${businessHours.romanUrduMessage}\n\nYou can browse our menu anytime. Please message us during open hours to place your order happily! 🍔🍕`,
          buttons: [
            { id: "act:view_menu", title: "📋 View Menu" },
            { id: "act:view_cart", title: "🛒 View Cart" },
            { id: "act:talk_staff", title: "👨‍🍳 Staff Support" },
          ],
        };
      }
      if (!state.cart.length) {
        return {
          text: "Aap ka cart abhi khali hai. Order karne ke liye pehle menu se items add karein.",
          buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
        };
      }

      const calc = await calculate_cart_total(state.cart);
      if (!calc.isMinOrderMet) {
        return {
          text: `⚠️ Minimum order amount Rs. ${calc.minOrderAmount} hai. Aap ka current subtotal Rs. ${calc.subtotal} hai. Baraye meherbani kuch mazeed items add karein.`,
          buttons: [{ id: "act:view_menu", title: "📋 Add Items" }],
        };
      }

      // Mark pending confirmation in state
      await updateConversationState(
        conversationId,
        { pendingOrderConfirmation: true, pendingOnlinePayment: false, pendingTransactionId: false },
        customerId
      );

      const formatted = formatCartText(calc, lang);
      const text =
        `📋 *ORDER SUMMARY*\n\n` +
        `${formatted}\n` +
        `📍 *Delivery To:* ${customerPhone}\n\n` +
        `*Aap payment kis tareeqay se karna chahenge?*`;

      return {
        text,
        buttons: [
          { id: "act:pay_cod", title: "💵 Cash on Delivery" },
          { id: "act:pay_online", title: "💳 Online Payment" },
          { id: "act:view_cart", title: "🛒 Edit Cart" },
        ],
      };
    }

    // N.1 SELECT ONLINE PAYMENT
    if (nlu.intent === "SELECT_ONLINE_PAYMENT") {
      if (!state.cart.length) {
        return {
          text: "Aap ka cart abhi khali hai. Online payment se pehle menu se items add karein.",
          buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
        };
      }

      const calc = await calculate_cart_total(state.cart);
      const accounts = await get_payment_accounts();

      await updateConversationState(
        conversationId,
        {
          paymentMethod: "ONLINE_TRANSFER",
          pendingOnlinePayment: true,
          pendingTransactionId: true,
          pendingOrderConfirmation: false,
        },
        customerId
      );

      let paymentText = `💳 *A-ONE RESTAURANT ONLINE PAYMENT DETAILS*\n\n`;
      paymentText += `• *Total Amount:* *Rs. ${calc.total.toLocaleString()}*\n\n`;

      if (accounts.jazzcash) {
        paymentText += `📱 *JazzCash:*\n• Number: *${accounts.jazzcash.accountNumber}*\n• Title: *${accounts.jazzcash.accountTitle}*\n\n`;
      }
      if (accounts.easypaisa) {
        paymentText += `📱 *Easypaisa:*\n• Number: *${accounts.easypaisa.accountNumber}*\n• Title: *${accounts.easypaisa.accountTitle}*\n\n`;
      }
      if (accounts.bank) {
        paymentText += `🏦 *Bank Transfer:*\n• Bank: *${accounts.bank.bankName}*\n• IBAN: *${accounts.bank.iban}*\n• Title: *${accounts.bank.accountTitle}*\n\n`;
      }

      paymentText += `⚠️ *Important:*\nPayment send karne ke baad baraye meherbani *Transaction / Reference ID* yahan reply mein bhej dein ya screenshot share karein taake hum foran verify kar sakein.`;

      return {
        text: paymentText,
        buttons: [
          { id: "act:pay_cod", title: "💵 Switch to COD" },
          { id: "act:talk_staff", title: "👨‍🍳 Staff Support" },
        ],
      };
    }

    // N.2 SUBMIT TRANSACTION ID / ONLINE PAYMENT VERIFICATION SUBMISSION
    if (nlu.intent === "SUBMIT_TRANSACTION_ID" || (state.pendingTransactionId && nlu.transactionId)) {
      if (!state.cart.length && !state.lastCreatedOrderId) {
        return {
          text: "Aap ka koi active cart ya pending order nahi hai. Naya order shuru karne ke liye *Menu* likhein.",
          buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
        };
      }

      const refId = nlu.transactionId || cleanText;

      const orderRes = await create_order({
        customerId,
        conversationId,
        customerPhone,
        customerName: customerName || `Customer ${customerPhone.slice(-4)}`,
        deliveryAddress: state.deliveryAddress || undefined,
        paymentMethod: "ONLINE_TRANSFER",
        paymentStatus: "PENDING_VERIFICATION",
        paymentReference: refId,
        items: state.cart,
      });

      if (orderRes.ok && orderRes.orderNumber) {
        await clearCart(conversationId, customerId);
        await updateConversationState(
          conversationId,
          {
            pendingTransactionId: false,
            pendingOnlinePayment: false,
            pendingOrderConfirmation: false,
            lastCreatedOrderNumber: orderRes.orderNumber,
            lastCreatedOrderId: orderRes.orderId,
          },
          customerId
        );

        // Notify internal dashboard notifications
        await prisma.notification.create({
          data: {
            title: `Payment Verification Required: ${orderRes.orderNumber}`,
            message: `Customer ${customerName || customerPhone} has submitted online payment (Rs. ${orderRes.total}) with Ref: ${refId}. Review required.`,
            type: "WARNING",
            link: "/admin/orders?status=PENDING_VERIFICATION",
          },
        }).catch(() => {});

        return {
          text:
            `⏳ *PAYMENT VERIFICATION REQUEST RECEIVED*\n\n` +
            `📋 *Order #:* *${orderRes.orderNumber}*\n` +
            `💰 *Amount:* Rs. ${orderRes.total?.toLocaleString()}\n` +
            `🔢 *Transaction/Ref ID:* *${refId}*\n` +
            `📊 *Status:* ⏳ *PENDING VERIFICATION*\n\n` +
            `A-ONE Restaurant manager aap ki payment verify kar rahe hain. Verification hotay hi aap ko WhatsApp par notification mosool ho jayegi aur order kitchen ko dispatch ho jayega.\n\n` +
            `_Shukriya! A-ONE Restaurant_`,
          orderCreated: {
            orderNumber: orderRes.orderNumber,
            total: orderRes.total || 0,
          },
          buttons: [
            { id: "act:view_menu", title: "📋 View Menu" },
            { id: "act:talk_staff", title: "👨‍🍳 Staff Support" },
          ],
        };
      }
    }

    // O. CONFIRM ORDER (CASH ON DELIVERY)
    if (nlu.intent === "CONFIRM_ORDER" || nlu.intent === "SELECT_COD") {
      if (!state.cart.length) {
        return {
          text: "Aap ka cart khali hai. Order place nahi kiya ja sakta.",
          buttons: [{ id: "act:view_menu", title: "📋 View Menu" }],
        };
      }

      const orderRes = await create_order({
        customerId,
        conversationId,
        customerPhone,
        customerName: customerName || `Customer ${customerPhone.slice(-4)}`,
        deliveryAddress: state.deliveryAddress || undefined,
        paymentMethod: "CASH_ON_DELIVERY",
        paymentStatus: "CASH_ON_DELIVERY",
        items: state.cart,
      });

      if (orderRes.ok && orderRes.orderNumber) {
        // Reset state after order creation
        await clearCart(conversationId, customerId);
        await updateConversationState(
          conversationId,
          {
            pendingOrderConfirmation: false,
            pendingOnlinePayment: false,
            pendingTransactionId: false,
          },
          customerId
        );

        return {
          text:
            `🎉 *Order successfully place ho gaya hai!*\n\n` +
            `📋 *Order #:* *${orderRes.orderNumber}*\n` +
            `💰 *Total Amount:* Rs. ${orderRes.total?.toLocaleString()}\n` +
            `💵 *Payment:* Cash on Delivery (COD)\n\n` +
            `A-ONE Restaurant kitchen ne aap ka order prepare karna shuru kar diya hai. Hamari delivery team jald aap se rabta karegi.\n\n` +
            `_Shukriya! A-ONE Restaurant ka zaiqa hamesha yaadgaar._`,
          orderCreated: {
            orderNumber: orderRes.orderNumber,
            total: orderRes.total || 0,
          },
          buttons: [
            { id: "act:view_menu", title: "📋 New Order" },
            { id: "act:talk_staff", title: "👨‍🍳 Staff Support" },
          ],
        };
      } else {
        return {
          text: `Maazrat, order create karne mein masla aya: ${orderRes.error || "Please try again"}`,
          buttons: [{ id: "act:checkout", title: "🔄 Retry Checkout" }],
        };
      }
    }

    // P. CANCEL ORDER
    if (nlu.intent === "CANCEL_ORDER") {
      if (state.pendingOrderConfirmation) {
        await updateConversationState(
          conversationId,
          { pendingOrderConfirmation: false },
          customerId
        );
        return {
          text: "Checkout cancel kar diya gaya hai. Aap ka cart mehfooz hai. Jab chahein 'Checkout' likh kar order kar sakte hain.",
          buttons: [
            { id: "act:view_cart", title: "🛒 View Cart" },
            { id: "act:view_menu", title: "📋 Add Items" },
          ],
        };
      }

      if (nlu.orderNumber) {
        const cancelRes = await cancel_order(nlu.orderNumber, customerPhone);
        return { text: cancelRes.message };
      }

      return {
        text: "Aap ka koi active checkout nahi tha. Agar aap ne pichla order cancel karwana hai to Order # batayein (e.g. 'AONE-1002 cancel kar do') ya staff se rabta karein.",
        buttons: [{ id: "act:talk_staff", title: "👨‍🍳 Staff Support" }],
      };
    }

    // =========================================================================
    //  MULTI-PROVIDER AI ASSISTANCE WITH STRICT ZERO-HALLUCINATION GUARDRAILS
    // =========================================================================

    const langName = lang === "ur" ? "Urdu" : lang === "en" ? "English" : "Roman Urdu";
    const strictInstruction = `You are the customer assistant for A-One Foods. You must respond in STRICTLY ${langName} (Roman Urdu by default). Maximum 1 short sentence. NEVER generate menu lists or prices. Always tell the user to click the menu button below to order.`;

    try {
      const aiResult = await generateMultiProviderReply(cleanText, strictInstruction);
      if (aiResult.text) {
        return {
          text: aiResult.text,
          buttons: [
            { id: "btn_show_menu", title: "📜 View Menu" },
            { id: "btn_show_deals", title: "🔥 Special Deals" },
            { id: "btn_staff_help", title: "👨‍🍳 Staff Support" },
          ],
        };
      }
    } catch (llmError) {
      console.warn("[ai-engine] Multi-provider LLM error, using safe fallback:", (llmError as any)?.message);
    }

    // Safe multi-lingual fallback when LLM is unavailable or times out
    return {
      text:
        lang === "ur"
          ? "اے ون فوڈز میں خوش آمدید! مینو دیکھنے اور آرڈر کرنے کے لیے نیچے دیے گئے 'View Menu' پر ٹیپ کریں۔"
          : "Assalam-o-Alaikum! A-One Foods mein khushamdeed. Menu dekhne aur order karne ke liye 'View Menu' button par tap karein.",
      buttons: [
        { id: "btn_show_menu", title: "📜 View Menu" },
        { id: "btn_show_deals", title: "🔥 Special Deals" },
        { id: "btn_staff_help", title: "👨‍🍳 Staff Support" },
      ],
    };
  });
}
