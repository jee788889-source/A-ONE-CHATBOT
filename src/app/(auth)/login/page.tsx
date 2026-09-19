"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"LOGIN" | "ACTIVATE">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSessionExpired = searchParams.get("error") === "session_expired";
  const isUnauthorized = searchParams.get("error") === "unauthorized";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password || (mode === "ACTIVATE" && !name)) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === "LOGIN" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "LOGIN" ? { email, password } : { email, name, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const errMessage =
          data?.error === "Invalid credentials"
            ? "Invalid email or password. Please verify your credentials."
            : data?.error || "Authentication failed. Please check your connection.";
        throw new Error(errMessage);
      }

      setLoginSuccess(true);
      const next = searchParams.get("next") || "/admin";
      setTimeout(() => {
        router.push(next);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950 overflow-hidden">
      {/* Dynamic ambient background with subtle gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/[0.03] rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="h-20 w-48 rounded-2xl bg-neutral-900/90 border border-neutral-800 p-1 shadow-2xl shadow-amber-500/10 mb-4 flex items-center justify-center overflow-hidden backdrop-blur-md">
            <img
              src="/assets/images/logo-3d.png"
              alt="A-ONE Restaurant"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold tracking-wide uppercase mb-2">
            <Sparkles className="size-3" />
            <span>Operations & Management Portal</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            A-ONE RESTAURANT
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-medium max-w-xs">
            Authentic Taste, Premium Quality & Traditional Savories
          </p>
        </div>

        {/* Auth Mode Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-900/90 border border-neutral-800 rounded-xl mb-3 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setMode("LOGIN");
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === "LOGIN"
                ? "bg-amber-500 text-neutral-950 shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <LogIn className="size-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("ACTIVATE");
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              mode === "ACTIVATE"
                ? "bg-amber-500 text-neutral-950 shadow-md"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <UserPlus className="size-3.5" />
            Activate Account
          </button>
        </div>

        {/* Login / Activation Card */}
        <Card className="bg-neutral-900/90 border-neutral-800 backdrop-blur-xl shadow-2xl shadow-black/80">
          <CardHeader className="pb-3 border-b border-neutral-800/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                {mode === "LOGIN" ? <Lock className="size-4 text-amber-500" /> : <KeyRound className="size-4 text-amber-500" />}
                {mode === "LOGIN" ? "Staff Sign In" : "Activate Authorized Account"}
              </CardTitle>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                Restricted
              </span>
            </div>
            <CardDescription className="text-xs text-neutral-400 mt-1">
              {mode === "LOGIN"
                ? "Authorized Owner, Manager, and Staff access only."
                : "Activate an account invited by the Owner with your authorized email."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-4">
            {/* Session Expiry or Unauthorized alerts */}
            {isSessionExpired && !error && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-400 flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>Your session has expired. Please sign in again to continue.</span>
              </div>
            )}

            {isUnauthorized && !error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>Access denied. You do not have permission for that section.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Feedback */}
            {loginSuccess && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center gap-2.5">
                <CheckCircle2 className="size-4 shrink-0" />
                <span className="font-semibold">
                  {mode === "LOGIN" ? "Authentication successful. Entering Operations Hub..." : "Account activated successfully. Initializing workspace..."}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "ACTIVATE" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Your Full Name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Muhammad Ali"
                    required
                    disabled={loading || loginSuccess}
                    className="bg-neutral-950/90 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500/50 h-11 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Authorized Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aonefoods.com"
                  required
                  disabled={loading || loginSuccess}
                  autoComplete="email"
                  className="bg-neutral-950/90 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500/50 h-11 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  {mode === "LOGIN" ? "Password" : "Create Password (Min 6 Characters)"}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    disabled={loading || loginSuccess}
                    autoComplete={mode === "LOGIN" ? "current-password" : "new-password"}
                    className="bg-neutral-950/90 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-amber-500/50 h-11 text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || loginSuccess}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-neutral-950 font-black h-11 shadow-lg shadow-amber-500/20 transition-all text-xs uppercase tracking-wider mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {mode === "LOGIN" ? "Authenticating..." : "Activating Account..."}
                  </>
                ) : loginSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Verified
                  </>
                ) : mode === "LOGIN" ? (
                  "Sign In to Operations"
                ) : (
                  "Activate Account & Enter"
                )}
              </Button>
            </form>

            <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                <span>Encrypted RBAC Security</span>
              </div>
              <span>Private System</span>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p suppressHydrationWarning className="mt-6 text-center text-[11px] text-neutral-600">
          © {new Date().getFullYear()} A-ONE Restaurant. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-neutral-400">
            <div className="size-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-xs uppercase tracking-wider font-semibold">Loading A-ONE Portal...</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
