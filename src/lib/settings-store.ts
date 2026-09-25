import { prisma } from "@/lib/db";
import {
  DEFAULT_BUSINESS_HOURS,
  evaluateBusinessHours,
  type TemporaryClosure,
  type BusinessHoursStatus,
} from "@/lib/business-hours";

export interface RestaurantSettingsData {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  deliveryFee: number;
  minOrderAmount: number;
  isAcceptingOrders: boolean;
  openingHours: Record<string, any>;
  deliverySettings: {
    standardDeliveryFee: number;
    freeDeliveryThreshold: number;
    estimatedMinutes: number;
    allowedAreas: string[];
    [key: string]: any;
  };
  paymentAccounts: {
    jazzcash: { accountTitle: string; accountNumber: string };
    easypaisa: { accountTitle: string; accountNumber: string };
    bank: { bankName: string; accountTitle: string; iban: string };
    [key: string]: any;
  };
  whatsappConfig: {
    welcomeMessage: string;
    autoReplyEnabled: boolean;
    fallbackMessage: string;
    [key: string]: any;
  };
  aiSettings: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    strictGuardrails: boolean;
    [key: string]: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_SETTINGS: RestaurantSettingsData = {
  id: "default",
  name: "A-ONE Restaurant",
  tagline: "Authentic Taste, Premium Quality & Traditional Savories",
  phone: "+92 300 1234567",
  email: "contact@aonefoods.com",
  address: "A-ONE Restaurant, Main Boulevard, Pakistan",
  currency: "PKR",
  currencySymbol: "Rs.",
  deliveryFee: 150,
  minOrderAmount: 500,
  isAcceptingOrders: true,
  openingHours: {
    ...DEFAULT_BUSINESS_HOURS,
    temporaryClosure: {
      isClosed: false,
      reason: "Kitchen Maintenance",
    },
  },
  deliverySettings: {
    standardDeliveryFee: 150,
    freeDeliveryThreshold: 2000,
    estimatedMinutes: 35,
    allowedAreas: ["City Center", "Commercial Area", "Model Town", "Gulberg", "DHA"],
  },
  paymentAccounts: {
    jazzcash: { accountTitle: "A-ONE Restaurant", accountNumber: "0300-1234567" },
    easypaisa: { accountTitle: "A-ONE Restaurant", accountNumber: "0321-9876543" },
    bank: { bankName: "Meezan Bank", accountTitle: "A-ONE Foods PVT LTD", iban: "PK00MEZN0000123456789012" },
  },
  whatsappConfig: {
    phoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    verifyToken: "",
    welcomeMessage:
      "Assalam-o-Alaikum! A-One Foods mein khushamdeed. Main A-One se baat kar raha hoon. Aapke liye kya order le kar aayen?",
    autoReplyEnabled: true,
    fallbackMessage:
      "Aapki request staff ko forward kar di gayi hai. Hamara representative jald hi aapse direct rabta karega.",
  },
  aiSettings: {
    provider: "gemini",
    model: "gemini-1.5-pro",
    temperature: 0.2,
    maxTokens: 600,
    strictGuardrails: true,
    geminiApiKey: "",
    openaiApiKey: "",
    anthropicApiKey: "",
  },
};

// Global in-memory cache to ensure instant recovery and no 500 errors
let cachedSettings: RestaurantSettingsData = { ...DEFAULT_SETTINGS };

/**
 * Fetch restaurant settings with automatic DB-sync and fallback
 */
export async function getRestaurantSettings(): Promise<{
  settings: RestaurantSettingsData;
  liveStatus: BusinessHoursStatus;
}> {
  try {
    let settings = await prisma.restaurantSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      try {
        settings = await prisma.restaurantSettings.create({
          data: {
            id: "default",
            name: cachedSettings.name,
            tagline: cachedSettings.tagline,
            phone: cachedSettings.phone,
            email: cachedSettings.email,
            address: cachedSettings.address,
            currency: cachedSettings.currency,
            currencySymbol: cachedSettings.currencySymbol,
            deliveryFee: cachedSettings.deliveryFee,
            minOrderAmount: cachedSettings.minOrderAmount,
            isAcceptingOrders: cachedSettings.isAcceptingOrders,
            openingHours: cachedSettings.openingHours,
            deliverySettings: cachedSettings.deliverySettings,
            paymentAccounts: cachedSettings.paymentAccounts,
            whatsappConfig: cachedSettings.whatsappConfig,
            aiSettings: cachedSettings.aiSettings,
          },
        });
      } catch (createErr) {
        console.warn("[settings-store] Note: default record create skipped:", (createErr as any)?.message);
      }
    }

    if (settings) {
      const merged: RestaurantSettingsData = {
        ...DEFAULT_SETTINGS,
        ...settings,
        openingHours: (settings.openingHours as any) || DEFAULT_SETTINGS.openingHours,
        deliverySettings: (settings.deliverySettings as any) || DEFAULT_SETTINGS.deliverySettings,
        paymentAccounts: (settings.paymentAccounts as any) || DEFAULT_SETTINGS.paymentAccounts,
        whatsappConfig: (settings.whatsappConfig as any) || DEFAULT_SETTINGS.whatsappConfig,
        aiSettings: (settings.aiSettings as any) || DEFAULT_SETTINGS.aiSettings,
      };
      cachedSettings = merged;
    }
  } catch (err: any) {
    console.warn("[settings-store:getRestaurantSettings] DB read notice:", err?.message || err);
  }

