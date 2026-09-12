/**
 * Product-level branding for A-ONE Foods AI Assistant.
 */
import { AONE_COMPANY } from "@/data/aone-foods/company";

export const BRANDING = {
  product: {
    name: "A-ONE AI Assistant",
    shortName: "A-ONE AI",
    company: "A-ONE Foods",
    tagline: AONE_COMPANY.tagline,
    urduTagline: AONE_COMPANY.urduTagline,
    poweredBy: "Intelligent Customer Representative",
    description: AONE_COMPANY.description,
  },
  company: {
    name: "A-ONE Foods",
    url: "https://aonefoods.pk",
    instagram: AONE_COMPANY.social.instagram,
    instagramHandle: AONE_COMPANY.social.instagramHandle,
    whatsapp: AONE_COMPANY.contact.whatsapp,
    whatsappUrl: AONE_COMPANY.contact.whatsappUrl,
    phone: AONE_COMPANY.contact.phone,
    mobile: AONE_COMPANY.contact.mobile,
    email: AONE_COMPANY.contact.email,
    headOffice: AONE_COMPANY.contact.headOffice,
    hours: AONE_COMPANY.contact.hours,
    attribution: "Official Digital Assistant of A-ONE Foods",
  },
} as const;

export const brandName = BRANDING.company.name;
export const brandUrl = BRANDING.company.url;
export const brandTagline = BRANDING.product.tagline;
