import Link from "next/link";
import { Trophy, Zap, ArrowRight, Circle } from "lucide-react";
import { getUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getUser();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] turf-grid football-pattern relative py-12">
      {/* Background glowing mesh */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-gradient-to-tr from-yellow-500/15 to-emerald-500/10 blur-[80px] pointer-events-none -z-10" />

      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-950/40 border border-yellow-500/30 text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
        <Circle className="w-3.5 h-3.5 fill-yellow-400" />
        FIFA World Cup 2026 Prediction Challenge
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-center tracking-tight max-w-4xl mb-6">
        <span className="trophy-shine">Predict Glory.</span> <span className="bg-gradient-to-r from-yellow-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">Claim the Trophy.</span>
      </h1>

      {/* Muted Subheading */}
      <p className="text-stone-400 text-center text-base sm:text-xl max-w-2xl mb-10 leading-relaxed">
        Join the ultimate World Cup 2026 prediction tournament at Ayeb Café. Compete with fans worldwide, predict match scores, group standings, and tournament awards to become the champion!
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full justify-center max-w-md px-4">
        {user ? (
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold transition-all shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 group w-full glow-gold"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <>
            <Link
              href="/login?tab=signup"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold transition-all shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 group w-full sm:w-auto glow-gold"
            >
              Join the Tournament
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center px-8 py-4 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-850 hover:border-yellow-500/30 text-stone-200 font-semibold transition-all w-full sm:w-auto"
            >
              Sign In
            </Link>
          </>
        )}
      </div>

      {/* Rules & Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
        {/* Card 1 */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4">
          <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-500/20 text-yellow-500">
            <Circle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-100">Match Predictions</h3>
          <p className="text-stone-400 text-sm leading-relaxed">
            Predict exact scores before kickoff. +3 points for perfect score, +1 point for correct result. Every goal matters!
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-100">Early Finalist Bonus</h3>
          <p className="text-stone-400 text-sm leading-relaxed">
            Predict finalists early for massive points! Round 1: +15 pts, Round 2: +13 pts, Round 3: +11 pts.
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4">
          <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-500/20 text-yellow-500">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-100">Live Leaderboard</h3>
          <p className="text-stone-400 text-sm leading-relaxed">
            Watch your ranking change instantly as matches unfold. See how you compare with other fans.
          </p>
        </div>
      </div>

      {/* Point details alert */}
      <div className="mt-12 glass-panel p-4 rounded-xl border border-yellow-900/30 text-stone-400 text-xs text-center max-w-3xl">
        <span className="font-bold text-yellow-500">🏆 Point System:</span> Group Qualification = 2pts each | Correct Order = +3pts | Top Scorer = 8pts | Playmaker = 6pts | Golden Ball = 15pts
      </div>
    </div>
  );
}