  const openingHoursObj = cachedSettings.openingHours || DEFAULT_BUSINESS_HOURS;
  const tempClosure: TemporaryClosure = openingHoursObj.temporaryClosure || {
    isClosed: !cachedSettings.isAcceptingOrders,
    reason: "Maintenance",
  };

  const liveStatus = evaluateBusinessHours(openingHoursObj, tempClosure);

  return {
    settings: cachedSettings,
    liveStatus,
  };
}

/**
 * Update restaurant settings with automatic persistence
 */
export async function updateRestaurantSettings(data: Partial<RestaurantSettingsData> & { temporaryClosure?: TemporaryClosure }): Promise<{
  settings: RestaurantSettingsData;
  liveStatus: BusinessHoursStatus;
}> {
  const currentOpeningHours = cachedSettings.openingHours || DEFAULT_BUSINESS_HOURS;

  const mergedOpeningHours = {
    ...(data.openingHours || currentOpeningHours),
    ...(data.temporaryClosure ? { temporaryClosure: data.temporaryClosure } : {}),
  };

  const updatePayload: any = {
    ...data,
    openingHours: mergedOpeningHours,
  };

  if (data.temporaryClosure !== undefined) {
    updatePayload.isAcceptingOrders = !data.temporaryClosure.isClosed;
  }
  delete updatePayload.temporaryClosure;

  // Update memory cache immediately
  cachedSettings = {
    ...cachedSettings,
    ...updatePayload,
    updatedAt: new Date(),
  };

  try {
    const updated = await prisma.restaurantSettings.upsert({
      where: { id: "default" },
      update: updatePayload,
      create: {
        ...cachedSettings,
        ...updatePayload,
        id: "default",
      },
    });

    if (updated) {
      cachedSettings = {
        ...DEFAULT_SETTINGS,
        ...updated,
        openingHours: (updated.openingHours as any) || DEFAULT_SETTINGS.openingHours,
        deliverySettings: (updated.deliverySettings as any) || DEFAULT_SETTINGS.deliverySettings,
        paymentAccounts: (updated.paymentAccounts as any) || DEFAULT_SETTINGS.paymentAccounts,
        whatsappConfig: (updated.whatsappConfig as any) || DEFAULT_SETTINGS.whatsappConfig,
        aiSettings: (updated.aiSettings as any) || DEFAULT_SETTINGS.aiSettings,
      };
    }
  } catch (err: any) {
    console.warn("[settings-store:updateRestaurantSettings] DB upsert notice:", err?.message || err);
  }

  const liveStatus = evaluateBusinessHours(
    cachedSettings.openingHours,
    cachedSettings.openingHours?.temporaryClosure
  );

  return {
    settings: cachedSettings,
    liveStatus,
  };
}
