"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Phone,
  ShoppingBag,
  MapPin,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Edit2,
  Archive,
  ArchiveRestore,
  X,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Edit Customer Modal state
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/admin/customers?";
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load customers");
      setCustomers(data.customers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function handleOpenEdit(customer: any) {
    setEditingCustomer(customer);
    setEditName(customer.name || "");
    setEditPhone(customer.phone || "");
    setEditAddress(customer.address || "");
    setEditNotes(customer.notes || "");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer || savingEdit) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          address: editAddress,
          notes: editNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to update customer");

      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...json.customer } : c))
      );
      setEditingCustomer(null);
    } catch (err: any) {
      alert("Error updating customer: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleArchive(customer: any) {
    const isCurrentlyArchived = customer.notes?.includes("[ARCHIVED]");
    const confirmMsg = isCurrentlyArchived
      ? `Restore customer ${customer.name || customer.phone} to active list?`
      : `Archive customer ${customer.name || customer.phone}? (Their past orders will remain in reports)`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isArchived: !isCurrentlyArchived,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to archive customer");

      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, ...json.customer } : c))
      );
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Users className="size-6 text-amber-500" />
            Customer Directory & Profiles
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Registered phone contacts, ordering metrics, profile editing, and customer archives.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadCustomers}
          className="border-neutral-800 bg-neutral-900 text-neutral-300 text-xs h-9"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-between items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadCustomers();
          }}
          className="flex items-center gap-2 w-full sm:w-80"
        >
          <div className="relative w-full">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, address..."
              className="pl-9 bg-neutral-900 border-neutral-800 text-xs h-9 text-neutral-200 placeholder:text-neutral-600"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="border-neutral-800 bg-neutral-900 text-xs">
            Search
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Customers Table */}
      <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Customer Name & Phone</th>
                  <th className="px-4 py-3.5">Delivery Address</th>
                  <th className="px-4 py-3.5">Orders Count</th>
                  <th className="px-4 py-3.5">Total Spent</th>
                  <th className="px-4 py-3.5">Notes</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                      Loading customers...
                    </td>
                  </tr>
                )}
                {!loading && customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                      No customers found.
                    </td>
                  </tr>
                )}
                {customers.map((c, cIdx) => {
                  const isArchived = c.notes?.includes("[ARCHIVED]");

                  return (
                    <tr
                      key={c.id ? `${c.id}-${cIdx}` : `cust-${cIdx}`}
                      className={`hover:bg-neutral-800/30 transition-colors ${
                        isArchived ? "opacity-60 bg-neutral-950/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                            {c.name ? c.name.charAt(0).toUpperCase() : <Users className="size-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-neutral-100">{c.name || "WhatsApp Customer"}</p>
                              {isArchived && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                                  ARCHIVED
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                              <Phone className="size-3 text-amber-500" />
                              {c.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-neutral-300 max-w-xs truncate">
                        {c.address ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-neutral-500 shrink-0" />
                            {c.address}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 text-xs font-bold">
                          {c.totalOrders || c._count?.orders || 0} orders
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-amber-400 font-mono text-sm">
                        Rs. {(c.totalSpent || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-400 text-[11px] max-w-xs truncate">
                        {c.notes?.replace("[ARCHIVED]", "").trim() || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(c)}
                          className="h-7 text-[11px] text-neutral-300 hover:text-white px-2"
                        >
                          <Edit2 className="size-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleArchive(c)}
                          className="h-7 text-[11px] text-neutral-400 hover:text-amber-400 px-2"
                        >
                          {isArchived ? (
                            <>
                              <ArchiveRestore className="size-3 mr-1" />
                              Restore
                            </>
                          ) : (
                            <>
                              <Archive className="size-3 mr-1" />
                              Archive
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            window.open(`https://wa.me/${c.phone.replace(/\+/g, "")}`, "_blank");
                          }}
                          className="h-7 text-[11px] text-emerald-400 hover:bg-emerald-500/10 px-2"
                        >
                          <Phone className="size-3 mr-1" />
                          Chat
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Edit2 className="size-4 text-amber-500" />
                  Edit Customer Profile
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  Update customer contact details, delivery address, or internal staff notes.
                </CardDescription>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleSaveEdit}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Customer Name</label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Usman Ali"
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Phone Number (WhatsApp)</label>
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Delivery Address</label>
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="House, Street, Area..."
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Staff Notes / VIP Details</label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="e.g. Regular customer, prefers spicy biryani"
                    className="w-full rounded-md bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-neutral-200"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingCustomer(null)}
                    className="border-neutral-800 bg-neutral-950 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={savingEdit}
                    className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs"
                  >
                    <Save className="size-3.5 mr-1" />
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
