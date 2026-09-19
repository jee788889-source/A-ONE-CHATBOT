"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ADMIN_NAV, type NavGroup, type NavItem } from "./nav";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

import { AOneOnboardingTour } from "./AOneOnboardingTour";
import { AOneAssistantWidget } from "./AOneAssistantWidget";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
}

export function AdminShell({
  user,
  permissions,
  children,
}: {
  user: AdminUser;
  permissions?: string[] | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isOwner = user.role === "OWNER";
  const isManager = user.role === "MANAGER";

  // Filter visible nav items based on role & permissions
  const visibleNavGroups: NavGroup[] = ADMIN_NAV.map((group) => {
    const filteredItems = group.items.filter((item) => {
      if (item.ownerOnly && !isOwner) return false;
      if (item.managerOrOwner && !(isOwner || isManager)) return false;
      if (item.permission && !isOwner) {
        if (!permissions || (!permissions.includes("all") && !permissions.includes(item.permission))) {
          return false;
        }
      }
      return true;
    });
    return { ...group, items: filteredItems };
  }).filter((group) => group.items.length > 0);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-neutral-950 border-r border-neutral-800 text-neutral-200">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-800/80 bg-neutral-900/50">
        <div className="h-10 w-16 rounded-xl bg-neutral-900 border border-neutral-800/90 p-0.5 shadow-md shadow-amber-500/10 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src="/assets/images/logo-3d.png"
            alt="A-ONE Restaurant"
            className="w-full h-full object-contain rounded-lg"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black tracking-tight text-white truncate">
            A-ONE RESTAURANT
          </h2>
          <p className="text-[11px] font-medium text-amber-500/90 truncate flex items-center gap-1">
            <Sparkles className="size-3" />
            Operations Portal
          </p>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {visibleNavGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold shadow-sm"
                          : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "size-4 shrink-0 transition-colors",
                            isActive ? "text-amber-400" : "text-neutral-500"
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.ownerOnly && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Owner
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Session Profile & Signout */}
      <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/40">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded inline-block",
                    user.role === "OWNER"
                      ? "bg-amber-500/20 text-amber-400"
                      : user.role === "MANAGER"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-emerald-500/20 text-emerald-400"
                  )}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-30 shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-neutral-950/90 backdrop-blur border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-14 rounded-lg bg-neutral-900 border border-neutral-800/90 p-0.5 flex items-center justify-center overflow-hidden">
            <img
              src="/assets/images/logo-3d.png"
              alt="A-ONE Restaurant"
              className="w-full h-full object-contain rounded-md"
            />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">A-ONE RESTAURANT</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
          <div className="w-72 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen overflow-x-hidden">
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>

      {/* Onboarding Tour for First-Login / New Browser */}
      <AOneOnboardingTour user={user} />

      {/* Persistent Smart In-App Assistant Widget */}
      <AOneAssistantWidget userRole={user.role} />
    </div>
  );
}
