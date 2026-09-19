"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  MessagesSquare,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Settings,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Role } from "@prisma/client";

export interface OnboardingUser {
  id: string;
  name: string;
  role: Role;
}

interface TourStep {
  id: string;
  title: string;
  urduTitle: string;
  description: string;
  route: string;
  icon: any;
  targetId?: string;
  roleRequired?: "ALL" | "MANAGER_OR_OWNER" | "OWNER_ONLY";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "dashboard",
    title: "Operations Dashboard",
    urduTitle: "آپریشنز ڈیش بورڈ",
    description:
      "Yahan aap A-ONE ke overall business activity, real-time orders, active WhatsApp chats aur important sales metrics dekh sakte hain.",
    route: "/admin",
    icon: LayoutDashboard,
    roleRequired: "ALL",
  },
  {
    id: "orders",
    title: "Orders & Kitchen Management",
    urduTitle: "آرڈرز اور کچن مینیجمنٹ",
    description:
      "Yahan incoming orders, unki status (New -> Preparing -> Ready -> Out for Delivery) aur manual order creation manage hoti hai.",
    route: "/admin/orders",
    icon: ShoppingBag,
    roleRequired: "ALL",
  },
  {
    id: "menu",
    title: "Menu & Kitchen Categories",
    urduTitle: "مینو اور کیٹیگریز",
    description:
      "Yahan menu items, prices, descriptions aur item availability (In-Stock / Out-of-Stock) ko live control kiya jata hai.",
    route: "/admin/menu",
    icon: UtensilsCrossed,
    roleRequired: "ALL",
  },
  {
    id: "customers",
    title: "Customer Directory & History",
    urduTitle: "کسٹمر ڈائریکٹری",
    description:
      "Yahan customers ki previous orders, delivery addresses, total spent aur WhatsApp order history dekhi ja sakti hai.",
    route: "/admin/customers",
    icon: Users,
    roleRequired: "ALL",
  },
  {
    id: "conversations",
    title: "WhatsApp Live Inbox",
    urduTitle: "واٹس ایپ لائیو ان باکس",
    description:
      "Yahan customers ki live WhatsApp chats aati hain. Staff directly reply kar sakta hai aur AI ko instant pause (Take Over) ya resume kar sakta hai.",
    route: "/admin/conversations",
    icon: MessagesSquare,
    roleRequired: "ALL",
  },
  {
    id: "payments",
    title: "Online Payment Verification",
    urduTitle: "آن لائن پیمنٹ تصدیق",
    description:
      "Yahan online transfer (JazzCash, Easypaisa, Bank) ke reference IDs aur screenshot verification requests review hoti hain.",
    route: "/admin/orders?status=PENDING_VERIFICATION",
    icon: CreditCard,
    roleRequired: "MANAGER_OR_OWNER",
  },
  {
    id: "staff",
    title: "Staff & Role Control",
    urduTitle: "اسٹاف اور رولز",
    description:
      "Owner panel se restaurant team members add/invite kiye ja sakte hain aur granular access permissions set hoti hain.",
    route: "/admin/staff",
    icon: UserCheck,
    roleRequired: "OWNER_ONLY",
  },
  {
    id: "audit",
    title: "Security & Audit Logs",
    urduTitle: "سیکیورٹی اور آڈٹ لاگز",
    description:
      "System mein hone wali har critical action (Order confirmation, payment verification, staff logins) ka immutable audit record.",
    route: "/admin/audit",
    icon: ShieldCheck,
    roleRequired: "OWNER_ONLY",
  },
  {
    id: "settings",
    title: "Settings & AI Configuration",
    urduTitle: "سیٹنگز اور اے آئی کنٹرول",
    description:
      "Delivery charges, free delivery threshold, opening hours aur WhatsApp AI bot guardrails yahan se configure hoti hain.",
    route: "/admin/settings",
    icon: Settings,
    roleRequired: "OWNER_ONLY",
  },
];

