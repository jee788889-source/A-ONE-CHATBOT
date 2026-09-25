export interface MenuItemRow {
  id: string;
  title: string;
  description: string;
}

export interface MenuCategoryData {
  title: string;
  rows: MenuItemRow[];
}

export const MENU_CATEGORIES_LIST: MenuItemRow[] = [
  {
    id: "cat_pizza_regular",
    title: "🍕 Regular Pizzas",
    description: "Tikka, Fajita, Supreme, Euro",
  },
  {
    id: "cat_pizza_special",
    title: "🍕 Special & Crust Pizzas",
    description: "Malai Boti, Behari Kabab, Stuffer Crust",
  },
  {
    id: "cat_special_deals",
    title: "🔥 Special Deals",
    description: "Budget deals with drinks & combos",
  },
  {
    id: "cat_broast_burgers",
    title: "🍔 Broast & Burgers",
    description: "Crispy broast, zingers, wraps",
  },
  {
    id: "cat_shawarma_paratha",
    title: "🌯 Shawarma & Rolls",
    description: "Shawarma, platters, paratha rolls",
  },
  {
    id: "cat_pasta_fries",
    title: "🍝 Pasta & Loaded Fries",
    description: "Baked pastas, sandwiches, loaded fries",
  },
  {
    id: "cat_rice_deals",
    title: "🍚 Rice & Traditional",
    description: "Biryani, pulao, zarda",
  },
  {
    id: "cat_shakes_beverages",
    title: "🥤 Shakes & Drinks",
    description: "Fresh juices, ice cream, shakes",
  },
];

