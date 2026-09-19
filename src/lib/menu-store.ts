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

// Initial seed store for high reliability & zero-crash guarantees
const memoryCategories: CategoryData[] = [
  {
    id: "cat-burgers",
    name: "Burgers & Sandwiches",
    urduName: "برگر اور سینڈوچ",
    description: "Handcrafted gourmet burgers and loaded sandwiches",
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { items: 2 },
  },
  {
    id: "cat-rice",
    name: "Rice & Biryani",
    urduName: "بریانی اور چاول",
    description: "Fragrant saffron basmati rice and signature dum biryani",
    displayOrder: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { items: 1 },
  },
  {
    id: "cat-savories",
    name: "Traditional Savories & Nimko",
    urduName: "روایتی نمکو اور اسنیکس",
    description: "Crispy savory blends, fresh samosas, and loaded masala fries",
    displayOrder: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { items: 3 },
  },
  {
    id: "cat-beverages",
    name: "Beverages & Drinks",
    urduName: "مشروبات اور کولڈ ڈرنکس",
    description: "Chilled soft drinks and refreshing beverages",
    displayOrder: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { items: 1 },
  },
];

const memoryItems: MenuItemData[] = [
  {
    id: "item-beef-burger",
    categoryId: "cat-burgers",
    name: "A-ONE Special Beef Smash Burger",
    urduName: "اے ون اسپیشل بیف برگر",
    description: "Double beef patty, melted cheddar, caramelized onions, secret sauce",
    price: 850,
    imageUrl: null,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 1,
    preparationTime: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-burgers", name: "Burgers & Sandwiches" },
  },
  {
    id: "item-zinger",
    categoryId: "cat-burgers",
    name: "Crispy Zinger Crunch Burger",
    urduName: "کرسپی زنگر برگر",
    description: "Golden fried crispy chicken breast fillet, spicy mayo, lettuce",
    price: 650,
    imageUrl: null,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 2,
    preparationTime: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-burgers", name: "Burgers & Sandwiches" },
  },
  {
    id: "item-biryani",
    categoryId: "cat-rice",
    name: "A-ONE Special Chicken Dum Biryani",
    urduName: "اے ون اسپیشل چکن دم بریانی",
    description: "Fragrant basmati rice layered with spiced chicken & saffron aroma",
    price: 520,
    imageUrl: null,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 1,
    preparationTime: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-rice", name: "Rice & Biryani" },
  },
  {
    id: "item-samosa",
    categoryId: "cat-savories",
    name: "Crispy A-ONE Potato & Beef Samosa",
    urduName: "اے ون کرسپی سموسہ",
    description: "Handcrafted crispy pastry filled with aromatic spiced potatoes or beef",
    price: 80,
    imageUrl: null,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 1,
    preparationTime: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-savories", name: "Traditional Savories & Nimko" },
  },
  {
    id: "item-nimko",
    categoryId: "cat-savories",
    name: "A-ONE Special Mix Nimko (400g)",
    urduName: "اے ون اسپیشل مکس نمکو",
    description: "Crispy savory blend of spiced grams, sev, and roasted nuts",
    price: 380,
    imageUrl: null,
    isAvailable: true,
    isFeatured: true,
    displayOrder: 2,
    preparationTime: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-savories", name: "Traditional Savories & Nimko" },
  },
  {
    id: "item-fries",
    categoryId: "cat-savories",
    name: "Loaded Masala French Fries",
    urduName: "مصالحہ فرائز",
    description: "Crispy golden potato fries seasoned with chef's signature chaat masala",
    price: 250,
    imageUrl: null,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 3,
    preparationTime: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-savories", name: "Traditional Savories & Nimko" },
  },
  {
    id: "item-coke",
    categoryId: "cat-beverages",
    name: "Chilled Coke (500ml)",
    urduName: "کوک",
    description: "Ice cold refreshing Coca-Cola pet bottle",
    price: 120,
    imageUrl: null,
    isAvailable: true,
    isFeatured: false,
    displayOrder: 1,
    preparationTime: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: "cat-beverages", name: "Beverages & Drinks" },
  },
];

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

    // Also sync memory
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

    // Sync memory
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

    // Also update category name on related memory items
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

    // Remove or unassign memory items
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

    // Remove related memory items
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
