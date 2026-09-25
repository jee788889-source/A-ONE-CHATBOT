import { prisma } from "@/lib/db";
import { MenuItemResult } from "@/lib/ai/tools";

export interface CategoryData {
  id: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  items?: MenuItemData[];
  _count?: { items: number };
}

export interface MenuItemData {
  id: string;
  categoryId: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  displayOrder: number;
  preparationTime?: number | null;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; name: string };
}

export const COMPLETE_CATEGORIES_DATA: Array<{
  id: string;
  name: string;
  urduName: string;
  description: string;
  displayOrder: number;
}> = [
  { id: "cat_pizza_regular", name: "🍕 Regular Pizzas", urduName: "ریگولر پیزا", description: "Tikka / Fajita / Supreme / Euro", displayOrder: 1 },
  { id: "cat_pizza_special", name: "🍕 Special A-One & Crust", urduName: "اسپیشل اے ون اور کرسٹ پیزا", description: "Malai Boti, Peri Peri, BBQ, Achari & Stuffed Crusts", displayOrder: 2 },
  { id: "cat_special_deals_1", name: "🔥 Special Deals (1-9)", urduName: "اسپیشل ڈیلز ۱ تا ۹", description: "Deals 1 to 9", displayOrder: 3 },
  { id: "cat_special_deals_2", name: "🔥 Special Deals (10-17)", urduName: "اسپیشل ڈیلز ۱۰ تا ۱۷", description: "Deals 10 to 17", displayOrder: 4 },
  { id: "cat_family_deals", name: "👨‍👩‍👧‍👦 Family Deals", urduName: "فیملی ڈیلز", description: "Family Combos & Deals", displayOrder: 5 },
  { id: "cat_summer_deals", name: "☀️ Summer Deals (1-10)", urduName: "سمر ڈیلز ۱ تا ۱۰", description: "Summer Deals 1 to 10", displayOrder: 6 },
  { id: "cat_rice_deals", name: "🍚 Rice Deals & Items", urduName: "بریانی اور چاول ڈیلز", description: "Biryani, Pulao & Rice Deals", displayOrder: 7 },
  { id: "cat_broast_burgers", name: "🍔 Broast, Burgers & Wraps", urduName: "بروسٹ، برگر اور ریپس", description: "Broast, Burgers & Wraps", displayOrder: 8 },
  { id: "cat_shawarma_paratha", name: "🌯 Shawarma, Rolls & Parathas", urduName: "شوارما، رولز اور پراٹھے", description: "Shawarma, Platters & Paratha Rolls", displayOrder: 9 },
  { id: "cat_pasta_sandwiches_fries", name: "🍝 Pasta, Sandwiches & Fries", urduName: "پاستا، سینڈوچ اور فرائز", description: "Pasta, Sandwiches & Loaded Fries", displayOrder: 10 },
  { id: "cat_snacks_desserts", name: "🍗 Snacks & Desserts", urduName: "اسنیکس اور میٹھا", description: "Wings, Chaat, Custard & Desserts", displayOrder: 11 },
  { id: "cat_shakes_beverages", name: "🥤 Shakes, Juices & Ice Cream", urduName: "شیکس، جوس اور آئس کریم", description: "Dry Fruit Shakes, Milk Shakes, Juices & Ice Cream", displayOrder: 12 },
];

