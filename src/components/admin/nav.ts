import {
  LayoutDashboard,
  MessagesSquare,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  ShieldCheck,
  Settings,
  ScrollText,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@prisma/client";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
  managerOrOwner?: boolean;
  permission?: string;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        label: "WhatsApp Inbox",
        href: "/admin/conversations",
        icon: MessagesSquare,
        permission: "view_conversations",
      },
      {
        label: "Orders Management",
        href: "/admin/orders",
        icon: ShoppingBag,
        permission: "view_orders",
      },
      {
        label: "Customers",
        href: "/admin/customers",
        icon: Users,
        permission: "view_customers",
      },
    ],
  },
  {
    label: "Menu & Kitchen",
    items: [
      {
        label: "Menu & Categories",
        href: "/admin/menu",
        icon: UtensilsCrossed,
        permission: "manage_menu",
      },
    ],
  },
  {
    label: "Owner Control",
    items: [
      {
        label: "Staff & Roles",
        href: "/admin/staff",
        icon: UserCheck,
        ownerOnly: true,
      },
      {
        label: "Audit Logs",
        href: "/admin/audit",
        icon: ScrollText,
        ownerOnly: true,
      },
      {
        label: "Settings & AI",
        href: "/admin/settings",
        icon: Settings,
        ownerOnly: true,
      },
    ],
  },
];