export function AOneOnboardingTour({ user }: { user: OnboardingUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const [showWelcome, setShowWelcome] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const storageKey = `aone_onboarding_completed_${user.id}`;

  // Filter steps according to user role
  const allowedSteps = TOUR_STEPS.filter((s) => {
    if (s.roleRequired === "OWNER_ONLY" && user.role !== "OWNER") return false;
    if (s.roleRequired === "MANAGER_OR_OWNER" && user.role === "STAFF") return false;
    return true;
  });

  useEffect(() => {
    // Check if user has completed onboarding on this browser/device
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      // Small delay for smooth entry
      const t = setTimeout(() => setShowWelcome(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  function startTour() {
    setShowWelcome(false);
    setTourActive(true);
    setCurrentStepIndex(0);
    const firstStep = allowedSteps[0];
    if (firstStep && pathname !== firstStep.route) {
      router.push(firstStep.route);
    }
  }

  function skipTour() {
    localStorage.setItem(storageKey, "true");
    setShowWelcome(false);
    setTourActive(false);
  }

  function nextStep() {
    if (currentStepIndex < allowedSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const next = allowedSteps[nextIdx];
      if (next && pathname !== next.route) {
        router.push(next.route);
      }
    } else {
      finishTour();
    }
  }

  function prevStep() {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prev = allowedSteps[prevIdx];
      if (prev && pathname !== prev.route) {
        router.push(prev.route);
      }
    }
  }

  function finishTour() {
    localStorage.setItem(storageKey, "true");
    setTourActive(false);
  }

  // Listen for custom trigger to restart tour
  useEffect(() => {
    function handleRestart() {
      setShowWelcome(false);
      setTourActive(true);
      setCurrentStepIndex(0);
      router.push(allowedSteps[0].route);
    }
    window.addEventListener("aone:restart_tour", handleRestart);
    return () => window.removeEventListener("aone:restart_tour", handleRestart);
  }, [allowedSteps, router]);

  const currentStep = allowedSteps[currentStepIndex];

  return (
    <>
      {/* 1. First Login / New Device Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 md:p-8 text-neutral-100 overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative space-y-5">
              {/* Header Icon & Brand */}
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Welcome to A-ONE Restaurant
                  </h2>
                  <p className="text-xs text-neutral-400 font-medium">
                    Operations Portal · {user.role} Access
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-2">
                <p className="text-sm font-semibold text-amber-400">
                  Assalam-o-Alaikum, {user.name}!
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Aap is browser ya device par pehli dafa login huay hain. Main aapko A-ONE system ke
                  important features ka short walkthrough karwa sakta hoon taake aap smoothly kaam shuru kar sakein.
                </p>
              </div>

              {/* Role Badge Indicator */}
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span>Authorized Role:</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {user.role}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={startTour}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-neutral-950 font-bold h-11 shadow-lg shadow-amber-500/20"
                >
                  <Compass className="size-4 mr-2" />
                  Start Quick Tour
                </Button>
                <Button
                  variant="outline"
                  onClick={skipTour}
                  className="border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 font-semibold h-11"
                >
                  Skip for Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Interactive Guided Tour Overlay Card */}
      {tourActive && currentStep && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] rounded-2xl bg-neutral-900/95 border border-amber-500/40 shadow-2xl backdrop-blur-xl p-5 text-neutral-100 animate-in slide-in-from-bottom-5 duration-200">
          <div className="space-y-4">
            {/* Header: Step count & Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs flex items-center justify-center">
                  {currentStepIndex + 1}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Step {currentStepIndex + 1} of {allowedSteps.length}
                </span>
              </div>
              <button
                type="button"
                onClick={skipTour}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                title="Exit Tour"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Step Content */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <currentStep.icon className="size-4 text-amber-400 shrink-0" />
                <h3 className="text-sm font-bold text-white">{currentStep.title}</h3>
              </div>
              <p className="text-xs font-medium text-amber-400/90 font-serif">
                {currentStep.urduTitle}
              </p>
              <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                {currentStep.description}
              </p>
            </div>

            {/* Step Navigation Dots */}
            <div className="flex items-center gap-1 py-1">
              {allowedSteps.map((s, idx) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? "w-6 bg-amber-500"
                      : idx < currentStepIndex
                      ? "w-2 bg-amber-500/40"
                      : "w-1.5 bg-neutral-800"
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons: Prev, Next, Finish */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="text-xs h-8 text-neutral-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="size-3.5 mr-1" />
                Back
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipTour}
                  className="border-neutral-800 bg-neutral-950 text-neutral-400 text-xs h-8"
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs h-8 px-3"
                >
                  {currentStepIndex === allowedSteps.length - 1 ? (
                    <>
                      <CheckCircle2 className="size-3.5 mr-1" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="size-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