export const COMPLETE_ITEMS_DATA: Array<{
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description: string;
  displayOrder: number;
}> = [
  // Regular Pizzas
  { id: "pz_reg_s", categoryId: "cat_pizza_regular", name: "Regular Pizza (Small)", price: 440, description: "Rs. 440 | Tikka / Fajita / Supreme / Euro", displayOrder: 1 },
  { id: "pz_reg_m", categoryId: "cat_pizza_regular", name: "Regular Pizza (Medium)", price: 900, description: "Rs. 900 | Tikka / Fajita / Supreme / Euro", displayOrder: 2 },
  { id: "pz_reg_l", categoryId: "cat_pizza_regular", name: "Regular Pizza (Large)", price: 1300, description: "Rs. 1300 | Tikka / Fajita / Supreme / Euro", displayOrder: 3 },
  { id: "pz_reg_xl", categoryId: "cat_pizza_regular", name: "Regular Pizza (X-Large)", price: 1900, description: "Rs. 1900 | Tikka / Fajita / Supreme / Euro", displayOrder: 4 },

  // Special Pizzas & Crust
  { id: "pz_sp_s", categoryId: "cat_pizza_special", name: "Special A-One (Small)", price: 480, description: "Rs. 480 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 1 },
  { id: "pz_sp_m", categoryId: "cat_pizza_special", name: "Special A-One (Medium)", price: 1000, description: "Rs. 1000 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 2 },
  { id: "pz_sp_l", categoryId: "cat_pizza_special", name: "Special A-One (Large)", price: 1450, description: "Rs. 1450 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 3 },
  { id: "pz_sp_xl", categoryId: "cat_pizza_special", name: "Special A-One (X-Large)", price: 2100, description: "Rs. 2100 | Malai Boti, Peri Peri, BBQ, Achari", displayOrder: 4 },
  { id: "pz_bh_s", categoryId: "cat_pizza_special", name: "Behari Kabab Pizza (Small)", price: 500, description: "Rs. 500", displayOrder: 5 },
  { id: "pz_bh_m", categoryId: "cat_pizza_special", name: "Behari Kabab Pizza (Medium)", price: 1050, description: "Rs. 1050", displayOrder: 6 },
  { id: "pz_bh_l", categoryId: "cat_pizza_special", name: "Behari Kabab Pizza (Large)", price: 1500, description: "Rs. 1500", displayOrder: 7 },
  { id: "pz_bh_xl", categoryId: "cat_pizza_special", name: "Behari Kabab Pizza (XL)", price: 2200, description: "Rs. 2200", displayOrder: 8 },
  { id: "pz_cr_l", categoryId: "cat_pizza_special", name: "Special Crust (Large)", price: 1200, description: "Rs. 1200 | Square/Extreme/Kabab/Cheese/Chicken", displayOrder: 9 },
  { id: "pz_cr_xl", categoryId: "cat_pizza_special", name: "Special Crust (X-Large)", price: 1750, description: "Rs. 1750 | Square/Extreme/Kabab/Cheese/Chicken", displayOrder: 10 },

  // Special Deals 1-9
  { id: "deal_1", categoryId: "cat_special_deals_1", name: "Deal 1", price: 580, description: "1 Small Pizza, 350ml Drink - Rs. 580", displayOrder: 1 },
  { id: "deal_2", categoryId: "cat_special_deals_1", name: "Deal 2", price: 500, description: "1 Patty Burger, 1 Small Fries, 350ml Drink - Rs. 500", displayOrder: 2 },
  { id: "deal_3", categoryId: "cat_special_deals_1", name: "Deal 3", price: 810, description: "2 Zinger Burgers, 2 Drinks 350ml - Rs. 810", displayOrder: 3 },
  { id: "deal_4", categoryId: "cat_special_deals_1", name: "Deal 4", price: 1150, description: "2 Zinger Burgers, 2 Reg Fries, 2 Drinks 350ml - Rs. 1150", displayOrder: 4 },
  { id: "deal_5", categoryId: "cat_special_deals_1", name: "Deal 5", price: 750, description: "1 Zinger Burger, 1 Patty Burger, 1 Fries, 2 Drinks 350ml - Rs. 750", displayOrder: 5 },
  { id: "deal_6", categoryId: "cat_special_deals_1", name: "Deal 6", price: 1700, description: "1 Large Pizza, 1 Medium Pizza, 1.5 Ltr Drink - Rs. 1700", displayOrder: 6 },
  { id: "deal_7", categoryId: "cat_special_deals_1", name: "Deal 7", price: 2650, description: "2 Large Pizzas, 1.5 Ltr Drink - Rs. 2650", displayOrder: 7 },
  { id: "deal_8", categoryId: "cat_special_deals_1", name: "Deal 8", price: 480, description: "1 Small Pizza, 1 Zinger Burger, 1 Drink 350ml - Rs. 480", displayOrder: 8 },
  { id: "deal_9", categoryId: "cat_special_deals_1", name: "Deal 9", price: 1300, description: "1 Medium Pizza, 5 Pcs Hot Wings, 1 Drink 500ml - Rs. 1300", displayOrder: 9 },

  // Special Deals 10-17
  { id: "deal_10", categoryId: "cat_special_deals_2", name: "Deal 10", price: 1700, description: "1 Large Pizza, 1 Large Fries, 1 Drink 1.5 Ltr - Rs. 1700", displayOrder: 1 },
  { id: "deal_11", categoryId: "cat_special_deals_2", name: "Deal 11", price: 1250, description: "1 Medium Pizza, 5 Hot Wings, 1 Drink 500ml - Rs. 1250", displayOrder: 2 },
  { id: "deal_12", categoryId: "cat_special_deals_2", name: "Deal 12", price: 1800, description: "1 Zinger Burger, 1 Large Fries, 1 Drink 350ml - Rs. 1800", displayOrder: 3 },
  { id: "deal_13", categoryId: "cat_special_deals_2", name: "Deal 13", price: 1950, description: "1 Large Pizza, 4 Spin Roll, 1.5 Ltr Drink - Rs. 1950", displayOrder: 4 },
  { id: "deal_14", categoryId: "cat_special_deals_2", name: "Deal 14", price: 1150, description: "2 Grill Burger, 1 Fries, 2 Drinks 350ml - Rs. 1150", displayOrder: 5 },
  { id: "deal_15", categoryId: "cat_special_deals_2", name: "Deal 15", price: 1700, description: "1 Large Pizza, 1 Large Fries, 1 Drink 1.5 Ltr - Rs. 1700", displayOrder: 6 },
  { id: "deal_16", categoryId: "cat_special_deals_2", name: "Deal 16", price: 860, description: "1 Small Pizza, 1 Zinger Burger, 1 Drink 350ml - Rs. 860", displayOrder: 7 },
  { id: "deal_17", categoryId: "cat_special_deals_2", name: "Deal 17", price: 1650, description: "2 Small Pizzas, 1 Zinger Wrap, 1 Drink 350ml - Rs. 1650", displayOrder: 8 },

  // Family Deals
  { id: "fam_1", categoryId: "cat_family_deals", name: "Family Deal 1", price: 3180, description: "2 Large Pizza, 1 Large Fries, 1 Broast, 1.5L Drink - Rs. 3180", displayOrder: 1 },
  { id: "fam_2", categoryId: "cat_family_deals", name: "Family Deal 2", price: 3000, description: "2 Large Pizza, 1.5 Ltr Drink - Rs. 3000", displayOrder: 2 },
  { id: "fam_3", categoryId: "cat_family_deals", name: "Family Deal 3", price: 2100, description: "2 Broast, 1 Fries, 1.5 Ltr Drink - Rs. 2100", displayOrder: 3 },
  { id: "fam_4", categoryId: "cat_family_deals", name: "Family Deal 4", price: 3350, description: "2 Large Pizza, 1 Large Fries, 1.5 Ltr Drink - Rs. 3350", displayOrder: 4 },

  // Summer Deals
  { id: "sum_1", categoryId: "cat_summer_deals", name: "Summer Deal 1", price: 1100, description: "2 Small Pasta, 1 Brownie, 500ml Drink - Rs. 1100", displayOrder: 1 },
  { id: "sum_2", categoryId: "cat_summer_deals", name: "Summer Deal 2", price: 1900, description: "4 Zinger Burgers, 2 Brownies, 1.5 Ltr Drink - Rs. 1900", displayOrder: 2 },
  { id: "sum_3", categoryId: "cat_summer_deals", name: "Summer Deal 3", price: 770, description: "1 Small Pasta, 1 Small Fries, 500ml Drink - Rs. 770", displayOrder: 3 },
  { id: "sum_4", categoryId: "cat_summer_deals", name: "Summer Deal 4", price: 690, description: "2 Chicken Burgers, 1 Small Fries, 1 Drink 350ml - Rs. 690", displayOrder: 4 },
  { id: "sum_5", categoryId: "cat_summer_deals", name: "Summer Deal 5", price: 1200, description: "1 Large Pasta, 1 Custard, 500ml Drink - Rs. 1200", displayOrder: 5 },
  { id: "sum_6", categoryId: "cat_summer_deals", name: "Summer Deal 6", price: 1450, description: "2 Zinger Burgers, 1 Large Pasta, 1 Drink 1.5 Ltr - Rs. 1450", displayOrder: 6 },
  { id: "sum_7", categoryId: "cat_summer_deals", name: "Summer Deal 7", price: 3050, description: "2 Large Pizzas, 1 Large Pasta, 1.5 Ltr Drink - Rs. 3050", displayOrder: 7 },
  { id: "sum_8", categoryId: "cat_summer_deals", name: "Summer Deal 8", price: 1070, description: "2 Small Pasta, 500ml Drink - Rs. 1070", displayOrder: 8 },
  { id: "sum_9", categoryId: "cat_summer_deals", name: "Summer Deal 9", price: 1950, description: "1 Large Pizza, 4 Pcs Spin Roll, 1 Ltr Drink - Rs. 1950", displayOrder: 9 },
  { id: "sum_10", categoryId: "cat_summer_deals", name: "Summer Deal 10", price: 890, description: "2 Zinger Parathas, 1 Small Fries, 1 Drink 500ml - Rs. 890", displayOrder: 10 },

  // Rice Deals & Items
  { id: "rd_1", categoryId: "cat_rice_deals", name: "Rice Deal 1", price: 1050, description: "2 Biryani/Pulao, 1 Kheer, 1 Drink 500ml - Rs. 1050", displayOrder: 1 },
  { id: "rd_2", categoryId: "cat_rice_deals", name: "Rice Deal 2", price: 990, description: "2 Biryani/Pulao, 1 Half Zarda, 1 Drink 500ml - Rs. 990", displayOrder: 2 },
  { id: "rd_3", categoryId: "cat_rice_deals", name: "Rice Deal 3", price: 630, description: "1 Biryani/Pulao, 1 Brownie, 1 Drink 350ml - Rs. 630", displayOrder: 3 },
  { id: "rd_4", categoryId: "cat_rice_deals", name: "Rice Deal 4", price: 1070, description: "1 Biryani/Pulao, 1 Sm Russian Salad, 1 Drink 350ml - Rs. 1070", displayOrder: 4 },
  { id: "rd_5", categoryId: "cat_rice_deals", name: "Rice Deal 5", price: 580, description: "1 Biryani/Pulao, 1 Half Zarda, 1 Drink 350ml - Rs. 580", displayOrder: 5 },
  { id: "rd_6", categoryId: "cat_rice_deals", name: "Rice Deal 6", price: 500, description: "1 Biryani/Pulao, 1 Pastry, 1 Drink 350ml - Rs. 500", displayOrder: 6 },
  { id: "rd_7", categoryId: "cat_rice_deals", name: "Rice Deal 7", price: 550, description: "1 Beef Pulao, 1 Pastry, 1 Drink 350ml - Rs. 550", displayOrder: 7 },
  { id: "rd_8", categoryId: "cat_rice_deals", name: "Rice Deal 8", price: 580, description: "1 Biryani/Pulao, 1 Mint Margarita, 1 Pastry - Rs. 580", displayOrder: 8 },
  { id: "tr_cb", categoryId: "cat_rice_deals", name: "Chicken Biryani", price: 380, description: "Rs. 380 (Simple Biryani: Rs. 230)", displayOrder: 9 },
  { id: "tr_cp", categoryId: "cat_rice_deals", name: "Chicken Pulao", price: 380, description: "Rs. 380 (Simple Pulao: Rs. 230)", displayOrder: 10 },
  { id: "tr_sb", categoryId: "cat_rice_deals", name: "Special Biryani", price: 440, description: "Rs. 440 (Double chicken loaded)", displayOrder: 11 },
  { id: "tr_sp", categoryId: "cat_rice_deals", name: "Special Pulao", price: 440, description: "Rs. 440 (Special aroma seasoned pulao)", displayOrder: 12 },
  { id: "tr_bp", categoryId: "cat_rice_deals", name: "Beef Pulao", price: 430, description: "Rs. 430 (Zarda: Rs. 300 | Shami: Rs. 50)", displayOrder: 13 },

  // Broast, Burgers & Wraps
  { id: "br_f", categoryId: "cat_broast_burgers", name: "Chicken Broast (Full)", price: 2000, description: "Full: Rs. 2000 | Half: Rs. 1200 | Quarter: Rs. 700", displayOrder: 1 },
  { id: "bg_z", categoryId: "cat_broast_burgers", name: "Zinger Burger", price: 370, description: "Crispy fried fillet - Rs. 370", displayOrder: 2 },
  { id: "bg_mz", categoryId: "cat_broast_burgers", name: "Mighty Zinger", price: 430, description: "Double patty zinger - Rs. 430", displayOrder: 3 },
  { id: "bg_gr", categoryId: "cat_broast_burgers", name: "Grill Burger", price: 450, description: "Grilled patty loaded - Rs. 450", displayOrder: 4 },
  { id: "bg_pz", categoryId: "cat_broast_burgers", name: "Pizza Burger", price: 480, description: "Pizza stuffed cheese burger - Rs. 480", displayOrder: 5 },
  { id: "bg_mb", categoryId: "cat_broast_burgers", name: "Malai Boti Burger", price: 500, description: "Creamy boti chicken - Rs. 500", displayOrder: 6 },
  { id: "bg_stk", categoryId: "cat_broast_burgers", name: "Steaker Burger", price: 530, description: "Chef special beef/chicken - Rs. 530", displayOrder: 7 },
  { id: "bg_twr", categoryId: "cat_broast_burgers", name: "Tower Burger", price: 530, description: "Chef special tower loaded - Rs. 530", displayOrder: 8 },
  { id: "bg_pt", categoryId: "cat_broast_burgers", name: "Patty Burger", price: 290, description: "Rs. 290 | Student: Rs. 250 | Chicken: Rs. 220", displayOrder: 9 },
  { id: "bg_sh", categoryId: "cat_broast_burgers", name: "Shami Burger", price: 160, description: "Rs. 160 | Double Shami: Rs. 200", displayOrder: 10 },
  { id: "wp_z", categoryId: "cat_broast_burgers", name: "Zinger Wrap", price: 420, description: "Rs. 420 | Tikka Wrap: Rs. 420 | Fajita Wrap: Rs. 420", displayOrder: 11 },

  // Shawarma, Rolls & Parathas
  { id: "sh_ck", categoryId: "cat_shawarma_paratha", name: "Chicken Shawarma", price: 200, description: "Fresh rolled shawarma - Rs. 200", displayOrder: 1 },
  { id: "sh_zg", categoryId: "cat_shawarma_paratha", name: "Zinger Shawarma", price: 280, description: "Crispy zinger roll - Rs. 280", displayOrder: 2 },
  { id: "sh_mb", categoryId: "cat_shawarma_paratha", name: "Malai Boti Shawarma", price: 300, description: "Rs. 300 | Arabic Shawarma: Rs. 320", displayOrder: 3 },
  { id: "pl_sp", categoryId: "cat_shawarma_paratha", name: "Special Platter", price: 1070, description: "4 Spin Roll, 5 Oven Wings, Fries, Drink - Rs. 1070", displayOrder: 4 },
  { id: "pl_ck", categoryId: "cat_shawarma_paratha", name: "Chicken Shawarma Platter", price: 420, description: "Rs. 420 | Arabic Platter: Rs. 550", displayOrder: 5 },
  { id: "pr_kb", categoryId: "cat_shawarma_paratha", name: "Kabab Paratha", price: 320, description: "Rs. 320 | Zinger Paratha: Rs. 300", displayOrder: 6 },
  { id: "pr_mb", categoryId: "cat_shawarma_paratha", name: "Malai Boti Paratha", price: 360, description: "Rs. 360 | Chicken Cheese Paratha: Rs. 360", displayOrder: 7 },
  { id: "pr_cp", categoryId: "cat_shawarma_paratha", name: "Chicken Paratha", price: 280, description: "Hot crispy paratha - Rs. 280", displayOrder: 8 },
  { id: "sr_mb", categoryId: "cat_shawarma_paratha", name: "Spin Roll Malai Boti (4 Pcs)", price: 700, description: "Rs. 700 | Special: Rs. 600 | Behari: Rs. 650", displayOrder: 9 },
  { id: "br_sp", categoryId: "cat_shawarma_paratha", name: "Supreme Bread (4 Pcs)", price: 400, description: "Rs. 400 | Garlic Bread: Rs. 300 | Stuffed Cheesy: Rs. 680", displayOrder: 10 },

  // Pasta, Sandwiches & Fries
  { id: "pa_sp", categoryId: "cat_pasta_sandwiches_fries", name: "A-One Special Pasta", price: 430, description: "Small: Rs. 430 | Large: Rs. 720", displayOrder: 1 },
  { id: "pa_cr", categoryId: "cat_pasta_sandwiches_fries", name: "Crunchy Pasta", price: 480, description: "Small: Rs. 480 | Large: Rs. 800", displayOrder: 2 },
  { id: "pa_cm", categoryId: "cat_pasta_sandwiches_fries", name: "Creamy Pasta", price: 430, description: "Small: Rs. 430 | Large: Rs. 700", displayOrder: 3 },
  { id: "sw_sp", categoryId: "cat_pasta_sandwiches_fries", name: "A-One Special Sandwich", price: 700, description: "Rs. 700 | Grilled: Rs. 700 | Smoked: Rs. 650 | BBQ: Rs. 650", displayOrder: 4 },
  { id: "sw_pz", categoryId: "cat_pasta_sandwiches_fries", name: "Special Pizza Sandwich (W/ Fries)", price: 800, description: "Rs. 800 | Mexican Pizza Sandwich: Rs. 750", displayOrder: 5 },
  { id: "fr_sm", categoryId: "cat_pasta_sandwiches_fries", name: "Simple Fries", price: 180, description: "Small: Rs. 180 | Large: Rs. 380", displayOrder: 6 },
  { id: "fr_ld", categoryId: "cat_pasta_sandwiches_fries", name: "Loaded Fries", price: 620, description: "Rs. 620 | Mayo Fries: Rs. 400", displayOrder: 7 },
  { id: "fr_pz", categoryId: "cat_pasta_sandwiches_fries", name: "Pizza Fries", price: 600, description: "Peri Peri: Rs. 600 | Mozzarella: Rs. 440", displayOrder: 8 },

  // Snacks & Desserts
  { id: "sn_hw", categoryId: "cat_snacks_desserts", name: "Hot Wings (10pcs)", price: 620, description: "Rs. 620 | Oven Baked Wings (10pcs): Rs. 620", displayOrder: 1 },
  { id: "sn_hs", categoryId: "cat_snacks_desserts", name: "Hot Shots (12pcs)", price: 600, description: "Rs. 600 | Nuggets (10pcs): Rs. 560", displayOrder: 2 },
  { id: "sn_gp", categoryId: "cat_snacks_desserts", name: "Golden Piece (2pcs)", price: 580, description: "Rs. 580 | Tikka Stick: Rs. 160 | Drum Stick: Rs. 150", displayOrder: 3 },
  { id: "sn_cr", categoryId: "cat_snacks_desserts", name: "Chicken Roll", price: 120, description: "Rs. 120 | Club Sandwich: Rs. 130 | Tikka Sandwich: Rs. 150", displayOrder: 4 },
  { id: "ds_db", categoryId: "cat_snacks_desserts", name: "Dahi Bhaly", price: 190, description: "Rs. 190 | Chana Chaat: Rs. 200", displayOrder: 5 },
  { id: "ds_fc", categoryId: "cat_snacks_desserts", name: "Special Fruit Chaat", price: 300, description: "Rs. 300 | Cream Chaat: Rs. 300", displayOrder: 6 },
  { id: "ds_cu", categoryId: "cat_snacks_desserts", name: "Fruit Custard", price: 250, description: "S: Rs. 250 | M: Rs. 450 | L: Rs. 550", displayOrder: 7 },
  { id: "ds_rs", categoryId: "cat_snacks_desserts", name: "Russian Salad", price: 250, description: "S: Rs. 250 | M: Rs. 450 | L: Rs. 550", displayOrder: 8 },
  { id: "ds_kh", categoryId: "cat_snacks_desserts", name: "Special Kheer", price: 230, description: "Rs. 230 | Ras Malai: Rs. 240 | Brownie: Rs. 200", displayOrder: 9 },

  // Shakes, Juices & Ice Cream
  { id: "bv_df", categoryId: "cat_shakes_beverages", name: "Dry Fruit Shakes", price: 700, description: "Kaju: Rs. 700 | Mix: Rs. 700 | Almond: Rs. 500", displayOrder: 1 },
  { id: "bv_ym", categoryId: "cat_shakes_beverages", name: "Yum's Shake (Oreo/Nutella/KitKat)", price: 400, description: "Rs. 400 | Cold Coffee: Rs. 400 | Caramel: Rs. 400", displayOrder: 2 },
  { id: "bv_ms", categoryId: "cat_shakes_beverages", name: "Milk Shakes (Mango/Strawberry/Chico)", price: 280, description: "Rs. 280 | Khoya Khajoor: Rs. 350 | Banana: Rs. 200", displayOrder: 3 },
  { id: "bv_fj", categoryId: "cat_shakes_beverages", name: "Fresh Juice (Peach/Falsa/Apple)", price: 250, description: "Rs. 250 | Red Anar: Rs. 500 | Mint Margarita: Rs. 150", displayOrder: 4 },
  { id: "bv_ic", categoryId: "cat_shakes_beverages", name: "Regular Ice Cream Cup", price: 160, description: "S: Rs. 160 | M: Rs. 220 | L: Rs. 280", displayOrder: 5 },
  { id: "bv_si", categoryId: "cat_shakes_beverages", name: "Special Ice Cream (Half / 1 Liter)", price: 400, description: "Half Liter: Rs. 400-550 | 1 Liter: Rs. 800-1000", displayOrder: 6 },
];

// In-Memory fallback store
const memoryCategories: CategoryData[] = COMPLETE_CATEGORIES_DATA.map((c) => ({
  id: c.id,
  name: c.name,
  urduName: c.urduName,
  description: c.description,
  displayOrder: c.displayOrder,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { items: COMPLETE_ITEMS_DATA.filter((i) => i.categoryId === c.id).length },
}));

const memoryItems: MenuItemData[] = COMPLETE_ITEMS_DATA.map((item) => {
  const cat = COMPLETE_CATEGORIES_DATA.find((c) => c.id === item.categoryId);
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: null,
    isAvailable: true,
    isFeatured: item.displayOrder === 1,
    displayOrder: item.displayOrder,
    preparationTime: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: cat ? { id: cat.id, name: cat.name } : undefined,
  };
});

// =============================================================================
// CATEGORIES CRUD
// =============================================================================

export async function fetchAllCategories(): Promise<CategoryData[]> {
  try {
    const dbCategories = await prisma.menuCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        items: { orderBy: { displayOrder: "asc" } },
        _count: { select: { items: true } },
      },
    });

    if (dbCategories.length > 0) {
      return dbCategories as CategoryData[];
    }
  } catch (err) {
    console.warn("[menu-store:fetchAllCategories] db query fallback:", (err as any)?.message);
  }

  // Update item counts in memory
  return memoryCategories.map((c) => ({
    ...c,
    items: memoryItems.filter((i) => i.categoryId === c.id),
    _count: { items: memoryItems.filter((i) => i.categoryId === c.id).length },
  }));
}

