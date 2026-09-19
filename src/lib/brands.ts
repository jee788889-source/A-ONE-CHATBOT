/**
 * A-ONE Restaurant — Brand & Operations Profile
 * Copyright (c) A-ONE Restaurant.
 */
import { AONE_COMPANY } from "@/data/aone-foods/company";

export type Department = "RESTAURANT" | "KITCHEN";
export const DEPARTMENTS: readonly Department[] = ["RESTAURANT", "KITCHEN"] as const;
export type DepartmentSlug = "restaurant" | "kitchen";

export interface BrandContact {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  hours: string;
  website: string;
  mapUrl?: string;
}

export interface BrandProfile {
  id: Department;
  slug: DepartmentSlug;
  name: string;
  shortName: string;
  emoji: string;
  tagline: string;
  description: string;
  purpose: readonly string[];
  referencePrefix: string;
  theme: {
    accentColor: string;
    gradient: string;
  };
  contact: BrandContact;
}

export const BRANDS: Record<Department, BrandProfile> = {
  RESTAURANT: {
    id: "RESTAURANT",
    slug: "restaurant",
    name: "A-ONE Restaurant",
    shortName: "A-ONE",
    emoji: "🍔",
    tagline: AONE_COMPANY.tagline,
    description: AONE_COMPANY.description,
    purpose: ["Food ordering", "Menu browsing", "Savories & Nimko delivery", "Customer inquiries"],
    referencePrefix: "AONE-",
    theme: {
      accentColor: "#F59E0B",
      gradient: "from-amber-500 to-orange-600",
    },
    contact: {
      phone: AONE_COMPANY.contact.phone,
      whatsapp: AONE_COMPANY.contact.whatsapp,
      email: AONE_COMPANY.contact.email,
      address: AONE_COMPANY.contact.headOffice,
      city: "Lahore",
      hours: AONE_COMPANY.contact.hours,
      website: "https://www.instagram.com/aone_foods/",
    },
  },
  KITCHEN: {
    id: "KITCHEN",
    slug: "kitchen",
    name: "A-ONE Kitchen & Savories",
    shortName: "Kitchen",
    emoji: "👨‍🍳",
    tagline: "Freshly prepared delicacies and authentic recipes",
    description: "Authentic traditional recipe meals, fresh burgers, biryani and savory snacks.",
    purpose: ["Order fulfillment", "Kitchen operations", "Delivery dispatch"],
    referencePrefix: "KTN-",
    theme: {
      accentColor: "#EA580C",
      gradient: "from-orange-500 to-amber-600",
    },
    contact: {
      phone: AONE_COMPANY.contact.phone,
      whatsapp: AONE_COMPANY.contact.whatsapp,
      email: AONE_COMPANY.contact.email,
      address: AONE_COMPANY.contact.headOffice,
      city: "Lahore",
      hours: AONE_COMPANY.contact.hours,
      website: "https://www.instagram.com/aone_foods/",
    },
  },
};

export function brand(department: Department = "RESTAURANT"): BrandProfile {
  return BRANDS[department] ?? BRANDS.RESTAURANT;
}

export function asDepartment(raw?: string | null): Department {
  return "RESTAURANT";
}
