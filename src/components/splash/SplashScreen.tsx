"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UtensilsCrossed, Sparkles } from "lucide-react";
import { BRANDING, brandName } from "@/lib/branding";

/**
 * Branded splash overlay for A-ONE Restaurant.
 */
export function SplashScreen({ duration = 1200 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neutral-950 text-white"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 14 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative">
              <div className="relative grid h-24 w-52 place-items-center rounded-2xl bg-neutral-900 border border-neutral-800/90 p-2 shadow-2xl shadow-amber-500/10 overflow-hidden">
                <img
                  src="/assets/images/logo-3d.png"
                  alt="A-ONE Restaurant"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight text-white">
                A-ONE RESTAURANT
              </h1>
              <p className="mt-1 text-sm text-neutral-400">
                Taste of Purity, Tradition of Quality
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute bottom-10 flex flex-col items-center gap-1 text-xs text-neutral-500"
          >
            <span>Official Operations Portal</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
