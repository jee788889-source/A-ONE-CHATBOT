/**
 * A-ONE Restaurant & Foods Data Registry
 * Copyright (c) A-ONE Restaurant.
 */
import { AONE_COMPANY } from "./aone-foods/company";
import { AONE_PRODUCTS, searchProducts, type Product } from "./aone-foods/products";

export { AONE_COMPANY, AONE_PRODUCTS, searchProducts };
export type { Product };

export interface DepartmentContent {
  categories: string[];
  quickReplies: string[];
  catalogue: string[];
}

export function departmentContent(): DepartmentContent {
  return {
    categories: ["Fast Food & Burgers", "Rice & Biryani", "BBQ & Grills", "Pizza", "Savories & Nimko", "Beverages"],
    quickReplies: ["📋 View Menu", "🍔 Beef Smash Burger", "🍛 Chicken Biryani", "📍 Location & Hours"],
    catalogue: AONE_PRODUCTS.map((p) => p.name),
  };
}
