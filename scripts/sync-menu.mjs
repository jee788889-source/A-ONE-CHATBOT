// =============================================================================
//  A-ONE Restaurant — Force-Overwrite / Sync Menu Database Script
//  Purges legacy cached menu categories and inserts the 100% complete A-One Foods dataset.
// =============================================================================

import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

const MENU_DATA = [
  {
    category: {
      id: "cat_pizza_regular",
      name: "🍕 Regular Pizzas",
      urduName: "ریگولر پیزا",
      description: "Tikka / Fajita / Supreme / Euro",
      displayOrder: 1,
      isActive: true,
    },
    items: [
      { id: "pz_reg_s", name: "Regular Pizza (Small)", price: 440, description: "Rs. 440 | Tikka / Fajita / Supreme / Euro", displayOrder: 1 },
      { id: "pz_reg_m", name: "Regular Pizza (Medium)", price: 900, description: "Rs. 900 | Tikka / Fajita / Supreme / Euro", displayOrder: 2 },
      { id: "pz_reg_l", name: "Regular Pizza (Large)", price: 1300, description: "Rs. 1300 | Tikka / Fajita / Supreme / Euro", displayOrder: 3 },
      { id: "pz_reg_xl", name: "Regular Pizza (X-Large)", price: 1900, description: "Rs. 1900 | Tikka / Fajita / Supreme / Euro", displayOrder: 4 },
    ],
  },
  {
    category: {
      id: "cat_pizza_special",
      name: "🍕 Special A-One & Crust",
      urduName: "اسپیشل اے ون اور کرسٹ پیزا",
      description: "Malai Boti, Peri Peri, BBQ, Achari & Stuffed Crusts",
      displayOrder: 2,
      isActive: true,
    },
    items: [
      { id: "pz_sp_s", name: "Special A-One (Small)", price: 480, description: "Rs. 480 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 1 },
      { id: "pz_sp_m", name: "Special A-One (Medium)", price: 1000, description: "Rs. 1000 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 2 },
      { id: "pz_sp_l", name: "Special A-One (Large)", price: 1450, description: "Rs. 1450 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 3 },
      { id: "pz_sp_xl", name: "Special A-One (X-Large)", price: 2100, description: "Rs. 2100 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 4 },
      { id: "pz_bh_s", name: "Behari Kabab Pizza (Small)", price: 500, description: "Rs. 500", displayOrder: 5 },
      { id: "pz_bh_m", name: "Behari Kabab Pizza (Medium)", price: 1050, description: "Rs. 1050", displayOrder: 6 },
      { id: "pz_bh_l", name: "Behari Kabab Pizza (Large)", price: 1500, description: "Rs. 1500", displayOrder: 7 },
      { id: "pz_bh_xl", name: "Behari Kabab Pizza (XL)", price: 2200, description: "Rs. 2200", displayOrder: 8 },
      { id: "pz_cr_l", name: "Special Crust (Large)", price: 1200, description: "Rs. 1200 | Square/Extreme/Kabab/Cheese/Chicken", displayOrder: 9 },
      { id: "pz_cr_xl", name: "Special Crust (X-Large)", price: 1750, description: "Rs. 1750 | Square/Extreme/Kabab/Cheese/Chicken", displayOrder: 10 },
    ],
  },
  {
    category: {
      id: "cat_special_deals_1",
      name: "🔥 Special Deals (1-9)",
      urduName: "اسپیشل ڈیلز ۱ تا ۹",
      description: "Deals 1 to 9",
      displayOrder: 3,
      isActive: true,
    },
    items: [
      { id: "deal_1", name: "Deal 1", price: 580, description: "1 Small Pizza, 350ml Drink - Rs. 580", displayOrder: 1 },
      { id: "deal_2", name: "Deal 2", price: 500, description: "1 Patty Burger, 1 Small Fries, 350ml Drink - Rs. 500", displayOrder: 2 },
      { id: "deal_3", name: "Deal 3", price: 810, description: "2 Zinger Burgers, 2 Drinks 350ml - Rs. 810", displayOrder: 3 },
      { id: "deal_4", name: "Deal 4", price: 1150, description: "2 Zinger Burgers, 2 Reg Fries, 2 Drinks 350ml - Rs. 1150", displayOrder: 4 },
      { id: "deal_5", name: "Deal 5", price: 750, description: "1 Zinger Burger, 1 Patty Burger, 1 Fries, 2 Drinks 350ml - Rs. 750", displayOrder: 5 },
      { id: "deal_6", name: "Deal 6", price: 1700, description: "1 Large Pizza, 1 Medium Pizza, 1.5 Ltr Drink - Rs. 1700", displayOrder: 6 },
      { id: "deal_7", name: "Deal 7", price: 2650, description: "2 Large Pizzas, 1.5 Ltr Drink - Rs. 2650", displayOrder: 7 },
      { id: "deal_8", name: "Deal 8", price: 480, description: "1 Small Pizza, 1 Zinger Burger, 1 Drink 350ml - Rs. 480", displayOrder: 8 },
      { id: "deal_9", name: "Deal 9", price: 1300, description: "1 Medium Pizza, 5 Pcs Hot Wings, 1 Drink 500ml - Rs. 1300", displayOrder: 9 },
    ],
  },
  {
    category: {
      id: "cat_special_deals_2",
      name: "🔥 Special Deals (10-17)",
      urduName: "اسپیشل ڈیلز ۱۰ تا ۱۷",
      description: "Deals 10 se Deal 17 tak",
      displayOrder: 4,
      isActive: true,
    },
    items: [
      { id: "deal_10", name: "Deal 10", price: 1700, description: "1 Large Pizza, 1 Large Fries, 1 Drink 1.5 Ltr - Rs. 1700", displayOrder: 1 },
      { id: "deal_11", name: "Deal 11", price: 1250, description: "1 Medium Pizza, 5 Hot Wings, 1 Drink 500ml - Rs. 1250", displayOrder: 2 },
      { id: "deal_12", name: "Deal 12", price: 1800, description: "1 Zinger Burger, 1 Large Fries, 1 Drink 350ml - Rs. 1800", displayOrder: 3 },
      { id: "deal_13", name: "Deal 13", price: 1950, description: "1 Large Pizza, 4 Spin Roll, 1.5 Ltr Drink - Rs. 1950", displayOrder: 4 },
      { id: "deal_14", name: "Deal 14", price: 1150, description: "2 Grill Burger, 1 Fries, 2 Drinks 350ml - Rs. 1150", displayOrder: 5 },
      { id: "deal_15", name: "Deal 15", price: 1700, description: "1 Large Pizza, 1 Large Fries, 1 Drink 1.5 Ltr - Rs. 1700", displayOrder: 6 },
      { id: "deal_16", name: "Deal 16", price: 860, description: "1 Small Pizza, 1 Zinger Burger, 1 Drink 350ml - Rs. 860", displayOrder: 7 },
      { id: "deal_17", name: "Deal 17", price: 1650, description: "2 Small Pizzas, 1 Zinger Wrap, 1 Drink 350ml - Rs. 1650", displayOrder: 8 },
    ],
  },
  {
    category: {
      id: "cat_family_deals",
      name: "👨‍👩‍👧‍👦 Family Deals",
      urduName: "فیملی ڈیلز",
      description: "Family combos & bundles",
      displayOrder: 5,
      isActive: true,
    },
    items: [
      { id: "fam_1", name: "Family Deal 1", price: 3180, description: "2 Large Pizza, 1 Large Fries, 1 Broast, 1.5L Drink - Rs. 3180", displayOrder: 1 },
      { id: "fam_2", name: "Family Deal 2", price: 3000, description: "2 Large Pizza, 1.5 Ltr Drink - Rs. 3000", displayOrder: 2 },
      { id: "fam_3", name: "Family Deal 3", price: 2100, description: "2 Broast, 1 Fries, 1.5 Ltr Drink - Rs. 2100", displayOrder: 3 },
      { id: "fam_4", name: "Family Deal 4", price: 3350, description: "2 Large Pizza, 1 Large Fries, 1.5 Ltr Drink - Rs. 3350", displayOrder: 4 },
    ],
  },
  {
    category: {
      id: "cat_summer_deals",
      name: "☀️ Summer Deals (1-10)",
      urduName: "سمر ڈیلز ۱ تا ۱۰",
      description: "Summer deals & combos",
      displayOrder: 6,
      isActive: true,
    },
    items: [
      { id: "sum_1", name: "Summer Deal 1", price: 1100, description: "2 Small Pasta, 1 Brownie, 500ml Drink - Rs. 1100", displayOrder: 1 },
      { id: "sum_2", name: "Summer Deal 2", price: 1900, description: "4 Zinger Burgers, 2 Brownies, 1.5 Ltr Drink - Rs. 1900", displayOrder: 2 },
      { id: "sum_3", name: "Summer Deal 3", price: 770, description: "1 Small Pasta, 1 Small Fries, 500ml Drink - Rs. 770", displayOrder: 3 },
      { id: "sum_4", name: "Summer Deal 4", price: 690, description: "2 Chicken Burgers, 1 Small Fries, 1 Drink 350ml - Rs. 690", displayOrder: 4 },
      { id: "sum_5", name: "Summer Deal 5", price: 1200, description: "1 Large Pasta, 1 Custard, 500ml Drink - Rs. 1200", displayOrder: 5 },
      { id: "sum_6", name: "Summer Deal 6", price: 1450, description: "2 Zinger Burgers, 1 Large Pasta, 1 Drink 1.5 Ltr - Rs. 1450", displayOrder: 6 },
      { id: "sum_7", name: "Summer Deal 7", price: 3050, description: "2 Large Pizzas, 1 Large Pasta, 1.5 Ltr Drink - Rs. 3050", displayOrder: 7 },
      { id: "sum_8", name: "Summer Deal 8", price: 1070, description: "2 Small Pasta, 500ml Drink - Rs. 1070", displayOrder: 8 },
      { id: "sum_9", name: "Summer Deal 9", price: 1950, description: "1 Large Pizza, 4 Pcs Spin Roll, 1 Ltr Drink - Rs. 1950", displayOrder: 9 },
      { id: "sum_10", name: "Summer Deal 10", price: 890, description: "2 Zinger Parathas, 1 Small Fries, 1 Drink 500ml - Rs. 890", displayOrder: 10 },
    ],
  },
  {
    category: {
      id: "cat_rice_deals",
      name: "🍚 Rice Deals & Items",
      urduName: "بریانی اور چاول ڈیلز",
      description: "Biryani, Pulao & Rice Combos",
      displayOrder: 7,
      isActive: true,
    },
    items: [
      { id: "rd_1", name: "Rice Deal 1", price: 1050, description: "2 Biryani/Pulao, 1 Kheer, 1 Drink 500ml - Rs. 1050", displayOrder: 1 },
      { id: "rd_2", name: "Rice Deal 2", price: 990, description: "2 Biryani/Pulao, 1 Half Zarda, 1 Drink 500ml - Rs. 990", displayOrder: 2 },
      { id: "rd_3", name: "Rice Deal 3", price: 630, description: "1 Biryani/Pulao, 1 Brownie, 1 Drink 350ml - Rs. 630", displayOrder: 3 },
      { id: "rd_4", name: "Rice Deal 4", price: 1070, description: "1 Biryani/Pulao, 1 Sm Russian Salad, 1 Drink 350ml - Rs. 1070", displayOrder: 4 },
      { id: "rd_5", name: "Rice Deal 5", price: 580, description: "1 Biryani/Pulao, 1 Half Zarda, 1 Drink 350ml - Rs. 580", displayOrder: 5 },
      { id: "rd_6", name: "Rice Deal 6", price: 500, description: "1 Biryani/Pulao, 1 Pastry, 1 Drink 350ml - Rs. 500", displayOrder: 6 },
      { id: "rd_7", name: "Rice Deal 7", price: 550, description: "1 Beef Pulao, 1 Pastry, 1 Drink 350ml - Rs. 550", displayOrder: 7 },
      { id: "rd_8", name: "Rice Deal 8", price: 580, description: "1 Biryani/Pulao, 1 Mint Margarita, 1 Pastry - Rs. 580", displayOrder: 8 },
      { id: "tr_cb", name: "Chicken Biryani", price: 380, description: "Rs. 380 (Simple Biryani: Rs. 230)", displayOrder: 9 },
      { id: "tr_cp", name: "Chicken Pulao", price: 380, description: "Rs. 380 (Simple Pulao: Rs. 230)", displayOrder: 10 },
      { id: "tr_sb", name: "Special Biryani", price: 440, description: "Rs. 440 (Double chicken loaded)", displayOrder: 11 },
      { id: "tr_sp", name: "Special Pulao", price: 440, description: "Rs. 440 (Special aroma seasoned pulao)", displayOrder: 12 },
      { id: "tr_bp", name: "Beef Pulao", price: 430, description: "Rs. 430 (Zarda: Rs. 300 | Shami: Rs. 50)", displayOrder: 13 },
    ],
  },
  {
    category: {
      id: "cat_broast_burgers",
      name: "🍔 Broast, Burgers & Wraps",
      urduName: "بروسٹ، برگر اور ریپس",
      description: "Crispy fried broast, burgers & tortilla wraps",
      displayOrder: 8,
      isActive: true,
    },
    items: [
      { id: "br_f", name: "Chicken Broast (Full)", price: 2000, description: "Full: Rs. 2000 | Half: Rs. 1200 | Quarter: Rs. 700", displayOrder: 1 },
      { id: "bg_z", name: "Zinger Burger", price: 370, description: "Crispy fried fillet - Rs. 370", displayOrder: 2 },
      { id: "bg_mz", name: "Mighty Zinger", price: 430, description: "Double patty zinger - Rs. 430", displayOrder: 3 },
      { id: "bg_gr", name: "Grill Burger", price: 450, description: "Grilled patty loaded - Rs. 450", displayOrder: 4 },
      { id: "bg_pz", name: "Pizza Burger", price: 480, description: "Pizza stuffed cheese burger - Rs. 480", displayOrder: 5 },
      { id: "bg_mb", name: "Malai Boti Burger", price: 500, description: "Creamy boti chicken - Rs. 500", displayOrder: 6 },
      { id: "bg_stk", name: "Steaker Burger", price: 530, description: "Chef special beef/chicken - Rs. 530", displayOrder: 7 },
      { id: "bg_twr", name: "Tower Burger", price: 530, description: "Chef special tower loaded - Rs. 530", displayOrder: 8 },
      { id: "bg_pt", name: "Patty Burger", price: 290, description: "Rs. 290 | Student: Rs. 250 | Chicken: Rs. 220", displayOrder: 9 },
      { id: "bg_sh", name: "Shami Burger", price: 160, description: "Rs. 160 | Double Shami: Rs. 200", displayOrder: 10 },
      { id: "wp_z", name: "Zinger Wrap", price: 420, description: "Rs. 420 | Tikka Wrap: Rs. 420 | Fajita Wrap: Rs. 420", displayOrder: 11 },
    ],
  },
  {
    category: {
      id: "cat_shawarma_paratha",
      name: "🌯 Shawarma, Rolls & Parathas",
      urduName: "شوارما، رولز اور پراٹھے",
      description: "Shawarma, platters & crispy paratha rolls",
      displayOrder: 9,
      isActive: true,
    },
    items: [
      { id: "sh_ck", name: "Chicken Shawarma", price: 200, description: "Fresh rolled shawarma - Rs. 200", displayOrder: 1 },
      { id: "sh_zg", name: "Zinger Shawarma", price: 280, description: "Crispy zinger roll - Rs. 280", displayOrder: 2 },
      { id: "sh_mb", name: "Malai Boti Shawarma", price: 300, description: "Rs. 300 | Arabic Shawarma: Rs. 320", displayOrder: 3 },
      { id: "pl_sp", name: "Special Platter", price: 1070, description: "4 Spin Roll, 5 Oven Wings, Fries, Drink - Rs. 1070", displayOrder: 4 },
      { id: "pl_ck", name: "Chicken Shawarma Platter", price: 420, description: "Rs. 420 | Arabic Platter: Rs. 550", displayOrder: 5 },
      { id: "pr_kb", name: "Kabab Paratha", price: 320, description: "Rs. 320 | Zinger Paratha: Rs. 300", displayOrder: 6 },
      { id: "pr_mb", name: "Malai Boti Paratha", price: 360, description: "Rs. 360 | Chicken Cheese Paratha: Rs. 360", displayOrder: 7 },
      { id: "pr_cp", name: "Chicken Paratha", price: 280, description: "Hot crispy paratha - Rs. 280", displayOrder: 8 },
      { id: "sr_mb", name: "Spin Roll Malai Boti (4 Pcs)", price: 700, description: "Rs. 700 | Special: Rs. 600 | Behari: Rs. 650", displayOrder: 9 },
      { id: "br_sp", name: "Supreme Bread (4 Pcs)", price: 400, description: "Rs. 400 | Garlic Bread: Rs. 300 | Stuffed Cheesy: Rs. 680", displayOrder: 10 },
    ],
  },
  {
    category: {
      id: "cat_pasta_sandwiches_fries",
      name: "🍝 Pasta, Sandwiches & Fries",
      urduName: "پاستا، سینڈوچ اور فرائز",
      description: "Baked pasta, pizza sandwiches & loaded fries",
      displayOrder: 10,
      isActive: true,
    },
    items: [
      { id: "pa_sp", name: "A-One Special Pasta", price: 430, description: "Small: Rs. 430 | Large: Rs. 720", displayOrder: 1 },
      { id: "pa_cr", name: "Crunchy Pasta", price: 480, description: "Small: Rs. 480 | Large: Rs. 800", displayOrder: 2 },
      { id: "pa_cm", name: "Creamy Pasta", price: 430, description: "Small: Rs. 430 | Large: Rs. 700", displayOrder: 3 },
      { id: "sw_sp", name: "A-One Special Sandwich", price: 700, description: "Rs. 700 | Grilled: Rs. 700 | Smoked: Rs. 650 | BBQ: Rs. 650", displayOrder: 4 },
      { id: "sw_pz", name: "Special Pizza Sandwich (W/ Fries)", price: 800, description: "Rs. 800 | Mexican Pizza Sandwich: Rs. 750", displayOrder: 5 },
      { id: "fr_sm", name: "Simple Fries", price: 180, description: "Small: Rs. 180 | Large: Rs. 380", displayOrder: 6 },
      { id: "fr_ld", name: "Loaded Fries", price: 620, description: "Rs. 620 | Mayo Fries: Rs. 400", displayOrder: 7 },
      { id: "fr_pz", name: "Pizza Fries", price: 600, description: "Peri Peri: Rs. 600 | Mozzarella: Rs. 440", displayOrder: 8 },
    ],
  },
  {
    category: {
      id: "cat_snacks_desserts",
      name: "🍗 Snacks & Desserts",
      urduName: "اسنیکس اور میٹھا",
      description: "Wings, chaat, custard & traditional desserts",
      displayOrder: 11,
      isActive: true,
    },
    items: [
      { id: "sn_hw", name: "Hot Wings (10pcs)", price: 620, description: "Rs. 620 | Oven Baked Wings (10pcs): Rs. 620", displayOrder: 1 },
      { id: "sn_hs", name: "Hot Shots (12pcs)", price: 600, description: "Rs. 600 | Nuggets (10pcs): Rs. 560", displayOrder: 2 },
      { id: "sn_gp", name: "Golden Piece (2pcs)", price: 580, description: "Rs. 580 | Tikka Stick: Rs. 160 | Drum Stick: Rs. 150", displayOrder: 3 },
      { id: "sn_cr", name: "Chicken Roll", price: 120, description: "Rs. 120 | Club Sandwich: Rs. 130 | Tikka Sandwich: Rs. 150", displayOrder: 4 },
      { id: "ds_db", name: "Dahi Bhaly", price: 190, description: "Rs. 190 | Chana Chaat: Rs. 200", displayOrder: 5 },
      { id: "ds_fc", name: "Special Fruit Chaat", price: 300, description: "Rs. 300 | Cream Chaat: Rs. 300", displayOrder: 6 },
      { id: "ds_cu", name: "Fruit Custard", price: 250, description: "S: Rs. 250 | M: Rs. 450 | L: Rs. 550", displayOrder: 7 },
      { id: "ds_rs", name: "Russian Salad", price: 250, description: "S: Rs. 250 | M: Rs. 450 | L: Rs. 550", displayOrder: 8 },
      { id: "ds_kh", name: "Special Kheer", price: 230, description: "Rs. 230 | Ras Malai: Rs. 240 | Brownie: Rs. 200", displayOrder: 9 },
    ],
  },
  {
    category: {
      id: "cat_shakes_beverages",
      name: "🥤 Shakes, Juices & Ice Cream",
      urduName: "شیکس، جوس اور آئس کریم",
      description: "Dry fruit shakes, milk shakes, fresh juices & ice creams",
      displayOrder: 12,
      isActive: true,
    },
    items: [
      { id: "bv_df", name: "Dry Fruit Shakes", price: 700, description: "Kaju: Rs. 700 | Mix: Rs. 700 | Almond: Rs. 500", displayOrder: 1 },
      { id: "bv_ym", name: "Yum's Shake (Oreo/Nutella/KitKat)", price: 400, description: "Rs. 400 | Cold Coffee: Rs. 400 | Caramel: Rs. 400", displayOrder: 2 },
      { id: "bv_ms", name: "Milk Shakes (Mango/Strawberry/Chico)", price: 280, description: "Rs. 280 | Khoya Khajoor: Rs. 350 | Banana: Rs. 200", displayOrder: 3 },
      { id: "bv_fj", name: "Fresh Juice (Peach/Falsa/Apple)", price: 250, description: "Rs. 250 | Red Anar: Rs. 500 | Mint Margarita: Rs. 150", displayOrder: 4 },
      { id: "bv_ic", name: "Regular Ice Cream Cup", price: 160, description: "S: Rs. 160 | M: Rs. 220 | L: Rs. 280", displayOrder: 5 },
      { id: "bv_si", name: "Special Ice Cream (Half / 1 Liter)", price: 400, description: "Half Liter: Rs. 400-550 | 1 Liter: Rs. 800-1000", displayOrder: 6 },
    ],
  },
];

async function syncMenu() {
  console.log("🚀 Overwriting database menu with 100% complete A-ONE Foods catalog...");

  try {
    // 1. Delete existing items and categories
    await prisma.menuItem.deleteMany().catch((e) => console.log("Notice deleting items:", e.message));
    await prisma.menuCategory.deleteMany().catch((e) => console.log("Notice deleting categories:", e.message));

    // 2. Insert new categories & items
    for (const block of MENU_DATA) {
      const cat = await prisma.menuCategory.create({
        data: {
          id: block.category.id,
          name: block.category.name,
          urduName: block.category.urduName,
          description: block.category.description,
          displayOrder: block.category.displayOrder,
          isActive: block.category.isActive,
        },
      });

      for (const item of block.items) {
        await prisma.menuItem.create({
          data: {
            id: item.id,
            categoryId: cat.id,
            name: item.name,
            price: item.price,
            description: item.description,
            displayOrder: item.displayOrder,
            isAvailable: true,
            isFeatured: item.displayOrder === 1,
            preparationTime: 15,
          },
        });
      }
    }

    console.log(`✅ Synced ${MENU_DATA.length} categories and ${MENU_DATA.reduce((acc, c) => acc + c.items.length, 0)} items into DB.`);

    // 3. Clear Redis Cache keys if Redis is configured
    if (process.env.REDIS_URL) {
      try {
        const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
        await redis.connect();
        const keys = await redis.keys("*menu*");
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log(`🧹 Flushed ${keys.length} Redis menu cache keys.`);
        }
        await redis.quit();
      } catch (err) {
        console.log("Redis cache flush notice:", err.message);
      }
    }

    console.log("✨ Menu sync complete!");
  } catch (err) {
    console.error("❌ Sync failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

syncMenu();
