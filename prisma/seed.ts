// =============================================================================
//  A-ONE Restaurant — Database Seed Script
//  Copyright (c) A-ONE Restaurant. All rights reserved.
// =============================================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, Role, UserStatus, OrderStatus, OrderType, PaymentStatus, Channel, MessageRole } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load .env.local if present
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

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting A-ONE Restaurant database seeding...");

  // 1. Clean existing tables if needed
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.auditLog.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.message.deleteMany().catch(() => {});
  await prisma.conversation.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});
  await prisma.menuItem.deleteMany().catch(() => {});
  await prisma.menuCategory.deleteMany().catch(() => {});
  await prisma.restaurantSettings.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  // 2. Hash passwords
  const adminPassword = await bcrypt.hash("admin", 10);

  const ownerEmail = process.env.OWNER_EMAIL || "owner@aonefoods.com";

  // 3. Seed Users (RBAC: Owner, Manager, Staff)
  const owner = await prisma.user.create({
    data: {
      email: ownerEmail,
      name: "A-ONE Owner",
      passwordHash: adminPassword,
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      phone: "+92 300 1112233",
      permissions: [
        "all",
        "manage_staff",
        "manage_menu",
        "manage_orders",
        "view_financials",
        "manage_settings",
        "manage_whatsapp",
        "view_audit_logs",
      ],
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@aonefoods.com",
      name: "Tariq Mahmood (Manager)",
      passwordHash: adminPassword,
      role: Role.MANAGER,
      status: UserStatus.ACTIVE,
      phone: "+92 300 4445566",
      permissions: [
        "view_conversations",
        "reply_conversations",
        "view_orders",
        "update_orders",
        "manage_menu",
        "view_customers",
      ],
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@aonefoods.com",
      name: "Bilal Ahmed (Order Staff)",
      passwordHash: adminPassword,
      role: Role.STAFF,
      status: UserStatus.ACTIVE,
      phone: "+92 300 7778899",
      permissions: [
        "view_conversations",
        "reply_conversations",
        "view_orders",
        "update_assigned_orders",
      ],
    },
  });

  console.log(`✅ Created Users: Owner (${owner.email}), Manager (${manager.email}), Staff (${staff.email})`);

  // 4. Seed Restaurant Settings
  await prisma.restaurantSettings.create({
    data: {
      id: "default",
      name: "A-ONE Restaurant",
      tagline: "Authentic Taste, Premium Quality & Traditional Savories",
      phone: "+92 300 1234567",
      email: "contact@aonefoods.com",
      address: "A-ONE Restaurant & Foods, Main Boulevard, Commercial Area, Lahore, Pakistan",
      currency: "PKR",
      currencySymbol: "Rs.",
      deliveryFee: 150,
      minOrderAmount: 500,
      isAcceptingOrders: true,
      openingHours: {
        monday: { open: "11:00", close: "01:00", isOpen: true },
        tuesday: { open: "11:00", close: "01:00", isOpen: true },
        wednesday: { open: "11:00", close: "01:00", isOpen: true },
        thursday: { open: "11:00", close: "01:00", isOpen: true },
        friday: { open: "14:00", close: "02:00", isOpen: true },
        saturday: { open: "11:00", close: "02:00", isOpen: true },
        sunday: { open: "11:00", close: "01:00", isOpen: true },
      },
      deliverySettings: {
        standardDeliveryFee: 150,
        freeDeliveryThreshold: 2500,
        estimatedMinutes: 35,
        allowedAreas: [
          "Gulberg",
          "Model Town",
          "DHA Phase 1-6",
          "Faisal Town",
          "Johar Town",
          "Garden Town",
          "Cantt",
        ],
      },
      whatsappConfig: {
        welcomeMessage:
          "Welcome to A-ONE Restaurant! 🍔🍕🍛\nHow may we serve you today?\n\nSend *Menu* to browse our delicious dishes or *Order* to place an order.",
        autoReplyEnabled: true,
        fallbackMessage:
          "Thank you for contacting A-ONE Restaurant. One of our team members will assist you right away.",
      },
      aiSettings: {
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        temperature: 0.2,
        maxTokens: 600,
        strictGuardrails: true,
      },
    },
  });

  console.log("✅ Seeded Restaurant Settings");

  // 5. Seed Menu Categories & Items
  const catBurgers = await prisma.menuCategory.create({
    data: {
      name: "Burgers & Sandwiches",
      urduName: "برگر اور سینڈوچ",
      description: "Signature handcrafted burgers, zesty crunch & juicy patties",
      displayOrder: 1,
      isActive: true,
    },
  });

  const catRice = await prisma.menuCategory.create({
    data: {
      name: "Rice & Biryani",
      urduName: "بریانی اور چاول",
      description: "Aromatic basmati rice cooked with authentic spices and tender meat",
      displayOrder: 2,
      isActive: true,
    },
  });

  const catBBQ = await prisma.menuCategory.create({
    data: {
      name: "BBQ & Grills",
      urduName: "باربی کیو اور تکہ",
      description: "Charcoal-grilled succulent chicken and beef specialties",
      displayOrder: 3,
      isActive: true,
    },
  });

  const catPizza = await prisma.menuCategory.create({
    data: {
      name: "Pizza & Pastas",
      urduName: "پیزا اور پاستا",
      description: "Crispy crust pizzas loaded with cheese and savory toppings",
      displayOrder: 4,
      isActive: true,
    },
  });

  const catSavories = await prisma.menuCategory.create({
    data: {
      name: "Traditional Savories & Nimko",
      urduName: "روایتی نمکو اور اسنیکس",
      description: "Famous authentic A-ONE crunchy savories and tea-time snacks",
      displayOrder: 5,
      isActive: true,
    },
  });

  const catDrinks = await prisma.menuCategory.create({
    data: {
      name: "Beverages & Desserts",
      urduName: "مشروبات اور میٹھے",
      description: "Chilled refreshers, traditional desserts, and soft drinks",
      displayOrder: 6,
      isActive: true,
    },
  });

  // Menu Items
  await prisma.menuItem.createMany({
    data: [
      // Burgers
      {
        categoryId: catBurgers.id,
        name: "A-ONE Special Beef Smash Burger",
        urduName: "اے ون اسپیشل بیف برگر",
        description: "Double beef patty, melted cheddar, caramelized onions, secret house sauce",
        price: 850,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 1,
        preparationTime: 15,
      },
      {
        categoryId: catBurgers.id,
        name: "Crispy Zinger Crunch Burger",
        urduName: "کرسپی زنگر برگر",
        description: "Golden fried crispy chicken breast fillet, spicy mayo, iceberg lettuce",
        price: 650,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 2,
        preparationTime: 12,
      },
      {
        categoryId: catBurgers.id,
        name: "Grilled Chicken Club Sandwich",
        urduName: "چکن کلب سینڈوچ",
        description: "Triple-layer toasted bread with grilled chicken, egg, cheese & coleslaw with fries",
        price: 580,
        isAvailable: true,
        isFeatured: false,
        displayOrder: 3,
        preparationTime: 12,
      },

      // Rice
      {
        categoryId: catRice.id,
        name: "A-ONE Special Chicken Dum Biryani",
        urduName: "اے ون اسپیشل چکن دم بریانی",
        description: "Fragrant long-grain basmati rice layered with spiced chicken, potatoes & saffron aroma",
        price: 520,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 1,
        preparationTime: 10,
      },
      {
        categoryId: catRice.id,
        name: "Mutton Yakhni Pulao",
        urduName: "مٹن یخنی پلاؤ",
        description: "Slow-cooked tender mutton infused with rich broth and whole spices",
        price: 950,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 2,
        preparationTime: 15,
      },

      // BBQ
      {
        categoryId: catBBQ.id,
        name: "Chicken Malai Boti (8 Pcs)",
        urduName: "چکن ملائی بوٹی",
        description: "Melt-in-mouth boneless chicken chunks marinated in cream, green chilies & mild spices",
        price: 780,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 1,
        preparationTime: 20,
      },
      {
        categoryId: catBBQ.id,
        name: "Beef Seekh Kabab Platter (4 Pcs)",
        urduName: "بیف سیخ کباب پلیٹر",
        description: "Charcoal-grilled minced beef kababs served with mint raita, salad & fresh naan",
        price: 720,
        isAvailable: true,
        isFeatured: false,
        displayOrder: 2,
        preparationTime: 18,
      },

      // Pizza
      {
        categoryId: catPizza.id,
        name: "A-ONE Supreme Pizza (Large 13\")",
        urduName: "اے ون سپریم پیزا",
        description: "Smoked chicken, pepperoni, mushrooms, black olives, bell peppers & extra mozzarella",
        price: 1650,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 1,
        preparationTime: 25,
      },
      {
        categoryId: catPizza.id,
        name: "Creamy Alfredo Fettuccine Pasta",
        urduName: "الفریڈو پاستا",
        description: "Fettuccine pasta in rich parmesan cream sauce with grilled herb chicken & garlic bread",
        price: 790,
        isAvailable: true,
        isFeatured: false,
        displayOrder: 2,
        preparationTime: 18,
      },

      // Savories & Nimko
      {
        categoryId: catSavories.id,
        name: "A-ONE Special Mix Nimko (400g)",
        urduName: "اے ون اسپیشل مکس نمکو",
        description: "Crispy savory blend of spiced grams, sev, roasted nuts, and traditional crunch",
        price: 380,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 1,
        preparationTime: 5,
      },
      {
        categoryId: catSavories.id,
        name: "Spicy Daal Moth (400g)",
        urduName: "دال موٹھ",
        description: "Crunchy fried moth lentils tossed in tangy chaat masala",
        price: 360,
        isAvailable: true,
        isFeatured: false,
        displayOrder: 2,
        preparationTime: 5,
      },

      // Drinks & Desserts
      {
        categoryId: catDrinks.id,
        name: "Fresh Mint Lemonade",
        urduName: "تازہ منٹ لیمونیڈ",
        description: "Refreshing crushed ice drink with fresh garden mint, lemon and black salt",
        price: 240,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 1,
        preparationTime: 5,
      },
      {
        categoryId: catDrinks.id,
        name: "Traditional Matka Kheer",
        urduName: "مٹکا کھیر",
        description: "Slow-cooked rice pudding in clay pot with cardamom, pistachios & silver vark",
        price: 280,
        isAvailable: true,
        isFeatured: true,
        displayOrder: 2,
        preparationTime: 5,
      },
    ],
  });

  console.log("✅ Seeded Menu Categories & Items");

  // 6. Seed Sample Customers, Conversations & Orders
  const customer1 = await prisma.customer.create({
    data: {
      phone: "+923001234567",
      name: "Ahmed Raza",
      email: "ahmed.raza@example.com",
      address: "House 45, Street 12, Phase 4, DHA, Lahore",
      notes: "VIP Customer - loves extra spicy",
      totalOrders: 3,
      totalSpent: 4250,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      phone: "+923219876543",
      name: "Ayesha Malik",
      address: "Apartment 3B, Gulberg Heights, Lahore",
      notes: "Prefers no onions",
      totalOrders: 1,
      totalSpent: 1800,
    },
  });

  const conv1 = await prisma.conversation.create({
    data: {
      customerId: customer1.id,
      channel: Channel.WHATSAPP,
      status: "OPEN",
      assignedStaffId: staff.id,
      unreadCount: 0,
      lastMessageAt: new Date(),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        role: MessageRole.USER,
        content: "Salam! What are today's special deals?",
        status: "READ",
      },
      {
        conversationId: conv1.id,
        role: MessageRole.ASSISTANT,
        content:
          "Wa Alaykum Assalam! Today we recommend our *A-ONE Special Beef Smash Burger* (Rs. 850) and *A-ONE Special Chicken Dum Biryani* (Rs. 520). Would you like to place an order?",
        status: "READ",
      },
      {
        conversationId: conv1.id,
        role: MessageRole.USER,
        content: "Yes please, 1 Beef Smash Burger and 1 Fresh Mint Lemonade for delivery.",
        status: "READ",
      },
    ],
  });

  // Seed Sample Orders
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "AONE-1001",
      customerId: customer1.id,
      conversationId: conv1.id,
      status: OrderStatus.PREPARING,
      orderType: OrderType.DELIVERY,
      paymentStatus: PaymentStatus.CASH_ON_DELIVERY,
      subtotal: 1090,
      deliveryFee: 150,
      discount: 0,
      total: 1240,
      customerName: "Ahmed Raza",
      customerPhone: "+923001234567",
      deliveryAddress: "House 45, Street 12, Phase 4, DHA, Lahore",
      notes: "Extra napkins please",
      assignedStaffId: staff.id,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order1.id,
        itemName: "A-ONE Special Beef Smash Burger",
        unitPrice: 850,
        quantity: 1,
        subtotal: 850,
      },
      {
        orderId: order1.id,
        itemName: "Fresh Mint Lemonade",
        unitPrice: 240,
        quantity: 1,
        subtotal: 240,
      },
    ],
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: "AONE-1002",
      customerId: customer2.id,
      status: OrderStatus.NEW,
      orderType: OrderType.DELIVERY,
      paymentStatus: PaymentStatus.CASH_ON_DELIVERY,
      subtotal: 1650,
      deliveryFee: 150,
      discount: 0,
      total: 1800,
      customerName: "Ayesha Malik",
      customerPhone: "+923219876543",
      deliveryAddress: "Apartment 3B, Gulberg Heights, Lahore",
      notes: "Call upon arrival",
      assignedStaffId: manager.id,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: order2.id,
        itemName: "A-ONE Supreme Pizza (Large 13\")",
        unitPrice: 1650,
        quantity: 1,
        subtotal: 1650,
      },
    ],
  });

  // 7. Initial Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: owner.id,
      actorEmail: owner.email,
      action: "SYSTEM_INITIALIZED",
      target: "SYSTEM",
      details: {
        message: "A-ONE Restaurant management database seeded successfully.",
        ownerEmail: owner.email,
      },
    },
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