export async function createMenuCategory(data: {
  name: string;
  urduName?: string | null;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}): Promise<CategoryData> {
  const newId = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const displayOrder = data.displayOrder ?? memoryCategories.length + 1;
  const isActive = data.isActive ?? true;

  try {
    const created = await prisma.menuCategory.create({
      data: {
        name: data.name.trim(),
        urduName: data.urduName?.trim() || null,
        description: data.description?.trim() || null,
        displayOrder,
        isActive,
      },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
    });

    memoryCategories.push(created as CategoryData);
    return created as CategoryData;
  } catch (err: any) {
    console.warn("[menu-store:createMenuCategory] db fallback:", err.message);

    const memCategory: CategoryData = {
      id: newId,
      name: data.name.trim(),
      urduName: data.urduName?.trim() || null,
      description: data.description?.trim() || null,
      displayOrder,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      _count: { items: 0 },
    };

    memoryCategories.push(memCategory);
    return memCategory;
  }
}

export async function updateMenuCategory(
  id: string,
  data: {
    name?: string;
    urduName?: string | null;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }
): Promise<CategoryData> {
  try {
    const updated = await prisma.menuCategory.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        urduName: data.urduName !== undefined ? (data.urduName?.trim() || null) : undefined,
        description: data.description !== undefined ? (data.description?.trim() || null) : undefined,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
    });

    const idx = memoryCategories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      memoryCategories[idx] = { ...memoryCategories[idx], ...(updated as CategoryData) };
    }
    return updated as CategoryData;
  } catch (err: any) {
    console.warn("[menu-store:updateMenuCategory] db fallback:", err.message);

    const idx = memoryCategories.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Category with ID ${id} not found.`);
    }

    const current = memoryCategories[idx];
    const updated: CategoryData = {
      ...current,
      name: data.name?.trim() ?? current.name,
      urduName: data.urduName !== undefined ? (data.urduName?.trim() || null) : current.urduName,
      description: data.description !== undefined ? (data.description?.trim() || null) : current.description,
      displayOrder: data.displayOrder ?? current.displayOrder,
      isActive: data.isActive ?? current.isActive,
      updatedAt: new Date(),
    };

    memoryCategories[idx] = updated;

    for (const item of memoryItems) {
      if (item.categoryId === id && item.category) {
        item.category.name = updated.name;
      }
    }

    return updated;
  }
}

export async function deleteMenuCategory(id: string): Promise<{ ok: boolean; deletedName: string }> {
  try {
    const deleted = await prisma.menuCategory.delete({
      where: { id },
    });

    const idx = memoryCategories.findIndex((c) => c.id === id);
    if (idx !== -1) memoryCategories.splice(idx, 1);

    const remainingItems = memoryItems.filter((i) => i.categoryId !== id);
    memoryItems.length = 0;
    memoryItems.push(...remainingItems);

    return { ok: true, deletedName: deleted.name };
  } catch (err: any) {
    console.warn("[menu-store:deleteMenuCategory] db fallback:", err.message);

    const idx = memoryCategories.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Category with ID ${id} not found.`);
    }

    const deletedName = memoryCategories[idx].name;
    memoryCategories.splice(idx, 1);

    const remainingItems = memoryItems.filter((i) => i.categoryId !== id);
    memoryItems.length = 0;
    memoryItems.push(...remainingItems);

    return { ok: true, deletedName };
  }
}

