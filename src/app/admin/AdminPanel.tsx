"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Lock, Unlock, Save, ArrowLeft, Flag } from "lucide-react";

interface Team {
  id: number;
  name: string;
  code: string;
  flagUrl: string;
}

interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  kickoffTime: Date;
  stage: string;
  groupName: string | null;
  homeTeam: Team;
  awayTeam: Team;
}

interface AdminPanelProps {
  matches: Match[];
}

export default function AdminPanel({ matches }: AdminPanelProps) {
  const [matchResults, setMatchResults] = useState<Record<number, { homeScore: number; awayScore: number }>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleScoreChange = (matchId: number, team: "home" | "away", value: string) => {
    setMatchResults((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === "home" ? "homeScore" : "awayScore"]: parseInt(value) || 0,
      },
    }));
  };

  const handleSaveResult = async (matchId: number) => {
    const result = matchResults[matchId];
    if (!result) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          status: "FT",
        }),
      });

      if (response.ok) {
        setMessage("Match result saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save match result");
      }
    } catch (error) {
      setMessage("Error saving match result");
    } finally {
      setLoading(false);
    }
  };

  const handleLockPredictions = async (matchId: number, locked: boolean) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/predictions/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          locked,
        }),
      });

      if (response.ok) {
        setMessage(locked ? "Predictions locked successfully!" : "Predictions unlocked successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to lock/unlock predictions");
      }
    } catch (error) {
      setMessage("Error locking/unlocking predictions");
    } finally {
      setLoading(false);
    }
  };

  const groupedMatches = matches.reduce((acc, match) => {
    const stage = match.stage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-850 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-100 flex items-center gap-2">
            <Shield className="w-8 h-8 text-yellow-500" /> Admin Panel
          </h1>
          <p className="text-stone-400 text-sm">
            Manage match results and prediction locks
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 hover:bg-stone-700 font-bold text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-xl border ${message.includes("success") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {message}
        </div>
      )}

      {/* Matches by Stage */}
      {Object.entries(groupedMatches).map(([stage, stageMatches]) => (
        <div key={stage} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-100">{stage}</h2>
          <div className="grid grid-cols-1 gap-4">
            {stageMatches.map((match) => (
              <div key={match.id} className="glass-panel rounded-2xl border border-stone-800 p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Teams */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-bold text-stone-100">{match.homeTeam.name}</span>
                      <img src={match.homeTeam.flagUrl} alt={match.homeTeam.name} className="w-8 h-6 object-cover rounded" />
                    </div>

                    <div className="flex items-center gap-2 px-4">
                      <input
                        type="number"
                        min="0"
                        defaultValue={match.homeScore || 0}
                        onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                        className="w-12 h-10 text-center bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-bold focus:outline-none focus:border-yellow-500"
                        disabled={match.status === "FT"}
                      />
                      <span className="text-stone-500 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        defaultValue={match.awayScore || 0}
                        onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                        className="w-12 h-10 text-center bg-stone-900 border border-stone-700 rounded-lg text-stone-100 font-bold focus:outline-none focus:border-yellow-500"
                        disabled={match.status === "FT"}
                      />
                    </div>

                    <div className="flex items-center gap-3 flex-1">
                      <img src={match.awayTeam.flagUrl} alt={match.awayTeam.name} className="w-8 h-6 object-cover rounded" />
                      <span className="text-sm font-bold text-stone-100">{match.awayTeam.name}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveResult(match.id)}
                      disabled={loading || match.status === "FT"}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Result
                    </button>

                    {match.status === "NS" ? (
                      <button
                        onClick={() => handleLockPredictions(match.id, true)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" /> Lock
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLockPredictions(match.id, false)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-700 border border-stone-600 text-stone-300 hover:bg-stone-600 font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Unlock
                      </button>
                    )}
                  </div>
                </div>

                {/* Match Info */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-stone-850 text-xs text-stone-500">
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3" /> {match.groupName || "N/A"}
                  </span>
                  <span>•</span>
                  <span>{new Date(match.kickoffTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>•</span>
                  <span className={`font-bold ${match.status === "FT" ? "text-emerald-400" : match.status === "LOCKED" ? "text-yellow-400" : "text-stone-400"}`}>
                    {match.status === "FT" ? "Finished" : match.status === "LOCKED" ? "Locked" : "Not Started"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
