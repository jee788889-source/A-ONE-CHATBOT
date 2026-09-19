"use client";

import { useEffect, useState } from "react";
import {
  ScrollText,
  Search,
  RefreshCw,
  Shield,
  Clock,
  User,
  AlertCircle,
  FileCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/admin/audit?";
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (actionFilter) url += `action=${encodeURIComponent(actionFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load audit logs");
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (action.includes("UPDATE")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    if (action.includes("DELETE") || action.includes("CANCEL"))
      return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    if (action.includes("LOGIN")) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    return "bg-neutral-800 text-neutral-400 border-neutral-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <ScrollText className="size-6 text-amber-500" />
              Security Audit Logs
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Owner Only
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Immutable audit trail of staff actions, logins, menu updates, and system configuration.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          className="border-neutral-800 bg-neutral-900 text-neutral-300 text-xs h-9"
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Trail
        </Button>
      </div>

      {/* Search & Action Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadLogs();
          }}
          className="flex items-center gap-2 w-full md:w-80"
        >
          <div className="relative w-full">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor email, action..."
              className="pl-9 bg-neutral-900 border-neutral-800 text-xs h-9 text-neutral-200 placeholder:text-neutral-600"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="border-neutral-800 bg-neutral-900 text-xs">
            Filter
          </Button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="size-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <Card className="bg-neutral-900/60 border-neutral-800 backdrop-blur">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Actor (Staff)</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Metadata / Details</th>
                  <th className="px-4 py-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-neutral-500 font-sans">
                      Loading audit logs...
                    </td>
                  </tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-neutral-500 font-sans">
                      No audit events recorded.
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="px-4 py-3.5 text-neutral-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-sans font-semibold text-neutral-200">
                      {log.actor?.name || log.actorEmail}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-300 font-sans">
                      {log.target || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-400 max-w-xs truncate text-[11px]">
                      {log.details ? JSON.stringify(log.details) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-500 text-[11px]">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