// =============================================================================
// MENU ITEMS CRUD
// =============================================================================

export async function fetchAllMenuItems(categoryId?: string, search?: string): Promise<MenuItemData[]> {
  try {
    const where: any = {};
    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }
    if (search?.trim()) {
      const s = search.trim();
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { description: { contains: s, mode: "insensitive" } },
        { urduName: { contains: s, mode: "insensitive" } },
      ];
    }

    const dbItems = await prisma.menuItem.findMany({
      where,
      orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (dbItems.length > 0) {
      return dbItems as MenuItemData[];
    }
  } catch (err) {
    console.warn("[menu-store:fetchAllMenuItems] db fallback:", (err as any)?.message);
  }

  let items = [...memoryItems];
  if (categoryId && categoryId !== "ALL") {
    items = items.filter((i) => i.categoryId === categoryId);
  }
  if (search?.trim()) {
    const term = search.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        (i.description && i.description.toLowerCase().includes(term)) ||
        (i.urduName && i.urduName.includes(term))
    );
  }
  return items;
}

export async function createMenuItem(data: {
  categoryId: string;
  name: string;
  urduName?: string | null;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  preparationTime?: number;
}): Promise<MenuItemData> {
  const newId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const price = Math.max(1, Number(data.price));
  const isAvailable = data.isAvailable ?? true;
  const isFeatured = data.isFeatured ?? false;
  const displayOrder = data.displayOrder ?? memoryItems.length + 1;
  const preparationTime = data.preparationTime ?? 15;

  try {
    const item = await prisma.menuItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name.trim(),
        urduName: data.urduName?.trim() || null,
        description: data.description?.trim() || null,
        price,
        imageUrl: data.imageUrl || null,
        isAvailable,
        isFeatured,
        displayOrder,
        preparationTime,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    memoryItems.push(item as MenuItemData);
    return item as MenuItemData;
  } catch (err: any) {
    console.warn("[menu-store:createMenuItem] db fallback:", err.message);

    const category = memoryCategories.find((c) => c.id === data.categoryId);
    const memItem: MenuItemData = {
      id: newId,
      categoryId: data.categoryId,
      name: data.name.trim(),
      urduName: data.urduName?.trim() || null,
      description: data.description?.trim() || null,
      price,
      imageUrl: data.imageUrl || null,
      isAvailable,
      isFeatured,
      displayOrder,
      preparationTime,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: category ? { id: category.id, name: category.name } : undefined,
    };

    memoryItems.push(memItem);
    return memItem;
  }
}

