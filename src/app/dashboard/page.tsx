import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Coffee, Trophy, TrendingUp, Calendar, AlertCircle, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    redirect("/login");
  }

  // Retrieve user with prediction count, and points transactions
  const user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
    include: {
      matchPredictions: true,
      groupPredictions: true,
      finalistsPredictions: true,
      tournamentPrediction: true,
      pointTransactions: {
        orderBy: { createdAt: "desc" },
        take: 5, // Last 5 transactions
      },
    },
  });

  if (!user) {
    // Fallback if not synced yet (safety)
    redirect("/login");
  }

  // Get total tournament players to calculate percentiles
  const totalPlayersCount = await prisma.user.count();

  // Retrieve 3 upcoming matches
  const upcomingMatches = await prisma.match.findMany({
    where: {
      status: "NS", // Not Started
    },
    orderBy: { kickoffTime: "asc" },
    take: 3,
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  // Calculate prediction statistics
  const predictionsCount = user.matchPredictions.length;
  const exactScoresCount = user.matchPredictions.filter((p) => p.pointsEarned === 3).length;
  const correctResultsCount = user.matchPredictions.filter((p) => p.pointsEarned === 1).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="relative glass-panel p-8 rounded-3xl overflow-hidden border border-stone-800">
        {/* Glow overlay */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-amber-500/10 blur-[50px] pointer-events-none -z-10" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-amber-500" /> Cafe Lounge Active
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-100">
              Welcome back, {user.name}!
            </h1>
            <p className="text-stone-400 text-sm max-w-xl">
              Enjoy your coffee and keep predictions coming. Make sure to check deadlines before kickoff to lock in your scores!
            </p>
          </div>

          <Link
            href="/predictions"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/15"
          >
            Manage Your Predictions
          </Link>
        </div>
      </div>

      {/* Ranks & Points Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {/* Total Points */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-stone-800">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total Points</span>
            <span className="text-3xl font-extrabold text-stone-100">{user.totalPoints}</span>
            <span className="text-[10px] text-amber-500 font-medium">Accumulated score</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-500">
            <Coffee className="w-6 h-6" />
          </div>
        </div>

        {/* Global Rank */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-stone-800">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Global Rank</span>
            <span className="text-3xl font-extrabold text-stone-100">#{user.rank}</span>
            <span className="text-[10px] text-stone-500 font-medium">Out of {totalPlayersCount} players</span>
          </div>
          <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-amber-500">
            <Trophy className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Prediction Accuracy */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-stone-800">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Exact Scores</span>
            <span className="text-3xl font-extrabold text-stone-100">{exactScoresCount}</span>
            <span className="text-[10px] text-emerald-400 font-medium">+{exactScoresCount * 3} pts (+{correctResultsCount} outcome pts)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Predictions Completed */}
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-stone-800">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-stone-400 font-bold uppercase tracking-wider">Total Predicted</span>
            <span className="text-3xl font-extrabold text-stone-100">{predictionsCount}</span>
            <span className="text-[10px] text-stone-500 font-medium">Matches submitted</span>
          </div>
          <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Matches & Point Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1 & 2: Upcoming Matches */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" /> Upcoming Matches
            </h2>
            <Link href="/predictions" className="text-xs text-amber-500 hover:text-amber-400 hover:underline font-bold">
              View all
            </Link>
          </div>

          {upcomingMatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="glass-panel p-5 rounded-2xl flex items-center justify-between border border-stone-800">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 w-1/3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.homeTeam.flagUrl || ""} alt={match.homeTeam.name} className="w-8 h-8 object-contain rounded" />
                    <span className="text-sm font-bold text-stone-100 hidden sm:inline">{match.homeTeam.name}</span>
                    <span className="text-sm font-bold text-stone-100 sm:hidden">{match.homeTeam.code}</span>
                  </div>

                  {/* Kickoff / Status Info */}
                  <div className="flex flex-col items-center justify-center w-1/3 text-center">
                    <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-850 text-[10px] font-bold text-amber-500 mb-1">
                      {match.stage}
                    </span>
                    <span className="text-[11px] font-medium text-stone-400">
                      {new Date(match.kickoffTime).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-end gap-3 w-1/3 text-right">
                    <span className="text-sm font-bold text-stone-100 hidden sm:inline">{match.awayTeam.name}</span>
                    <span className="text-sm font-bold text-stone-100 sm:hidden">{match.awayTeam.code}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={match.awayTeam.flagUrl || ""} alt={match.awayTeam.name} className="w-8 h-8 object-contain rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center border border-stone-800">
              <AlertCircle className="w-8 h-8 text-stone-500 mb-2 animate-bounce" />
              <h3 className="text-stone-300 text-sm font-bold">No upcoming matches</h3>
              <p className="text-stone-500 text-xs mt-1">All fixtures finished or matches not synchronized yet.</p>
            </div>
          )}
        </div>

        {/* Column 3: Point Ledger / Recent Activities */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Points Ledger
          </h2>

          <div className="glass-panel p-6 rounded-2xl border border-stone-800 flex flex-col gap-4">
            {user.pointTransactions.length > 0 ? (
              <div className="flex flex-col gap-3">
                {user.pointTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-start justify-between gap-3 pb-3 border-b border-stone-850/50 last:border-0 last:pb-0">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-stone-200 line-clamp-1">{tx.reason}</span>
                      <span className="text-[10px] text-stone-500">
                        {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      +{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <AlertCircle className="w-7 h-7 text-stone-500 mb-1.5" />
                <span className="text-stone-400 text-xs font-bold">No point history yet</span>
                <span className="text-stone-500 text-[10px] mt-0.5">Points will post when matches finish!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
