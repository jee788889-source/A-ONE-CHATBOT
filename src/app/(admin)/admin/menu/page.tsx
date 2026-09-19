"use client";

import { useEffect, useState } from "react";
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  X,
  Tag,
  Loader2,
  Check,
  FolderEdit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MenuManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Category Modal & Form State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catName, setCatName] = useState("");
  const [catUrduName, setCatUrduName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  // Item Modal & Form State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemUrduName, setItemUrduName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState<number>(500);
  const [itemCatId, setItemCatId] = useState("");
  const [itemPrepTime, setItemPrepTime] = useState<number>(15);
  const [itemFeatured, setItemFeatured] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  function notifySuccess(msg: string) {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => {
      setSuccessMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  }

  function notifyError(msg: string) {
    setError(msg);
    setSuccessMsg(null);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        fetch("/api/admin/menu/categories"),
        fetch("/api/admin/menu/items"),
      ]);
      const catData = await catRes.json();
      const itemData = await itemRes.json();

      if (catData.ok) setCategories(catData.categories || []);
      if (itemData.ok) setItems(itemData.items || []);
    } catch (err: any) {
      notifyError(err.message || "Failed to load menu data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // ---------------------------------------------------------------------------
  // CATEGORY ACTIONS (CREATE / EDIT / DELETE)
  // ---------------------------------------------------------------------------
  function openAddCategory() {
    setEditingCategory(null);
    setCatName("");
    setCatUrduName("");
    setCatDesc("");
    setIsCategoryModalOpen(true);
  }

  function openEditCategory(cat: any) {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatUrduName(cat.urduName || "");
    setCatDesc(cat.description || "");
    setIsCategoryModalOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!catName.trim()) {
      notifyError("Category name is required.");
      return;
    }

    setSavingCategory(true);
    setError(null);

    try {
      const endpoint = "/api/admin/menu/categories";
      const method = editingCategory ? "PUT" : "POST";
      const body = {
        id: editingCategory?.id,
        name: catName.trim(),
        urduName: catUrduName.trim() || undefined,
        description: catDesc.trim() || undefined,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to save category");
      }

      setIsCategoryModalOpen(false);
      notifySuccess(
        editingCategory
          ? `Category "${data.category?.name || catName}" updated successfully.`
          : `Category "${data.category?.name || catName}" created successfully.`
      );
      setEditingCategory(null);
      setCatName("");
      setCatUrduName("");
      setCatDesc("");
      loadData();
    } catch (err: any) {
      notifyError(err.message || "Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(catId: string, catName: string) {
    const itemCount = items.filter((i) => i.categoryId === catId).length;
    const confirmMessage =
      itemCount > 0
        ? `⚠️ Warning: Category "${catName}" contains ${itemCount} menu item(s).\nDeleting this category will also remove these items.\n\nAre you sure you want to proceed?`
        : `Are you sure you want to delete category "${catName}"?`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch(`/api/admin/menu/categories?id=${catId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to delete category");

      if (selectedCatId === catId) {
        setSelectedCatId("ALL");
      }

      notifySuccess(`Category "${catName}" deleted.`);
      loadData();
    } catch (err: any) {
      notifyError(err.message || "Failed to delete category");
    }
  }

  // ---------------------------------------------------------------------------
  // MENU ITEM ACTIONS (CREATE / EDIT / DELETE / TOGGLE)
  // ---------------------------------------------------------------------------
  function openAddItem() {
    setEditingItem(null);
    resetItemForm();
    setIsItemModalOpen(true);
  }

  function openEditItem(item: any) {
    setEditingItem(item);
    setItemName(item.name);
    setItemUrduName(item.urduName || "");
    setItemDesc(item.description || "");
    setItemPrice(item.price);
    setItemCatId(item.categoryId);
    setItemPrepTime(item.preparationTime || 15);
    setItemFeatured(item.isFeatured || false);
    setIsItemModalOpen(true);
  }

  function resetItemForm() {
    setItemName("");
    setItemUrduName("");
    setItemDesc("");
    setItemPrice(500);
    setItemCatId(categories[0]?.id || "");
    setItemPrepTime(15);
    setItemFeatured(false);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) {
      notifyError("Dish name is required.");
      return;
    }
    const targetCatId = itemCatId || categories[0]?.id;
    if (!targetCatId) {
      notifyError("Please create a category first before adding items.");
      return;
    }

    setSavingItem(true);
    setError(null);

    try {
      const endpoint = "/api/admin/menu/items";
      const method = editingItem ? "PUT" : "POST";
      const body = {
        id: editingItem?.id,
        categoryId: targetCatId,
        name: itemName.trim(),
        urduName: itemUrduName.trim() || undefined,
        description: itemDesc.trim() || undefined,
        price: Number(itemPrice),
        preparationTime: Number(itemPrepTime),
        isFeatured: itemFeatured,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to save item");

      setIsItemModalOpen(false);
      setEditingItem(null);
      resetItemForm();
      notifySuccess(
        editingItem
          ? `Dish "${data.item?.name || itemName}" updated successfully.`
          : `Dish "${data.item?.name || itemName}" added to menu.`
      );
      loadData();
    } catch (err: any) {
      notifyError(err.message || "Failed to save item");
    } finally {
      setSavingItem(false);
    }
  }

  async function handleDeleteItem(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;

    try {
      const res = await fetch(`/api/admin/menu/items?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to delete item");

      setItems((prev) => prev.filter((it) => it.id !== id));
      notifySuccess(`Dish "${name}" deleted.`);
    } catch (err: any) {
      notifyError(err.message || "Failed to delete item");
    }
  }

  async function toggleAvailability(id: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/menu/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isAvailable: !current }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to update availability");

      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, isAvailable: !current } : it)));
    } catch (err: any) {
      notifyError(err.message || "Failed to update availability");
    }
  }

  const filteredItems = items.filter((it) => {
    if (selectedCatId !== "ALL" && it.categoryId !== selectedCatId) return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      return (
        it.name.toLowerCase().includes(term) ||
        (it.description && it.description.toLowerCase().includes(term)) ||
        (it.urduName && it.urduName.includes(term))
      );
    }
    return true;
  });

  const activeCategory = categories.find((c) => c.id === selectedCatId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <UtensilsCrossed className="size-6 text-amber-500" />
            Menu & Category Management
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Update dishes, live pricing, categories, and in-stock kitchen availability for WhatsApp ordering.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openAddCategory}
            variant="outline"
            size="sm"
            className="border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white hover:bg-neutral-800 text-xs h-9"
          >
            <Tag className="size-3.5 mr-1.5 text-amber-400" />
            Add Category
          </Button>
          <Button
            onClick={openAddItem}
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs h-9 shadow-md shadow-amber-500/20"
          >
            <Plus className="size-4 mr-1.5" />
            Add Dish / Item
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="size-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400/80 hover:text-emerald-300">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400/80 hover:text-red-300">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Category Management Bar & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-neutral-900/40 p-2.5 rounded-2xl border border-neutral-800/60">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scroll-slim">
          <button
            onClick={() => setSelectedCatId("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedCatId === "ALL"
                ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-md shadow-amber-500/10"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((cat) => (
            <div key={cat.id} className="inline-flex items-center group">
              <button
                onClick={() => setSelectedCatId(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border flex items-center gap-1.5 ${
                  selectedCatId === cat.id
                    ? "bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-md shadow-amber-500/10"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({items.filter((i) => i.categoryId === cat.id).length})
                </span>
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Active Category Edit & Delete Toolbar */}
          {activeCategory && (
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl px-1.5 py-1">
              <button
                onClick={() => openEditCategory(activeCategory)}
                title="Edit Category"
                className="p-1 text-neutral-400 hover:text-amber-400 rounded transition"
              >
                <FolderEdit className="size-3.5" />
              </button>
              <button
                onClick={() => handleDeleteCategory(activeCategory.id, activeCategory.name)}
                title="Delete Category"
                className="p-1 text-neutral-400 hover:text-red-400 rounded transition"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}

          <div className="relative w-full md:w-56">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="pl-8 bg-neutral-900 border-neutral-800 text-xs h-9 text-neutral-200 placeholder:text-neutral-600"
            />
          </div>
        </div>
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && (
          <div className="col-span-full py-16 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 animate-spin text-amber-500" />
            <span>Loading menu items...</span>
          </div>
        )}
        {!loading && filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-neutral-500 bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-8">
            <UtensilsCrossed className="size-8 mx-auto mb-2 text-neutral-600" />
            <p className="font-semibold text-neutral-400">No dishes found in this category.</p>
            <p className="text-neutral-600 mt-1">Click "Add Dish / Item" above to add dishes to your menu.</p>
          </div>
        )}
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`bg-neutral-900/80 border-neutral-800 backdrop-blur flex flex-col justify-between transition-all ${
              !item.isAvailable ? "opacity-60" : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {item.category?.name || "Dishes"}
                  </span>
                  <CardTitle className="text-base font-bold text-white mt-1.5">
                    {item.name}
                  </CardTitle>
                  {item.urduName && (
                    <p className="text-xs text-neutral-400 font-sans mt-0.5">{item.urduName}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-base font-black text-amber-400 font-mono">
                    Rs. {item.price.toLocaleString()}
                  </span>
                </div>
              </div>
              {item.description && (
                <CardDescription className="text-xs text-neutral-400 mt-2 line-clamp-2">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="pt-0 border-t border-neutral-800/80 mt-2 pt-3 flex items-center justify-between">
              {/* Availability Toggle */}
              <button
                type="button"
                onClick={() => toggleAvailability(item.id, item.isAvailable)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  item.isAvailable
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                }`}
              >
                {item.isAvailable ? (
                  <>
                    <CheckCircle className="size-3" /> In Stock
                  </>
                ) : (
                  <>
                    <XCircle className="size-3" /> Sold Out
                  </>
                )}
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditItem(item)}
                  className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  title="Edit Dish"
                >
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                  title="Delete Dish"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="size-4 text-amber-500" />
                {editingCategory ? "Edit Menu Category" : "Add Menu Category"}
              </CardTitle>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSaveCategory}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">
                    Category Name (English) <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Traditional Savories & Nimko"
                    required
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Category Name (Urdu - Optional)</label>
                  <Input
                    value={catUrduName}
                    onChange={(e) => setCatUrduName(e.target.value)}
                    placeholder="e.g. روایتی نمکو"
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Short Description</label>
                  <Input
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="e.g. Authentic snacks and crunchy savories"
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={savingCategory}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold h-10 mt-2 shadow-lg shadow-amber-500/20"
                >
                  {savingCategory ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving Category...
                    </>
                  ) : editingCategory ? (
                    "Save Changes"
                  ) : (
                    "Create Category"
                  )}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-lg bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-amber-500" />
                {editingItem ? "Edit Menu Dish" : "Add New Dish"}
              </CardTitle>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSaveItem}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">
                      Dish Name (English) <span className="text-red-400">*</span>
                    </label>
                    <Input
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. A-ONE Special Dum Biryani"
                      required
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Dish Name (Urdu - Optional)</label>
                    <Input
                      value={itemUrduName}
                      onChange={(e) => setItemUrduName(e.target.value)}
                      placeholder="e.g. اے ون اسپیشل دم بریانی"
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={itemCatId}
                      onChange={(e) => setItemCatId(e.target.value)}
                      className="w-full h-9 rounded-md bg-neutral-950 border border-neutral-800 text-xs px-2 text-neutral-200 focus:ring-1 focus:ring-amber-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">
                      Price (PKR) <span className="text-red-400">*</span>
                    </label>
                    <Input
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(Number(e.target.value))}
                      required
                      min={1}
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 focus-visible:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Prep Time (Min)</label>
                    <Input
                      type="number"
                      value={itemPrepTime}
                      onChange={(e) => setItemPrepTime(Number(e.target.value))}
                      min={1}
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 focus-visible:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Description & Ingredients</label>
                  <Input
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    placeholder="Fresh ingredients, toppings, and flavor profile..."
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={savingItem}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold h-10 mt-2 shadow-lg shadow-amber-500/20"
                >
                  {savingItem ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Saving Dish...
                    </>
                  ) : editingItem ? (
                    "Save Changes"
                  ) : (
                    "Create Menu Item"
                  )}
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
