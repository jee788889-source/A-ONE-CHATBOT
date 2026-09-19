/**
 * A-ONE Restaurant — Comprehensive Concurrency, Cart Isolation, and AI Test Suite
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

for (const envFile of [".env.local", ".env"]) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

import { processCustomerMessage } from "../src/lib/ai/engine";
import { getConversationState, clearCart } from "../src/lib/ai/cart";
import { parseNlu, parseQuantity } from "../src/lib/ai/nlu";
import { calculate_cart_total, get_menu, get_delivery_charge } from "../src/lib/ai/tools";

async function runTests() {
  console.log("=================================================================");
  console.log("🚀 STARTING A-ONE RESTAURANT CONCURRENCY & ISOLATION TEST SUITE");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. QUANTITY PARSING & 'OTHER' QUANTITY TEST
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 1: Quantity Parser & Flexible Inputs ---");
  const testQuantities = [
    { input: "1", expected: 1 },
    { input: "2", expected: 2 },
    { input: "4", expected: 4 },
    { input: "5", expected: 5 },
    { input: "10", expected: 10 },
    { input: "20", expected: 20 },
    { input: "50", expected: 50 },
    { input: "100", expected: 100 },
    { input: "200", expected: 200 },
    { input: "100 samosay", expected: 100 },
    { input: "do burger", expected: 2 },
    { input: "das biryani", expected: 10 },
    { input: "teen pizza", expected: 3 },
  ];

  for (const q of testQuantities) {
    const parsed = parseQuantity(q.input);
    assert(
      parsed?.value === q.expected,
      `Parse quantity: "${q.input}" -> expected ${q.expected}, got ${parsed?.value}`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. MULTI-LINGUAL INTENT DETECTION TEST
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 2: Multi-Lingual NLU Intent Detection ---");
  const intentTests = [
    { text: "Hi", expectedIntent: "GREETING" },
    { text: "Assalam-o-Alaikum", expectedIntent: "GREETING" },
    { text: "aoa", expectedIntent: "GREETING" },
    { text: "menu", expectedIntent: "VIEW_MENU" },
    { text: "bhai samosa hai?", expectedIntent: "CHECK_AVAILABILITY" },
    { text: "burger kitne ka hai?", expectedIntent: "ASK_PRICE" },
    { text: "2 burger laga do", expectedIntent: "ADD_TO_CART" },
    { text: "ek coke bhi add kar do", expectedIntent: "ADD_TO_CART" },
    { text: "coke hata do", expectedIntent: "REMOVE_FROM_CART" },
    { text: "burger 3 kar do", expectedIntent: "SET_QUANTITY" },
    { text: "mera cart dikhao", expectedIntent: "VIEW_CART" },
    { text: "total kitna bana?", expectedIntent: "GET_TOTAL" },
    { text: "delivery charges kitne hain?", expectedIntent: "GET_DELIVERY_FEE" },
    { text: "order karna hai", expectedIntent: "CHECKOUT" },
    { text: "staff se baat karwao", expectedIntent: "REQUEST_HUMAN" },
  ];

  for (const t of intentTests) {
    const res = parseNlu(t.text);
    assert(
      res.intent === t.expectedIntent,
      `NLU Intent: "${t.text}" -> expected ${t.expectedIntent}, got ${res.intent}`
    );
  }

  // ---------------------------------------------------------------------------
  // 3. SERVER-SIDE TRUSTED CART CALCULATION TEST
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 3: Server-Side Cart Calculation ---");
  const testCart = [
    { name: "Burger", price: 850, quantity: 2 },
    { name: "Coke", price: 120, quantity: 1 },
  ];
  const calc = await calculate_cart_total(testCart);
  assert(calc.subtotal === 1820, "Subtotal calculation: (850*2) + 120 = 1820");
  assert(calc.deliveryFee === 150, "Delivery fee is Rs. 150 for subtotal < 2000");
  assert(calc.total === 1970, "Total calculation: 1820 + 150 = 1970");

  // Test Free delivery threshold (>= 2000)
  const testLargeCart = [
    { name: "Supreme Pizza", price: 1650, quantity: 2 },
  ];
  const largeCalc = await calculate_cart_total(testLargeCart);
  assert(largeCalc.subtotal === 3300, "Subtotal calculation: 1650*2 = 3300");
  assert(largeCalc.deliveryFee === 0, "Free delivery applied when subtotal >= 2000");
  assert(largeCalc.total === 3300, "Total = 3300 without delivery charge");

  // ---------------------------------------------------------------------------
  // 4. MULTI-USER ISOLATION: 10 CONCURRENT CUSTOMERS SCENARIO
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 4: 10 Concurrent Customer Isolation Simulation ---");
  const customers = Array.from({ length: 10 }, (_, i) => ({
    id: `cust-iso-${i + 1}`,
    convId: `conv-iso-${i + 1}`,
    phone: `+92300000000${i + 1}`,
    name: `Test Customer ${i + 1}`,
  }));

  // Clean initial states
  for (const c of customers) {
    await clearCart(c.convId, c.id);
  }

  // 10 different concurrent actions fired simultaneously
  const concurrentActions = [
    // Customer 1: asks menu
    processCustomerMessage({
      rawText: "menu",
      conversationId: customers[0].convId,
      customerId: customers[0].id,
      customerPhone: customers[0].phone,
      customerName: customers[0].name,
    }),
    // Customer 2: adds 2 burgers
    processCustomerMessage({
      rawText: "2 A-ONE Special Beef Smash Burger laga do",
      conversationId: customers[1].convId,
      customerId: customers[1].id,
      customerPhone: customers[1].phone,
      customerName: customers[1].name,
    }),
    // Customer 3: adds 10 samosas
    processCustomerMessage({
      rawText: "10 A-ONE Special Mix Nimko add kar do",
      conversationId: customers[2].convId,
      customerId: customers[2].id,
      customerPhone: customers[2].phone,
      customerName: customers[2].name,
    }),
    // Customer 4: checks delivery fee
    processCustomerMessage({
      rawText: "delivery charges kitne hain?",
      conversationId: customers[3].convId,
      customerId: customers[3].id,
      customerPhone: customers[3].phone,
      customerName: customers[3].name,
    }),
    // Customer 5: views cart
    processCustomerMessage({
      rawText: "mera cart dikhao",
      conversationId: customers[4].convId,
      customerId: customers[4].id,
      customerPhone: customers[4].phone,
      customerName: customers[4].name,
    }),
    // Customer 6: removes item from cart
    processCustomerMessage({
      rawText: "coke hata do",
      conversationId: customers[5].convId,
      customerId: customers[5].id,
      customerPhone: customers[5].phone,
      customerName: customers[5].name,
    }),
    // Customer 7: asks for staff handoff
    processCustomerMessage({
      rawText: "staff se baat karwao",
      conversationId: customers[6].convId,
      customerId: customers[6].id,
      customerPhone: customers[6].phone,
      customerName: customers[6].name,
    }),
    // Customer 8: check burger price
    processCustomerMessage({
      rawText: "burger kitne ka hai?",
      conversationId: customers[7].convId,
      customerId: customers[7].id,
      customerPhone: customers[7].phone,
      customerName: customers[7].name,
    }),
    // Customer 9: greeting
    processCustomerMessage({
      rawText: "Assalam-o-Alaikum",
      conversationId: customers[8].convId,
      customerId: customers[8].id,
      customerPhone: customers[8].phone,
      customerName: customers[8].name,
    }),
    // Customer 10: total
    processCustomerMessage({
      rawText: "total kitna bana?",
      conversationId: customers[9].convId,
      customerId: customers[9].id,
      customerPhone: customers[9].phone,
      customerName: customers[9].name,
    }),
  ];

  const results = await Promise.all(concurrentActions);

  assert(results[0].text.includes("MENU"), "Customer 1 received Menu");
  assert(results[1].text.includes("cart mein add"), "Customer 2 added 2 burgers");
  assert(results[2].text.includes("cart mein add"), "Customer 3 added 10 nimko");
  assert(results[3].text.includes("Delivery Charges"), "Customer 4 received Delivery Info");
  assert(results[6].isHandoff === true, "Customer 7 triggered Staff Handoff");
  assert(results[8].text.includes("Welcome") || results[8].text.includes("وعلیکم السلام"), "Customer 9 received Greeting");

  // Verify Cart Isolation
  const stateCust2 = await getConversationState(customers[1].convId, customers[1].id);
  const stateCust3 = await getConversationState(customers[2].convId, customers[2].id);
  const stateCust4 = await getConversationState(customers[3].convId, customers[3].id);

  assert(
    stateCust2.cart.length === 1 && stateCust2.cart[0].quantity === 2,
    "Customer 2 cart has EXACTLY 2 burgers and nothing else"
  );
  assert(
    stateCust3.cart.length === 1 && stateCust3.cart[0].quantity === 10,
    "Customer 3 cart has EXACTLY 10 nimko and nothing else"
  );
  assert(
    stateCust4.cart.length === 0,
    "Customer 4 cart remained empty (no contamination from other customers)"
  );

  // ---------------------------------------------------------------------------
  // 5. HIGH-CONCURRENCY STRESS TEST (50 & 100 Concurrent Requests)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST 5: High-Concurrency Burst Test (100 Concurrent Messages) ---");
  const burstCount = 100;
  const burstStartTime = Date.now();

  const burstPromises = Array.from({ length: burstCount }, (_, i) => {
    const custId = `burst-user-${i % 25}`;
    const convId = `burst-conv-${i % 25}`;
    return processCustomerMessage({
      rawText: i % 2 === 0 ? "menu" : "delivery charges kitne hain?",
      conversationId: convId,
      customerId: custId,
      customerPhone: `+9230099990${i % 25}`,
      customerName: `Burst User ${i % 25}`,
    });
  });

  const burstResults = await Promise.all(burstPromises);
  const duration = Date.now() - burstStartTime;

  const successfulBursts = burstResults.filter((r) => r && r.text && r.text.length > 0);
  assert(
    successfulBursts.length === burstCount,
    `100% burst success rate: ${successfulBursts.length}/${burstCount} in ${duration}ms (avg ${(duration / burstCount).toFixed(1)}ms/req)`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`🏁 TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
