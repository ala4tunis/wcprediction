"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { login, signup, signInWithGoogle, signInWithGitHub, signInWithFacebook } from "@/lib/auth-actions";
import { Coffee, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const initialError = searchParams.get("error") || "";

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [error, setError] = useState<string>(initialError);
  const [loading, setLoading] = useState<boolean>(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

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

  const handleOauthClick = (provider: string) => {
    setOauthLoading(provider);
    setError("");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] turf-grid relative py-8">
      {/* Background glow mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-amber-500/10 blur-[80px] pointer-events-none -z-10" />

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-stone-850 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-500 glow-bronze">
            <Coffee className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-100">
            {activeTab === "signup" ? "Create your Café Account" : "Welcome back to Ayeb Café"}
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

        {/* Separator */}
        <div className="flex items-center gap-3 my-1 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
          <div className="h-[1px] bg-stone-850 flex-grow" />
          <span>Or Continue With</span>
          <div className="h-[1px] bg-stone-850 flex-grow" />
        </div>

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-3">
          {/* Google OAuth */}
          <form
            action={signInWithGoogle}
            onSubmit={() => handleOauthClick("google")}
          >
            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-900 text-stone-200 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google
            </button>
          </form>

          {/* GitHub OAuth */}
          <form
            action={signInWithGitHub}
            onSubmit={() => handleOauthClick("github")}
          >
            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-900 text-stone-200 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === "github" ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              )}
              GitHub
            </button>
          </form>

          {/* Facebook OAuth */}
          <form
            action={signInWithFacebook}
            onSubmit={() => handleOauthClick("facebook")}
          >
            <button
              type="submit"
              disabled={loading || oauthLoading !== null}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-stone-950 border border-stone-800 hover:bg-stone-900 text-stone-200 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === "facebook" ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              )}
              Facebook
            </button>
          </form>
        </div>

        {/* Extra notice */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure authentication</span>
        </div>
      </div>
    </div>
  );
}
