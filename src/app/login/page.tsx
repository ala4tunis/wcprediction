"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { login, signup } from "@/lib/auth-actions";
import { Trophy, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const initialError = searchParams.get("error") || "";

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [error, setError] = useState<string>(initialError);
  const [loading, setLoading] = useState<boolean>(false);

  // Keep error sync if URL parameters change
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      setError(err);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      const result = activeTab === "signup" ? await signup(formData) : await login(formData);
      if (result && result.error) {
        setError(result.error);
        setLoading(false);
      } else if (result && result.success) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(errorMsg);
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] turf-grid relative py-8">
      {/* Background glow mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-[80px] pointer-events-none -z-10" />

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-stone-850 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-500 glow-bronze">
            <Trophy className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-100">
            {activeTab === "signup" ? "Create your Account" : "Welcome back to Ayeb"}
          </h2>
          <p className="text-stone-400 text-xs">
            {activeTab === "signup" ? "Sign up to start making tournament predictions" : "Sign in to manage predictions & view ranks"}
          </p>
        </div>

        {/* Tab Selector */}
        <div className="relative grid grid-cols-2 gap-1 p-1 bg-stone-950/60 rounded-xl border border-stone-850 z-0">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
            className={`relative py-2 text-xs font-bold text-center rounded-lg transition-all z-10 ${
              activeTab === "login" ? "text-stone-950" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {activeTab === "login" && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-amber-500 rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            Login
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setActiveTab("signup");
              setError("");
            }}
            className={`relative py-2 text-xs font-bold text-center rounded-lg transition-all z-10 ${
              activeTab === "signup" ? "text-stone-950" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {activeTab === "signup" && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-amber-500 rounded-lg -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            Sign Up
          </button>
        </div>

        {/* Form Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/40 text-red-400 text-xs text-center font-semibold shadow-lg shadow-red-950/20"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {activeTab === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex flex-col gap-1.5"
              >
                <label className="text-xs font-bold text-stone-300">Display Name</label>
                <input
                  type="text"
                  name="name"
                  required={activeTab === "signup"}
                  placeholder="e.g. Riyad Predicts"
                  disabled={loading}
                  className="px-4 py-3 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 placeholder-stone-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all text-sm disabled:opacity-50"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-300">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              disabled={loading}
              className="px-4 py-3 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 placeholder-stone-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all text-sm disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-300">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              disabled={loading}
              className="px-4 py-3 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 placeholder-stone-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all text-sm disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600/50 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>Processing...</span>
              </>
            ) : activeTab === "signup" ? (
              "Create Free Account"
            ) : (
              "Sign In to Account"
            )}
          </button>
        </form>

        {/* Extra notice */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure authentication</span>
        </div>
      </div>
    </div>
  );
}
