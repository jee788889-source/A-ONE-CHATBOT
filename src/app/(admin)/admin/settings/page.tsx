"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Store,
  Clock,
  Truck,
  Bot,
  CreditCard,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Power,
  Calendar,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_BUSINESS_HOURS,
  type DaySchedule,
  type TemporaryClosure,
  formatTime12h,
} from "@/lib/business-hours";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const TEMPORARY_CLOSURE_REASONS = [
  "Private Event / Catering",
  "Kitchen Maintenance",
  "Holiday / Eid / National Day",
  "Kitchen Overload / Rush",
  "Emergency / Weather",
  "Staff Training",
  "Other",
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"HOURS" | "PAYMENTS" | "RESTAURANT" | "DELIVERY" | "AI">("HOURS");

  // Live status telemetry
  const [liveStatus, setLiveStatus] = useState<any>(null);

  // Business Hours State
  const [openingHours, setOpeningHours] = useState<Record<string, DaySchedule>>(DEFAULT_BUSINESS_HOURS);
  const [tempClosure, setTempClosure] = useState<TemporaryClosure>({
    isClosed: false,
    reason: "Kitchen Maintenance",
  });

  // Payment Accounts State
  const [jazzcashTitle, setJazzcashTitle] = useState("A-ONE Restaurant");
  const [jazzcashNumber, setJazzcashNumber] = useState("0300-1234567");
  const [easypaisaTitle, setEasypaisaTitle] = useState("A-ONE Restaurant");
  const [easypaisaNumber, setEasypaisaNumber] = useState("0321-9876543");
  const [bankName, setBankName] = useState("Meezan Bank");
  const [bankTitle, setBankTitle] = useState("A-ONE Foods PVT LTD");
  const [bankIban, setBankIban] = useState("PK00MEZN0000123456789012");

  // Restaurant Profile
  const [name, setName] = useState("A-ONE Restaurant");
  const [tagline, setTagline] = useState("Authentic Taste, Premium Quality & Traditional Savories");
  const [phone, setPhone] = useState("+92 300 1234567");
  const [email, setEmail] = useState("contact@aonefoods.com");
  const [address, setAddress] = useState("A-ONE Restaurant, Main Boulevard, Pakistan");
  const [deliveryFee, setDeliveryFee] = useState(150);
  const [minOrderAmount, setMinOrderAmount] = useState(500);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(2000);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);

  // WhatsApp & AI
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome to A-ONE Restaurant! 🍔🍕\nHow may we serve you today?\n\nType *Menu* to see our dishes or *Order* to start an order."
  );
  const [autoReply, setAutoReply] = useState(true);
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiModel, setAiModel] = useState("claude-3-5-sonnet-20241022");
  const [strictGuardrails, setStrictGuardrails] = useState(true);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to load settings");

      const s = data.settings;
      if (s) {
        setName(s.name || "A-ONE Restaurant");
        setTagline(s.tagline || "");
        setPhone(s.phone || "");
        setEmail(s.email || "");
        setAddress(s.address || "");
        setDeliveryFee(s.deliveryFee || 150);
        setMinOrderAmount(s.minOrderAmount || 500);
        setIsAcceptingOrders(s.isAcceptingOrders ?? true);

        if (s.openingHours) {
          const rawHours = s.openingHours;
          setOpeningHours({
            monday: rawHours.monday || DEFAULT_BUSINESS_HOURS.monday,
            tuesday: rawHours.tuesday || DEFAULT_BUSINESS_HOURS.tuesday,
            wednesday: rawHours.wednesday || DEFAULT_BUSINESS_HOURS.wednesday,
            thursday: rawHours.thursday || DEFAULT_BUSINESS_HOURS.thursday,
            friday: rawHours.friday || DEFAULT_BUSINESS_HOURS.friday,
            saturday: rawHours.saturday || DEFAULT_BUSINESS_HOURS.saturday,
            sunday: rawHours.sunday || DEFAULT_BUSINESS_HOURS.sunday,
          });

          if (rawHours.temporaryClosure) {
            setTempClosure(rawHours.temporaryClosure);
          }
        }

        if (s.paymentAccounts) {
          const p = s.paymentAccounts;
          if (p.jazzcash) {
            setJazzcashTitle(p.jazzcash.accountTitle || "");
            setJazzcashNumber(p.jazzcash.accountNumber || "");
          }
          if (p.easypaisa) {
            setEasypaisaTitle(p.easypaisa.accountTitle || "");
            setEasypaisaNumber(p.easypaisa.accountNumber || "");
          }
          if (p.bank) {
            setBankName(p.bank.bankName || "");
            setBankTitle(p.bank.accountTitle || "");
            setBankIban(p.bank.iban || "");
          }
        }

        if (s.deliverySettings) {
          setFreeDeliveryThreshold(s.deliverySettings.freeDeliveryThreshold || 2000);
        }

        if (s.whatsappConfig) {
          setWelcomeMessage(s.whatsappConfig.welcomeMessage || welcomeMessage);
          setAutoReply(s.whatsappConfig.autoReplyEnabled ?? true);
        }

        if (s.aiSettings) {
          setAiProvider(s.aiSettings.provider || "anthropic");
          setAiModel(s.aiSettings.model || "claude-3-5-sonnet-20241022");
          setStrictGuardrails(s.aiSettings.strictGuardrails ?? true);
        }
      }

      if (data.liveStatus) {
        setLiveStatus(data.liveStatus);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function handleDayChange(dayKey: string, field: keyof DaySchedule, value: any) {
    setOpeningHours((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          tagline,
          phone,
          email,
          address,
          deliveryFee: Number(deliveryFee),
          minOrderAmount: Number(minOrderAmount),
          isAcceptingOrders: !tempClosure.isClosed,
          openingHours,
          temporaryClosure: tempClosure,
          deliverySettings: {
            standardDeliveryFee: Number(deliveryFee),
            freeDeliveryThreshold: Number(freeDeliveryThreshold),
            estimatedMinutes: 35,
            allowedAreas: ["City Center", "Commercial Area", "Model Town", "Gulberg", "DHA"],
          },
          paymentAccounts: {
            jazzcash: { accountTitle: jazzcashTitle, accountNumber: jazzcashNumber },
            easypaisa: { accountTitle: easypaisaTitle, accountNumber: easypaisaNumber },
            bank: { bankName, accountTitle: bankTitle, iban: bankIban },
          },
          whatsappConfig: {
            welcomeMessage,
            autoReplyEnabled: autoReply,
            fallbackMessage: "Thank you for contacting A-ONE Restaurant. One of our team members will assist you.",
          },
          aiSettings: {
            provider: aiProvider,
            model: aiModel,
            temperature: 0.2,
            maxTokens: 600,
            strictGuardrails,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to save settings");

      if (data.liveStatus) {
        setLiveStatus(data.liveStatus);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleTemporaryClosure(close: boolean) {
    const updated = {
      ...tempClosure,
      isClosed: close,
    };
    setTempClosure(updated);
    setIsAcceptingOrders(!close);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Settings className="size-6 text-amber-500" />
              Owner Control Center & Settings
            </h1>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Owner / Manager
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Configure business hours, temporary closures, online payment accounts, delivery rates, and WhatsApp AI guardrails.
          </p>
        </div>

        <Button
          type="submit"
          disabled={saving || loading}
          className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs h-9 shadow-md shadow-amber-500/20 shrink-0"
        >
          <Save className="size-4 mr-1.5" />
          {saving ? "Saving All Settings..." : "Save Settings"}
        </Button>
      </div>

      {/* Live Business Hours Status Banner */}
      <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className={`size-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              liveStatus?.isOpen
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            }`}
          >
            {liveStatus?.isOpen ? "🟢" : "🔴"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white">
                {liveStatus?.isOpen ? "Restaurant is Currently OPEN" : "Restaurant is Currently CLOSED"}
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  liveStatus?.isOpen
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                }`}
              >
                {liveStatus?.status || (liveStatus?.isOpen ? "OPEN" : "CLOSED")}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {liveStatus?.romanUrduMessage || liveStatus?.message || "Pakistan Standard Time (Asia/Karachi)"}
            </p>
          </div>
        </div>

        {/* Instant Open / Close Toggle */}
        <div className="flex items-center gap-2">
          {tempClosure.isClosed ? (
            <Button
              type="button"
              size="sm"
              onClick={() => toggleTemporaryClosure(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8"
            >
              <Power className="size-3.5 mr-1.5" />
              Open Restaurant Now
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => toggleTemporaryClosure(true)}
              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/40 font-bold text-xs h-8"
            >
              <AlertTriangle className="size-3.5 mr-1.5" />
              Temporarily Close Restaurant
            </Button>
          )}
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>All settings updated and synchronized with the live WhatsApp AI engine!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-neutral-800 space-x-2 overflow-x-auto scroll-slim">
        {[
          { key: "HOURS", label: "Business Hours & Schedule", icon: Clock },
          { key: "PAYMENTS", label: "Online Payment Accounts", icon: CreditCard },
          { key: "RESTAURANT", label: "Restaurant Profile", icon: Store },
          { key: "DELIVERY", label: "Kitchen & Delivery Limits", icon: Truck },
          { key: "AI", label: "WhatsApp & AI Engine", icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 pt-1 px-3 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
                isActive
                  ? "border-amber-500 text-amber-400 font-extrabold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BUSINESS HOURS & SCHEDULE */}
      {activeTab === "HOURS" && (
        <div className="space-y-6">
          {/* Temporary Closure Card */}
          <Card className="bg-neutral-900/70 border-neutral-800 backdrop-blur">
            <CardHeader className="pb-3 border-b border-neutral-800">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                Temporary Closure Override
              </CardTitle>
              <CardDescription className="text-xs text-neutral-400">
                Override weekly schedule to temporarily pause new order acceptance during private events, holidays, or maintenance.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Temporary Closure Status</label>
                  <button
                    type="button"
                    onClick={() => toggleTemporaryClosure(!tempClosure.isClosed)}
                    className={`w-full h-10 rounded-xl font-bold text-xs border transition flex items-center justify-center gap-2 ${
                      tempClosure.isClosed
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    }`}
                  >
                    {tempClosure.isClosed ? "🔴 Restaurant Temporarily Closed" : "🟢 Normal Schedule Active"}
                  </button>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-neutral-300">Reason for Temporary Closure</label>
                  <select
                    value={tempClosure.reason || TEMPORARY_CLOSURE_REASONS[0]}
                    onChange={(e) => setTempClosure({ ...tempClosure, reason: e.target.value })}
                    disabled={!tempClosure.isClosed}
                    className="w-full h-10 rounded-xl bg-neutral-950 border border-neutral-800 text-xs px-3 text-neutral-200 disabled:opacity-40"
                  >
                    {TEMPORARY_CLOSURE_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 7-Day Schedule Matrix */}
          <Card className="bg-neutral-900/70 border-neutral-800 backdrop-blur">
            <CardHeader className="pb-3 border-b border-neutral-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="size-4 text-amber-500" />
                  Weekly Operating Schedule (Asia/Karachi Timezone)
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400">
                  Configure opening time, closing time, and order cutoff time for each individual day.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 text-xs">
              <div className="divide-y divide-neutral-800/80">
                {DAYS_OF_WEEK.map((day) => {
                  const sched = openingHours[day.key] || DEFAULT_BUSINESS_HOURS[day.key];
                  return (
                    <div
                      key={day.key}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-800/20 transition-colors"
                    >
                      <div className="w-32 flex items-center gap-2">
                        <Calendar className="size-4 text-amber-500/70" />
                        <span className="font-bold text-white text-xs">{day.label}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Day Status Toggle */}
                        <button
                          type="button"
                          onClick={() => handleDayChange(day.key, "isOpen", !sched.isOpen)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            sched.isOpen
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {sched.isOpen ? "OPEN" : "CLOSED DAY"}
                        </button>

                        {/* Opening Time */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-500 font-semibold">Open:</span>
                          <Input
                            type="time"
                            value={sched.open}
                            disabled={!sched.isOpen}
                            onChange={(e) => handleDayChange(day.key, "open", e.target.value)}
                            className="bg-neutral-950 border-neutral-800 h-8 w-28 text-xs text-neutral-200 disabled:opacity-30"
                          />
                        </div>

                        {/* Closing Time */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-500 font-semibold">Close:</span>
                          <Input
                            type="time"
                            value={sched.close}
                            disabled={!sched.isOpen}
                            onChange={(e) => handleDayChange(day.key, "close", e.target.value)}
                            className="bg-neutral-950 border-neutral-800 h-8 w-28 text-xs text-neutral-200 disabled:opacity-30"
                          />
                        </div>

                        {/* Cutoff Minutes */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-500 font-semibold">Cutoff:</span>
                          <Input
                            type="number"
                            min={0}
                            max={60}
                            value={sched.cutoffMinutes || 20}
                            disabled={!sched.isOpen}
                            onChange={(e) => handleDayChange(day.key, "cutoffMinutes", Number(e.target.value))}
                            className="bg-neutral-950 border-neutral-800 h-8 w-16 text-xs text-neutral-200 disabled:opacity-30"
                          />
                          <span className="text-[10px] text-neutral-500">min</span>
                        </div>
                      </div>

                      {/* Display Human Time Range */}
                      <div className="w-40 text-right text-[11px] text-amber-400/90 font-mono">
                        {sched.isOpen ? `${formatTime12h(sched.open)} – ${formatTime12h(sched.close)}` : "CLOSED"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: ONLINE PAYMENT ACCOUNTS */}
      {activeTab === "PAYMENTS" && (
        <Card className="bg-neutral-900/70 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-3 border-b border-neutral-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="size-4 text-amber-500" />
              Verified Online Payment Accounts
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Customers receive these verified account details via WhatsApp for online transfer orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-5 text-xs">
            {/* JazzCash */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                📱 JazzCash Account
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Account Title</label>
                  <Input
                    value={jazzcashTitle}
                    onChange={(e) => setJazzcashTitle(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 h-8 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Account / Mobile Number</label>
                  <Input
                    value={jazzcashNumber}
                    onChange={(e) => setJazzcashNumber(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 h-8 text-xs text-neutral-200"
                  />
                </div>
              </div>
            </div>

            {/* Easypaisa */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                📱 Easypaisa Account
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Account Title</label>
                  <Input
                    value={easypaisaTitle}
                    onChange={(e) => setEasypaisaTitle(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 h-8 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Account / Mobile Number</label>
                  <Input
                    value={easypaisaNumber}
                    onChange={(e) => setEasypaisaNumber(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 h-8 text-xs text-neutral-200"
                  />
                </div>
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
              <p className="font-bold text-cyan-400 flex items-center gap-1.5">
                🏦 Bank Transfer (IBAN)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Bank Name</label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 h-8 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">Account Title</label>
                  <Input
                    value={bankTitle}
                    onChange={(e) => setBankTitle(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 h-8 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">IBAN / Account #</label>
                  <Input
                    value={bankIban}
                    onChange={(e) => setBankIban(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 h-8 text-xs text-neutral-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: RESTAURANT PROFILE */}
      {activeTab === "RESTAURANT" && (
        <Card className="bg-neutral-900/70 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-3 border-b border-neutral-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="size-4 text-amber-500" />
              Restaurant Information
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Public restaurant identity used by AI and receipts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Restaurant Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Brand Tagline</label>
                <Input
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Contact Phone / WhatsApp</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-neutral-300">Physical Address / Branch</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-neutral-950 border-neutral-800 h-9 text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: KITCHEN & DELIVERY LIMITS */}
      {activeTab === "DELIVERY" && (
        <Card className="bg-neutral-900/70 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-3 border-b border-neutral-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="size-4 text-orange-500" />
              Kitchen & Delivery Settings
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Delivery charges, free delivery minimums, and order limits.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Standard Delivery Fee (PKR)</label>
                <Input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Minimum Order Amount (PKR)</label>
                <Input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                  className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Free Delivery Threshold (PKR)</label>
                <Input
                  type="number"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="bg-neutral-950 border-neutral-800 h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: WHATSAPP & AI ENGINE */}
      {activeTab === "AI" && (
        <Card className="bg-neutral-900/70 border-neutral-800 backdrop-blur">
          <CardHeader className="pb-3 border-b border-neutral-800">
            <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="size-4 text-emerald-400" />
              WhatsApp & AI Assistant Engine
            </CardTitle>
            <CardDescription className="text-xs text-neutral-400">
              Automated multi-lingual greeting message and strict zero-hallucination guardrails.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-neutral-300">WhatsApp Welcome Greeting Message</label>
              <textarea
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                className="w-full rounded-md bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-neutral-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">AI Provider Model</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full h-9 rounded-md bg-neutral-950 border border-neutral-800 text-xs px-2 text-neutral-200"
                >
                  <option value="claude-3-5-sonnet-20241022">Anthropic Claude 3.5 Sonnet</option>
                  <option value="gpt-4o">OpenAI GPT-4o</option>
                  <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-neutral-300">Zero-Hallucination Guardrails</label>
                <button
                  type="button"
                  onClick={() => setStrictGuardrails(!strictGuardrails)}
                  className={`w-full h-9 rounded-md font-bold text-xs border transition ${
                    strictGuardrails
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400"
                  }`}
                >
                  {strictGuardrails ? "🛡️ Strict Zero-Hallucination Active" : "Standard Mode"}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
