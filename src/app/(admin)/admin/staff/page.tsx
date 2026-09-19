"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  Plus,
  Shield,
  Trash2,
  Lock,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [passwordModalStaff, setPasswordModalStaff] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"MANAGER" | "STAFF">("STAFF");
  const [newPassword, setNewPassword] = useState("");

  async function loadStaff() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load staff list");
      }
      setStaff(data.staff || []);
      setOwnerEmail(data.ownerEmail || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, role }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to add staff");

      setIsAddModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      loadStaff();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleToggleStatus(user: any) {
    const isOwnerUser = user.email.toLowerCase() === ownerEmail.toLowerCase() || user.role === "OWNER";
    if (isOwnerUser) {
      alert("The Owner account cannot be disabled.");
      return;
    }

    const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to update status");
      setStaff((prev) => prev.map((s) => (s.id === user.id ? { ...s, status: newStatus } : s)));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleDeleteStaff(user: any) {
    const isOwnerUser = user.email.toLowerCase() === ownerEmail.toLowerCase() || user.role === "OWNER";
    if (isOwnerUser) {
      alert("The Owner account cannot be deleted.");
      return;
    }

    if (!confirm(`Are you sure you want to remove staff member "${user.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/staff?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to delete staff");
      setStaff((prev) => prev.filter((s) => s.id !== user.id));
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordModalStaff || !newPassword) return;

    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: passwordModalStaff.id, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to reset password");

      setPasswordModalStaff(null);
      setNewPassword("");
      alert("Password updated successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <UserCheck className="size-6 text-amber-500" />
              Staff & Role Management
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Owner Only
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Authorize restaurant staff accounts, assign manager permissions, and monitor access.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs h-9 shadow-md shadow-amber-500/20"
        >
          <Plus className="size-4 mr-1.5" />
          Add / Authorize Staff
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Staff Table */}
      <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Staff Member</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Last Active</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                      Loading staff members...
                    </td>
                  </tr>
                )}
                {staff.map((u) => {
                  const isOwnerUser =
                    u.email.toLowerCase() === ownerEmail.toLowerCase() || u.role === "OWNER";

                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-100 flex items-center gap-1.5">
                              {u.name}
                              {isOwnerUser && (
                                <Shield className="size-3 text-amber-400 shrink-0" />
                              )}
                            </p>
                            <p className="text-[11px] text-neutral-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "OWNER"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : u.role === "MANAGER"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.status === "ACTIVE"
                              ? "text-emerald-400 bg-emerald-500/10"
                              : "text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          {u.status === "ACTIVE" ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-neutral-400 font-mono text-[11px]">
                        {u.phone || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-500 text-[11px]">
                        {u.lastActiveAt
                          ? new Date(u.lastActiveAt).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        {!isOwnerUser ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleStatus(u)}
                              className="h-7 text-[11px] text-neutral-400 hover:text-white"
                            >
                              {u.status === "ACTIVE" ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPasswordModalStaff(u)}
                              className="h-7 text-[11px] text-neutral-400 hover:text-white"
                            >
                              <Lock className="size-3 mr-1" />
                              Reset Pass
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteStaff(u)}
                              className="h-7 text-[11px] text-neutral-400 hover:text-red-400"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-[10px] text-amber-500/80 font-semibold italic pr-2">
                            Protected Owner
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="size-4 text-amber-500" />
                Authorize New Staff Account
              </CardTitle>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleCreateStaff}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Staff Full Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Asad Khan"
                    required
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Email Address (Login)</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. asad@aonefoods.com"
                    required
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6+ characters"
                    required
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full h-9 rounded-md bg-neutral-950 border border-neutral-800 text-xs px-2 text-neutral-200 font-semibold"
                    >
                      <option value="STAFF">STAFF (Orders & Chat)</option>
                      <option value="MANAGER">MANAGER (Orders, Chat & Menu)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-neutral-300">Phone Number</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300..."
                      className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold h-10 mt-2"
                >
                  Create & Grant Staff Access
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {passwordModalStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-800 pb-3">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="size-4 text-amber-500" />
                Reset Password
              </CardTitle>
              <button
                onClick={() => setPasswordModalStaff(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <p className="text-neutral-400">
                  Set a new password for <strong className="text-white">{passwordModalStaff.name}</strong>.
                </p>
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">New Password</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6+ characters"
                    required
                    className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold h-10"
                >
                  Update Password
                </Button>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
