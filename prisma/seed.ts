// =============================================================================
//  A-ONE Restaurant — Database Seed Script
//  Initializes only essential system configuration, owner account, and menu.
//  Zero fake/demo customers, orders, conversations, or transactions are created.
//  Copyright (c) A-ONE Restaurant. All rights reserved.
// =============================================================================

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

// Load .env.local / .env if present
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
  console.log("🌱 Starting A-ONE Restaurant clean database initialization...");

  // 1. Remove old demo/test business transactions if present
  await prisma.notification.deleteMany().catch(() => {});
  await prisma.orderItem.deleteMany().catch(() => {});
  await prisma.order.deleteMany().catch(() => {});
  await prisma.message.deleteMany().catch(() => {});
  await prisma.conversation.deleteMany().catch(() => {});
  await prisma.customer.deleteMany().catch(() => {});

  // 2. Ensure Owner Account
  const ownerEmail = process.env.OWNER_EMAIL || "owner@aonefoods.com";
  const defaultPasswordHash = await bcrypt.hash("admin", 10);

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: ownerEmail,
      name: "A-ONE Owner",
      passwordHash: defaultPasswordHash,
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      phone: "+92 300 0000000",
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

  console.log(`✅ System Owner Account Ready: ${owner.email}`);

  // 3. Ensure Default Restaurant Settings
  await prisma.restaurantSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "A-ONE Restaurant",
      tagline: "Authentic Taste, Premium Quality & Traditional Savories",
      phone: "+92 300 1234567",
      email: "contact@aonefoods.com",
      address: "A-ONE Restaurant & Foods, Main Boulevard, Pakistan",
      currency: "PKR",
      currencySymbol: "Rs.",
      deliveryFee: 150,
      minOrderAmount: 500,
      isAcceptingOrders: true,
      openingHours: {
        monday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
        tuesday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
        wednesday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
        thursday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
        friday: { open: "14:00", close: "02:00", isOpen: true, cutoffMinutes: 20 },
        saturday: { open: "11:00", close: "02:00", isOpen: true, cutoffMinutes: 20 },
        sunday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
        temporaryClosure: {
          isClosed: false,
          reason: "Kitchen Maintenance",
        },
      },
      deliverySettings: {
        standardDeliveryFee: 150,
        freeDeliveryThreshold: 2000,
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
      paymentAccounts: {
        jazzcash: { accountTitle: "A-ONE Restaurant", accountNumber: "0300-1234567" },
        easypaisa: { accountTitle: "A-ONE Restaurant", accountNumber: "0321-9876543" },
        bank: { bankName: "Meezan Bank", accountTitle: "A-ONE Foods PVT LTD", iban: "PK00MEZN0000123456789012" },
      },
      whatsappConfig: {
        welcomeMessage:
          "Welcome to A-ONE Restaurant! 🍔🍕🍛\nHow may we serve you today?\n\nSend *Menu* to browse our delicious dishes or *Order* to place an order.",
        autoReplyEnabled: true,
        fallbackMessage:
          "Thank you for contacting A-ONE Restaurant. One of our team members will assist you right away.",
      },
      aiSettings: {
        provider: "openrouter",
        model: "openrouter/free",
        temperature: 0.2,
        maxTokens: 600,
        strictGuardrails: true,
      },
    },
  });

  console.log("✅ Seeded Clean Restaurant Settings");

  // 4. Ensure Menu Categories & Items
  const catCount = await prisma.menuCategory.count();
  if (catCount === 0) {
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

    const catSavories = await prisma.menuCategory.create({
      data: {
        name: "Traditional Savories & Nimko",
        urduName: "روایتی نمکو اور اسنیکس",
        description: "Famous authentic A-ONE crunchy savories and tea-time snacks",
        displayOrder: 3,
        isActive: true,
      },
    });

    const catDrinks = await prisma.menuCategory.create({
      data: {
        name: "Beverages & Drinks",
        urduName: "مشروبات اور کولڈ ڈرنکس",
        description: "Chilled soft drinks and refreshing beverages",
        displayOrder: 4,
        isActive: true,
      },
    });

    await prisma.menuItem.createMany({
      data: [
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
          categoryId: catDrinks.id,
          name: "Chilled Coke (500ml)",
          urduName: "کوک",
          description: "Ice cold refreshing Coca-Cola pet bottle",
          price: 120,
          isAvailable: true,
          isFeatured: false,
          displayOrder: 1,
          preparationTime: 2,
        },
      ],
    });

    console.log("✅ Seeded Core Menu Catalog");
  }

  // 5. Initial Clean System Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: owner.id,
      actorEmail: owner.email,
      action: "SYSTEM_INITIALIZED",
      target: "SYSTEM",
      details: {
        message: "A-ONE Restaurant clean database initialized successfully.",
        customerCount: 0,
        orderCount: 0,
      },
    },
  });

  console.log("🎉 Clean initialization completed. ZERO demo customers/orders created!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