export const MENU_DATA: Record<string, MenuCategoryData> = {
  cat_pizza_regular: {
    title: "🍕 Regular Pizzas",
    rows: [
      { id: "item_pz_reg_s", title: "Regular Pizza (Small)", description: "Rs. 440 | Tikka / Fajita / Supreme" },
      { id: "item_pz_reg_m", title: "Regular Pizza (Medium)", description: "Rs. 900 | Tikka / Fajita / Supreme" },
      { id: "item_pz_reg_l", title: "Regular Pizza (Large)", description: "Rs. 1300 | Tikka / Fajita / Supreme" },
      { id: "item_pz_reg_xl", title: "Regular Pizza (XL)", description: "Rs. 1900 | Tikka / Fajita / Supreme" },
    ],
  },
  cat_pizza_special: {
    title: "🍕 Special & Crust Pizzas",
    rows: [
      { id: "item_pz_sp_s", title: "Special A-One (Small)", description: "Rs. 480 | Malai Boti, Peri Peri, BBQ, Achari" },
      { id: "item_pz_sp_m", title: "Special A-One (Medium)", description: "Rs. 1000 | Malai Boti, Peri Peri, BBQ, Achari" },
      { id: "item_pz_sp_l", title: "Special A-One (Large)", description: "Rs. 1450 | Malai Boti, Peri Peri, BBQ, Achari" },
      { id: "item_pz_sp_xl", title: "Special A-One (XL)", description: "Rs. 2100 | Malai Boti, Peri Peri, BBQ, Achari" },
      { id: "item_pz_bh_s", title: "Behari Kabab Pizza (S)", description: "Rs. 500 | Behari spiced grilled chicken" },
      { id: "item_pz_bh_m", title: "Behari Kabab Pizza (M)", description: "Rs. 1050 | Behari spiced grilled chicken" },
      { id: "item_pz_bh_l", title: "Behari Kabab Pizza (L)", description: "Rs. 1500 | Behari spiced grilled chicken" },
      { id: "item_pz_bh_xl", title: "Behari Kabab Pizza (XL)", description: "Rs. 2200 | Behari spiced grilled chicken" },
      { id: "item_pz_cr_l", title: "Special Crust (Large)", description: "Rs. 1200 | Stuffed / Kabab / Cheese / Extreme" },
      { id: "item_pz_cr_xl", title: "Special Crust (XL)", description: "Rs. 1750 | Stuffed / Kabab / Cheese / Extreme" },
    ],
  },
  cat_special_deals: {
    title: "🔥 Special Deals",
    rows: [
      { id: "item_deal_1", title: "Deal 1 - Rs. 580", description: "1 Small Pizza, 350ml Drink" },
      { id: "item_deal_2", title: "Deal 2 - Rs. 500", description: "1 Patty Burger, 1 Small Fries, 350ml Drink" },
      { id: "item_deal_3", title: "Deal 3 - Rs. 810", description: "2 Zinger Burgers, 2 Drinks 350ml" },
      { id: "item_deal_4", title: "Deal 4 - Rs. 1150", description: "2 Zinger Burgers, 2 Reg Fries, 2 Drinks 350ml" },
      { id: "item_deal_5", title: "Deal 5 - Rs. 750", description: "1 Zinger, 1 Patty Burger, 1 Fries, 2 Drinks" },
      { id: "item_deal_6", title: "Deal 6 - Rs. 1700", description: "1 Large Pizza, 1 Medium Pizza, 1.5L Drink" },
      { id: "item_deal_7", title: "Deal 7 - Rs. 2650", description: "2 Large Pizzas, 1.5 Ltr Drink" },
      { id: "item_deal_8", title: "Deal 8 - Rs. 480", description: "1 Small Pizza, 1 Zinger Burger, 1 Drink 350ml" },
      { id: "item_deal_9", title: "Deal 9 - Rs. 1300", description: "1 Medium Pizza, 5 Hot Wings, 1 Drink 500ml" },
      { id: "item_deal_10", title: "Deal 10 - Rs. 1700", description: "1 Large Pizza, 1 Large Fries, 1.5L Drink" },
    ],
  },
  cat_special_deals_1: {
    title: "🔥 Special Deals (1-9)",
    rows: [
      { id: "item_deal_1", title: "Deal 1 - Rs. 580", description: "1 Small Pizza, 350ml Drink" },
      { id: "item_deal_2", title: "Deal 2 - Rs. 500", description: "1 Patty Burger, 1 Small Fries, 350ml Drink" },
      { id: "item_deal_3", title: "Deal 3 - Rs. 810", description: "2 Zinger Burgers, 2 Drinks 350ml" },
      { id: "item_deal_4", title: "Deal 4 - Rs. 1150", description: "2 Zinger Burgers, 2 Reg Fries, 2 Drinks 350ml" },
      { id: "item_deal_5", title: "Deal 5 - Rs. 750", description: "1 Zinger, 1 Patty Burger, 1 Fries, 2 Drinks" },
      { id: "item_deal_6", title: "Deal 6 - Rs. 1700", description: "1 Large Pizza, 1 Medium Pizza, 1.5L Drink" },
      { id: "item_deal_7", title: "Deal 7 - Rs. 2650", description: "2 Large Pizzas, 1.5 Ltr Drink" },
      { id: "item_deal_8", title: "Deal 8 - Rs. 480", description: "1 Small Pizza, 1 Zinger Burger, 1 Drink 350ml" },
      { id: "item_deal_9", title: "Deal 9 - Rs. 1300", description: "1 Medium Pizza, 5 Hot Wings, 1 Drink 500ml" },
    ],
  },
  cat_special_deals_2: {
    title: "🔥 Special Deals (10-17)",
    rows: [
      { id: "item_deal_10", title: "Deal 10 - Rs. 1700", description: "1 Large Pizza, 1 Large Fries, 1.5L Drink" },
      { id: "item_deal_11", title: "Deal 11 - Rs. 1250", description: "1 Medium Pizza, 5 Hot Wings, 1 Drink 500ml" },
      { id: "item_deal_12", title: "Deal 12 - Rs. 1800", description: "1 Zinger Burger, 1 Large Fries, 1 Drink 350ml" },
      { id: "item_deal_13", title: "Deal 13 - Rs. 1950", description: "1 Large Pizza, 4 Spin Roll, 1.5L Drink" },
      { id: "item_deal_14", title: "Deal 14 - Rs. 1150", description: "2 Grill Burger, 1 Fries, 2 Drinks 350ml" },
      { id: "item_deal_15", title: "Deal 15 - Rs. 1700", description: "1 Large Pizza, 1 Large Fries, 1.5L Drink" },
      { id: "item_deal_16", title: "Deal 16 - Rs. 860", description: "1 Small Pizza, 1 Zinger Burger, 1 Drink 350ml" },
      { id: "item_deal_17", title: "Deal 17 - Rs. 1650", description: "2 Small Pizzas, 1 Zinger Wrap, 1 Drink 350ml" },
    ],
  },
  cat_broast_burgers: {
    title: "🍔 Broast & Burgers",
    rows: [
      { id: "item_br_f", title: "Broast Full - Rs. 2000", description: "Half: Rs. 1200 | Quarter: Rs. 700" },
      { id: "item_bg_z", title: "Zinger Burger - Rs. 370", description: "Crispy fried chicken fillet burger" },
      { id: "item_bg_mz", title: "Mighty Zinger - Rs. 430", description: "Double crispy zinger patty with cheese" },
      { id: "item_bg_gr", title: "Grill Burger - Rs. 450", description: "Grilled chicken patty loaded with sauces" },
      { id: "item_bg_pz", title: "Pizza Burger - Rs. 480", description: "Pizza stuffed cheese & crispy chicken" },
      { id: "item_bg_mb", title: "Malai Boti Burger 500", description: "Rs. 500 | Creamy malai boti chicken" },
      { id: "item_bg_stk", title: "Steaker Burger - Rs. 530", description: "Chef special beef or chicken steak burger" },
      { id: "item_bg_twr", title: "Tower Burger - Rs. 530", description: "Chef special tower loaded double patty" },
      { id: "item_bg_pt", title: "Patty Burger - Rs. 290", description: "Student: Rs. 250 | Chicken: Rs. 220" },
      { id: "item_wp_z", title: "Zinger Wrap - Rs. 420", description: "Tikka Wrap: Rs. 420 | Fajita Wrap: Rs. 420" },
    ],
  },
  cat_shawarma_paratha: {
    title: "🌯 Shawarma & Rolls",
    rows: [
      { id: "item_sh_ck", title: "Chicken Shawarma - 200", description: "Rs. 200 | Fresh rolled spiced chicken" },
      { id: "item_sh_zg", title: "Zinger Shawarma - 280", description: "Rs. 280 | Crispy fried zinger roll" },
      { id: "item_sh_mb", title: "Malai Shawarma - 300", description: "Rs. 300 | Arabic Shawarma: Rs. 320" },
      { id: "item_pl_sp", title: "Special Platter - 1070", description: "Rs. 1070 | 4 Spin Roll, 5 Oven Wings, Fries" },
      { id: "item_pl_ck", title: "Shawarma Platter - 420", description: "Rs. 420 | Arabic Platter: Rs. 550" },
      { id: "item_pr_kb", title: "Kabab Paratha - Rs. 320", description: "Freshly rolled spiced beef/chicken kabab" },
      { id: "item_pr_zg", title: "Zinger Paratha - 300", description: "Rs. 300 | Crispy chicken zinger in paratha" },
      { id: "item_pr_mb", title: "Malai Boti Paratha 360", description: "Rs. 360 | Creamy chicken malai boti" },
      { id: "item_pr_cp", title: "Chicken Paratha - 280", description: "Rs. 280 | Hot crispy flaky chicken paratha" },
      { id: "item_sr_mb", title: "Spin Roll 4pcs - Rs. 700", description: "Malai Boti: Rs. 700 | Special: Rs. 600" },
    ],
  },
  cat_pasta_fries: {
    title: "🍝 Pasta & Loaded Fries",
    rows: [
      { id: "item_pa_sp_s", title: "Special Pasta (S) - 430", description: "Rs. 430 | Large: Rs. 720" },
      { id: "item_pa_cr_s", title: "Crunchy Pasta (S) - 480", description: "Rs. 480 | Large: Rs. 800" },
      { id: "item_pa_cm_s", title: "Creamy Pasta (S) - 430", description: "Rs. 430 | Large: Rs. 700" },
      { id: "item_sw_sp", title: "Special Sandwich - 700", description: "Rs. 700 | Grilled / Smoked / BBQ: Rs. 650" },
      { id: "item_sw_pz", title: "Pizza Sandwich - Rs. 800", description: "Special Pizza Sandwich with Fries" },
      { id: "item_fr_sm_s", title: "Simple Fries (S) - 180", description: "Small: Rs. 180 | Large: Rs. 380" },
      { id: "item_fr_ld", title: "Loaded Fries - Rs. 620", description: "Loaded chicken, cheese & sauce fries" },
      { id: "item_fr_pz", title: "Pizza Fries - Rs. 600", description: "Topped with melted cheese & pizza toppings" },
      { id: "item_fr_my", title: "Mayo Fries - Rs. 400", description: "Crispy fries tossed in garlic mayo" },
      { id: "item_sn_hw", title: "Hot Wings 10pcs - 620", description: "Rs. 620 | Crispy or Oven Baked Wings" },
    ],
  },
  cat_pasta_sandwiches: {
    title: "🍝 Pasta & Loaded Fries",
    rows: [
      { id: "item_pa_sp_s", title: "Special Pasta (S) - 430", description: "Rs. 430 | Large: Rs. 720" },
      { id: "item_pa_cr_s", title: "Crunchy Pasta (S) - 480", description: "Rs. 480 | Large: Rs. 800" },
      { id: "item_pa_cm_s", title: "Creamy Pasta (S) - 430", description: "Rs. 430 | Large: Rs. 700" },
      { id: "item_sw_sp", title: "Special Sandwich - 700", description: "Rs. 700 | Grilled / Smoked / BBQ: Rs. 650" },
      { id: "item_sw_pz", title: "Pizza Sandwich - Rs. 800", description: "Special Pizza Sandwich with Fries" },
      { id: "item_fr_sm_s", title: "Simple Fries (S) - 180", description: "Small: Rs. 180 | Large: Rs. 380" },
      { id: "item_fr_ld", title: "Loaded Fries - Rs. 620", description: "Loaded chicken, cheese & sauce fries" },
      { id: "item_fr_pz", title: "Pizza Fries - Rs. 600", description: "Topped with melted cheese & pizza toppings" },
      { id: "item_fr_my", title: "Mayo Fries - Rs. 400", description: "Crispy fries tossed in garlic mayo" },
      { id: "item_sn_hw", title: "Hot Wings 10pcs - 620", description: "Rs. 620 | Crispy or Oven Baked Wings" },
    ],
  },
  cat_rice_deals: {
    title: "🍚 Rice & Traditional",
    rows: [
      { id: "item_tr_cb", title: "Chicken Biryani - 380", description: "Rs. 380 | Simple Biryani: Rs. 230" },
      { id: "item_tr_cp", title: "Chicken Pulao - Rs. 380", description: "Rs. 380 | Simple Pulao: Rs. 230" },
      { id: "item_tr_sb", title: "Special Biryani - 440", description: "Rs. 440 | Double chicken loaded biryani" },
      { id: "item_tr_sp", title: "Special Pulao - Rs. 440", description: "Rs. 440 | Special aroma seasoned pulao" },
      { id: "item_tr_bp", title: "Beef Pulao - Rs. 430", description: "Rs. 430 | Tender beef pulao" },
      { id: "item_rd_1", title: "Rice Deal 1 - Rs. 1050", description: "2 Biryani/Pulao, 1 Kheer, 1 Drink 500ml" },
      { id: "item_rd_2", title: "Rice Deal 2 - Rs. 990", description: "2 Biryani/Pulao, 1 Half Zarda, 1 Drink 500ml" },
      { id: "item_rd_3", title: "Rice Deal 3 - Rs. 630", description: "1 Biryani/Pulao, 1 Brownie, 1 Drink 350ml" },
      { id: "item_rd_4", title: "Rice Deal 4 - Rs. 1070", description: "1 Biryani/Pulao, 1 Russian Salad, 1 Drink" },
      { id: "item_rd_5", title: "Rice Deal 5 - Rs. 580", description: "1 Biryani/Pulao, 1 Half Zarda, 1 Drink 350ml" },
    ],
  },
  cat_family_summer: {
    title: "👨‍👩‍👧‍👦 Family & Summer",
    rows: [
      { id: "item_fam_1", title: "Family Deal 1 - 3180", description: "Rs. 3180 | 2 Large Pizza, Large Fries, Broast, 1.5L" },
      { id: "item_fam_2", title: "Family Deal 2 - 3000", description: "Rs. 3000 | 2 Large Pizza, 1.5 Ltr Drink" },
      { id: "item_fam_3", title: "Family Deal 3 - 2100", description: "Rs. 2100 | 2 Broast, 1 Fries, 1.5 Ltr Drink" },
      { id: "item_fam_4", title: "Family Deal 4 - 3350", description: "Rs. 3350 | 2 Large Pizza, Large Fries, 1.5L Drink" },
      { id: "item_sum_1", title: "Summer Deal 1 - 1100", description: "Rs. 1100 | 2 Small Pasta, 1 Brownie, 500ml Drink" },
      { id: "item_sum_2", title: "Summer Deal 2 - 1900", description: "Rs. 1900 | 4 Zinger Burgers, 2 Brownies, 1.5L Drink" },
      { id: "item_sum_3", title: "Summer Deal 3 - Rs. 770", description: "1 Small Pasta, 1 Small Fries, 500ml Drink" },
      { id: "item_sum_4", title: "Summer Deal 4 - Rs. 690", description: "2 Chicken Burgers, 1 Small Fries, 350ml Drink" },
      { id: "item_sum_6", title: "Summer Deal 6 - 1450", description: "Rs. 1450 | 2 Zinger Burgers, Large Pasta, 1.5L Drink" },
      { id: "item_sum_7", title: "Summer Deal 7 - 3050", description: "Rs. 3050 | 2 Large Pizzas, Large Pasta, 1.5L Drink" },
    ],
  },
  cat_shakes_beverages: {
    title: "🥤 Shakes & Drinks",
    rows: [
      { id: "item_bv_df_k", title: "Kaju Shake - Rs. 700", description: "Rich blended cashew dry fruit shake" },
      { id: "item_bv_df_m", title: "Mix Dry Fruit - 700", description: "Rs. 700 | Almond, Kaju, Pistachio shake" },
      { id: "item_bv_ym_o", title: "Oreo Shake - Rs. 400", description: "Nutella / KitKat / Cold Coffee: Rs. 400" },
      { id: "item_bv_ms_m", title: "Mango Shake - Rs. 280", description: "Strawberry / Chico: Rs. 280 | Banana: Rs. 200" },
      { id: "item_bv_ms_k", title: "Khoya Khajoor - 350", description: "Rs. 350 | Premium date & khoya shake" },
      { id: "item_bv_fj_m", title: "Mint Margarita - 150", description: "Rs. 150 | Fresh Peach / Apple: Rs. 250" },
      { id: "item_bv_fj_a", title: "Red Anar Juice - 500", description: "Rs. 500 | 100% Fresh pomegranate juice" },
      { id: "item_bv_ic_s", title: "Ice Cream Cup (S) - 160", description: "Small: Rs. 160 | Med: Rs. 220 | Large: Rs. 280" },
      { id: "item_ds_kh", title: "Special Kheer - Rs. 230", description: "Ras Malai: Rs. 240 | Brownie: Rs. 200" },
      { id: "item_ds_fc", title: "Special Fruit Chaat 300", description: "Rs. 300 | Cream Chaat: Rs. 300 | Custard: Rs. 250" },
    ],
  },
};

export function findItemById(itemId: string): MenuItemRow | null {
  if (!itemId) return null;
  const normalized = itemId.startsWith("item_") ? itemId.slice(5) : itemId;
  for (const cat of Object.values(MENU_DATA)) {
    const found = cat.rows.find(
      (r) =>
        r.id === itemId ||
        r.id === normalized ||
        r.id === `item_${normalized}` ||
        `item_${r.id}` === itemId
    );
    if (found) return found;
  }
  return null;
}