export async function updateMenuItem(
  id: string,
  data: {
    categoryId?: string;
    name?: string;
    urduName?: string | null;
    description?: string | null;
    price?: number;
    imageUrl?: string | null;
    isAvailable?: boolean;
    isFeatured?: boolean;
    displayOrder?: number;
    preparationTime?: number;
  }
): Promise<MenuItemData> {
  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        name: data.name?.trim(),
        urduName: data.urduName !== undefined ? (data.urduName?.trim() || null) : undefined,
        description: data.description !== undefined ? (data.description?.trim() || null) : undefined,
        price: data.price !== undefined ? Math.max(1, Number(data.price)) : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        displayOrder: data.displayOrder,
        preparationTime: data.preparationTime,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    const idx = memoryItems.findIndex((i) => i.id === id);
    if (idx !== -1) memoryItems[idx] = item as MenuItemData;
    return item as MenuItemData;
  } catch (err: any) {
    console.warn("[menu-store:updateMenuItem] db fallback:", err.message);

    const idx = memoryItems.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Menu item with ID ${id} not found.`);
    }

    const current = memoryItems[idx];
    const catId = data.categoryId ?? current.categoryId;
    const category = memoryCategories.find((c) => c.id === catId);

    const updated: MenuItemData = {
      ...current,
      categoryId: catId,
      name: data.name?.trim() ?? current.name,
      urduName: data.urduName !== undefined ? (data.urduName?.trim() || null) : current.urduName,
      description: data.description !== undefined ? (data.description?.trim() || null) : current.description,
      price: data.price !== undefined ? Math.max(1, Number(data.price)) : current.price,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : current.imageUrl,
      isAvailable: data.isAvailable !== undefined ? data.isAvailable : current.isAvailable,
      isFeatured: data.isFeatured !== undefined ? data.isFeatured : current.isFeatured,
      displayOrder: data.displayOrder ?? current.displayOrder,
      preparationTime: data.preparationTime ?? current.preparationTime,
      updatedAt: new Date(),
      category: category ? { id: category.id, name: category.name } : current.category,
    };

    memoryItems[idx] = updated;
    return updated;
  }
}

export async function updateMenuItemAvailability(id: string, isAvailable: boolean): Promise<MenuItemData> {
  return updateMenuItem(id, { isAvailable });
}

export async function deleteMenuItem(id: string): Promise<{ ok: boolean; deletedName: string }> {
  try {
    const deleted = await prisma.menuItem.delete({
      where: { id },
    });

    const idx = memoryItems.findIndex((i) => i.id === id);
    if (idx !== -1) memoryItems.splice(idx, 1);
    return { ok: true, deletedName: deleted.name };
  } catch (err: any) {
    console.warn("[menu-store:deleteMenuItem] db fallback:", err.message);

    const idx = memoryItems.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Menu item with ID ${id} not found.`);
    }

    const deletedName = memoryItems[idx].name;
    memoryItems.splice(idx, 1);
    return { ok: true, deletedName };
  }
}
