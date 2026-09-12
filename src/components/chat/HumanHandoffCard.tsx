"use client";

import React from "react";
import { MessageSquare, Phone, Mail, MapPin, Instagram, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AONE_COMPANY } from "@/data/aone-foods/company";
import { cn } from "@/lib/utils";

interface HumanHandoffCardProps {
  className?: string;
}

export function HumanHandoffCard({ className }: HumanHandoffCardProps) {
  return (
    <div className={cn("rounded-2xl border border-stone-200 dark:border-stone-800 bg-card p-4 sm:p-5 shadow-sm space-y-4", className)}>
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <MessageSquare className="size-4.5" />
        </span>
        <div>
          <h4 className="font-bold text-sm text-foreground">Connect with A-ONE Foods Representative</h4>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Sure! I can connect you with our human customer desk and distribution managers.
          </p>
        </div>
      </div>

      {/* WhatsApp CTA Button */}
      <a
        href={AONE_COMPANY.contact.whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 text-xs font-semibold shadow-sm transition-colors"
      >
        <MessageSquare className="size-4" />
        Chat with Human Agent on WhatsApp ({AONE_COMPANY.contact.whatsappDisplay})
        <ExternalLink className="size-3 opacity-80" />
      </a>

      {/* Contact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <a
          href={`tel:${AONE_COMPANY.contact.phone}`}
          className="flex items-center gap-2.5 rounded-xl border border-stone-200/70 dark:border-stone-800/70 p-2.5 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
        >
          <Phone className="size-3.5 text-primary" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Head Office Phone</div>
            <div className="font-medium text-foreground">{AONE_COMPANY.contact.phone}</div>
          </div>
        </a>

        <a
          href={`tel:${AONE_COMPANY.contact.mobile}`}
          className="flex items-center gap-2.5 rounded-xl border border-stone-200/70 dark:border-stone-800/70 p-2.5 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
        >
          <Phone className="size-3.5 text-amber-500" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Direct Mobile / WhatsApp</div>
            <div className="font-medium text-foreground">{AONE_COMPANY.contact.mobile}</div>
          </div>
        </a>

        <a
          href={AONE_COMPANY.social.instagram}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-xl border border-stone-200/70 dark:border-stone-800/70 p-2.5 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
        >
          <Instagram className="size-3.5 text-pink-600" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Official Instagram</div>
            <div className="font-medium text-foreground">{AONE_COMPANY.social.instagramHandle}</div>
          </div>
        </a>

        <a
          href={`mailto:${AONE_COMPANY.contact.email}`}
          className="flex items-center gap-2.5 rounded-xl border border-stone-200/70 dark:border-stone-800/70 p-2.5 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
        >
          <Mail className="size-3.5 text-blue-500" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Email Desk</div>
            <div className="font-medium text-foreground">{AONE_COMPANY.contact.email}</div>
          </div>
        </a>
      </div>

      {/* Office & Timing */}
      <div className="rounded-xl bg-stone-50 dark:bg-stone-900/40 p-3 border border-stone-200/50 dark:border-stone-800/50 text-xs space-y-1.5 text-muted-foreground">
        <div className="flex items-start gap-2">
          <MapPin className="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
          <span>{AONE_COMPANY.contact.headOffice}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Clock className="size-3 text-muted-foreground shrink-0" />
          <span>Hours: {AONE_COMPANY.contact.hours}</span>
        </div>
      </div>
    </div>
  );
}
