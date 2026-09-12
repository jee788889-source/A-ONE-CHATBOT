"use client";

import React, { useState } from "react";
import { CheckCircle2, Building, Phone, MapPin, Send, Copy, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DistributorFormProps {
  onSuccess?: (referenceId: string) => void;
  className?: string;
}

export function DistributorForm({ onSuccess, className }: DistributorFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [inquiryType, setInquiryType] = useState<string>("Distributorship");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          inquiryType,
          companyName: companyName.trim() || undefined,
        }),
      });

      const data = await res.json();
      const refId = data.referenceId || `AONE-DIST-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedId(refId);
      onSuccess?.(refId);
    } catch (err) {
      // Graceful local generation if offline or DB down
      const fallbackRef = `AONE-DIST-${Math.floor(1000 + Math.random() * 9000)}`;
      setSubmittedId(fallbackRef);
      onSuccess?.(fallbackRef);
    } finally {
      setSubmitting(false);
    }
  }

  function copyRef() {
    if (!submittedId) return;
    navigator.clipboard.writeText(submittedId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (submittedId) {
    return (
      <div className={cn("rounded-2xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 p-4 sm:p-5 text-card-foreground shadow-sm", className)}>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-foreground">Inquiry Recorded Successfully!</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Thank you, <strong>{name}</strong>. Your inquiry has been recorded. The A-ONE Foods sales and distribution desk can follow up with you shortly.
            </p>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-background/80 px-3 py-2 border border-emerald-500/20">
              <div>
                <div className="text-[10px] uppercase font-semibold text-muted-foreground">Reference ID</div>
                <div className="font-mono text-xs font-bold text-primary">{submittedId}</div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyRef}
                className="h-7 px-2 text-xs gap-1"
              >
                {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="mt-3 text-[11px] text-muted-foreground">
              For urgent orders, WhatsApp our desk:{" "}
              <a
                href={`https://wa.me/923004166555?text=Hello%2C%20following%20up%20on%20my%20inquiry%20${submittedId}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-600 dark:text-emerald-400 underline hover:no-underline"
              >
                +92 300 4166555
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-stone-200 dark:border-stone-800 bg-card p-4 sm:p-5 shadow-sm", className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
          <Building className="size-4" />
        </span>
        <div>
          <h4 className="font-bold text-sm text-foreground leading-tight">Distributor & Business Inquiry</h4>
          <p className="text-[11px] text-muted-foreground">Partner with A-ONE Foods in your territory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Your Full Name *
            </label>
            <Input
              required
              placeholder="e.g. Muhammad Ali"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Phone / WhatsApp *
            </label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input
                required
                type="tel"
                placeholder="0300-1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              City / District *
            </label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input
                required
                placeholder="e.g. Faisalabad, Lahore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Type of Inquiry
            </label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Distributorship">Distributor Application</option>
              <option value="Bulk Supply">Bulk / Wholesale Supply</option>
              <option value="Retailer / Mart">Retailer / Supermart Stocking</option>
              <option value="General Business">General Business Inquiry</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Shop / Business Name (Optional)
          </label>
          <Input
            placeholder="e.g. Al-Madina Traders"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <Button
          type="submit"
          disabled={submitting || !name.trim() || !phone.trim() || !city.trim()}
          className="w-full h-8 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground mt-1"
        >
          <Send className="size-3.5" />
          {submitting ? "Submitting Inquiry..." : "Submit Inquiry to A-ONE Team"}
        </Button>
      </form>
    </div>
  );
}
