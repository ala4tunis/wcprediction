"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Lock, Unlock, Save, ArrowLeft, Flag, Trash2 } from "lucide-react";

interface Team {
  id: number;
  name: string;
  code: string | null;
  flagUrl: string | null;
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
  createdAt: Date;
  updatedAt: Date;
}

interface SupportTicket {
  id: string;
  email: string;
  issueType: string;
  message: string;
  locale: string;
  createdAt: string;
}

interface AdminPanelProps {
  matches: Match[];
  supportTickets: SupportTicket[];
}

export default function AdminPanel({ matches, supportTickets }: AdminPanelProps) {
  const [matchResults, setMatchResults] = useState<Record<number, { homeScore: number; awayScore: number }>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

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
    } catch {
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
    } catch {
      setMessage("Error locking/unlocking predictions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    setDeletingTicketId(ticketId);
    setMessage("");

    try {
      const response = await fetch("/api/admin/support-tickets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });

      if (response.ok) {
        setMessage("Support ticket deleted successfully!");
        setTimeout(() => setMessage(""), 3000);
        window.location.reload();
      } else {
        setMessage("Failed to delete support ticket");
      }
    } catch {
      setMessage("Error deleting support ticket");
    } finally {
      setDeletingTicketId(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-850 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-100 flex items-center gap-2">
            <Shield className="w-8 h-8 text-yellow-500" /> Admin Panel
          </h1>
          <p className="text-stone-400 text-sm">Manage match results and prediction locks</p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 hover:bg-stone-700 font-bold text-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.includes("success") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {message}
        </div>
      )}

      <div className="glass-panel rounded-2xl border border-stone-800 p-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-stone-100">Support Inbox</h2>
        {supportTickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {supportTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-stone-800 bg-stone-950/60 p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                  <span>{ticket.email}</span>
                  <div className="flex items-center gap-3">
                    <span>
                      {ticket.issueType} · {new Date(ticket.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      disabled={deletingTicketId === ticket.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      {deletingTicketId === ticket.id ? "Deleting" : "Delete"}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-stone-200 whitespace-pre-wrap">{ticket.message}</p>
                <span className="text-[10px] uppercase tracking-wider text-amber-500">{ticket.locale}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400">No support tickets yet.</p>
        )}
      </div>

      {Object.entries(groupedMatches).map(([stage, stageMatches]) => (
        <div key={stage} className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-stone-100">{stage}</h2>
          <div className="grid grid-cols-1 gap-4">
            {stageMatches.map((match) => (
              <div key={match.id} className="glass-panel rounded-2xl border border-stone-800 p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-bold text-stone-100">{match.homeTeam.name}</span>
                      <img src={match.homeTeam.flagUrl || ""} alt={match.homeTeam.name} className="w-8 h-6 object-cover rounded" />
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
                      <img src={match.awayTeam.flagUrl || ""} alt={match.awayTeam.name} className="w-8 h-6 object-cover rounded" />
                      <span className="text-sm font-bold text-stone-100">{match.awayTeam.name}</span>
                    </div>
                  </div>

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
