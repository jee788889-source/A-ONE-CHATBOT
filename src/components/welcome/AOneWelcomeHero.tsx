"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  Flame,
  UtensilsCrossed,
  Clock,
  Phone,
  Lock,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AOneWelcomeHero({ isAuthenticated }: { isAuthenticated?: boolean }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  function handleContinue() {
    setExiting(true);
    setTimeout(() => {
      if (isAuthenticated) {
        router.push("/admin");
      } else {
        router.push("/login");
      }
    }, 450);
  }

  return (
    <div className="relative min-h-screen bg-neutral-950 text-white flex flex-col justify-between items-center p-4 md:p-8 overflow-hidden selection:bg-amber-500 selection:text-neutral-950">
      {/* 1. Ambient Dynamic Background Gradients & Particle Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-amber-500/[0.04] rounded-full blur-[140px]" />
        {/* Cinematic Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Top Bar: Live Status & Security Indicator */}
      <header className="relative z-10 w-full max-w-6xl flex items-center justify-between py-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs text-neutral-300 backdrop-blur-md">
          <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-neutral-200">A-ONE Restaurant Operations</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <ShieldCheck className="size-3.5" />
            <span className="hidden sm:inline">Private Operational System</span>
          </div>
        </div>
      </header>

      {/* Main Center Stage: Cinematic 3D Presentation */}
      <main className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center my-auto py-8">
        <AnimatePresence>
          {!exiting && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* 3D A-ONE Logo Container with Glow Effect */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.1 }}
                className="relative mb-6 group"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition duration-500" />
                <div className="relative h-28 w-60 md:h-32 md:w-72 rounded-3xl bg-neutral-900/90 border border-neutral-800 p-2 shadow-2xl shadow-black flex items-center justify-center backdrop-blur-xl">
                  <img
                    src="/assets/images/logo-3d.png"
                    alt="A-ONE Restaurant Logo"
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
              </motion.div>

              {/* Tagline Badge */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-widest mb-4 shadow-lg shadow-amber-500/5"
              >
                <Sparkles className="size-3.5 text-amber-400" />
                <span>Taste of Purity · Tradition of Quality</span>
              </motion.div>

              {/* Main Welcome Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight max-w-2xl"
              >
                Welcome to{" "}
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  A-ONE Restaurant
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-3 text-sm md:text-base text-neutral-400 max-w-xl leading-relaxed font-medium"
              >
                Official private management & live WhatsApp operations portal for authentic burgers,
                dum biryani, crispy savories, and traditional delicacies.
              </motion.p>

              {/* 3D Food Highlights Cards Grid */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mt-8 mb-8"
              >
                <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 flex flex-col items-center gap-1.5 backdrop-blur-md hover:border-amber-500/40 transition-colors shadow-lg">
                  <span className="text-2xl">🍔</span>
                  <p className="text-xs font-bold text-neutral-200">Smash Burgers</p>
                  <span className="text-[10px] text-amber-400 font-semibold">Special Recipe</span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 flex flex-col items-center gap-1.5 backdrop-blur-md hover:border-amber-500/40 transition-colors shadow-lg">
                  <span className="text-2xl">🍚</span>
                  <p className="text-xs font-bold text-neutral-200">Dum Biryani</p>
                  <span className="text-[10px] text-amber-400 font-semibold">Basmati Rice</span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 flex flex-col items-center gap-1.5 backdrop-blur-md hover:border-amber-500/40 transition-colors shadow-lg">
                  <span className="text-2xl">🥟</span>
                  <p className="text-xs font-bold text-neutral-200">Crispy Samosay</p>
                  <span className="text-[10px] text-amber-400 font-semibold">Handcrafted</span>
                </div>
                <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 flex flex-col items-center gap-1.5 backdrop-blur-md hover:border-amber-500/40 transition-colors shadow-lg">
                  <span className="text-2xl">🍕</span>
                  <p className="text-xs font-bold text-neutral-200">Cheesy Pizzas</p>
                  <span className="text-[10px] text-amber-400 font-semibold">Stone Baked</span>
                </div>
              </motion.div>

              {/* Action: Enter Portal / Get Started */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md"
              >
                <Button
                  size="lg"
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-neutral-950 font-black h-13 text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-500/20 group transition-all"
                >
                  <span>{isAuthenticated ? "Enter Operations Hub" : "Get Started · Sign In"}</span>
                  <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer: Strict Privacy Notice */}
      <footer className="relative z-10 w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 py-3 border-t border-neutral-900 text-[11px] text-neutral-500">
        <p suppressHydrationWarning>© {new Date().getFullYear()} A-ONE Restaurant. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Lock className="size-3 text-neutral-400" />
            Private Encrypted Portal
          </span>
          <span>Authorized Staff Only</span>
        </div>
      </footer>
    </div>
  );
}
