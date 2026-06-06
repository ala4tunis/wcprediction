"use client";

import { useState } from "react";
import { Coffee, Calendar, Trophy, Users, ShieldAlert, CheckCircle2, Lock, Save, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface Team {
  id: number;
  name: string;
  code: string | null;
  flagUrl: string | null;
  groupName: string | null;
}

interface Match {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  kickoffTime: string;
  stage: string;
  groupName: string | null;
  homeTeam: Team;
  awayTeam: Team;
}

interface PredictionsClientProps {
  matches: Match[];
  teams: Team[];
  userPredictions: {
    matches: Record<number, { homeScore: number; awayScore: number; pointsEarned: number | null }>;
    groups: Record<string, { qualified: number[]; ordered: number[] }>;
    finalists: Record<string, { homeId: number; awayId: number }>;
    tournament: { topScorer: string; topAssists: string; goldenBall: string } | null;
  };
}

export default function PredictionsClient({ matches, teams, userPredictions }: PredictionsClientProps) {
  const [activeTab, setActiveTab] = useState<"matches" | "groups" | "finalists" | "awards">("matches");
  
  // State for match prediction forms
  const [matchInputs, setMatchInputs] = useState<Record<number, { home: string; away: string }>>(() => {
    const initial: Record<number, { home: string; away: string }> = {};
    matches.forEach((m) => {
      const pred = userPredictions.matches[m.id];
      initial[m.id] = {
        home: pred ? String(pred.homeScore) : "",
        away: pred ? String(pred.awayScore) : "",
      };
    });
    return initial;
  });

  // State for group prediction forms
  const [groupSelections, setGroupSelections] = useState<Record<string, { first: string; second: string }>>(() => {
    const initial: Record<string, { first: string; second: string }> = {};
    const groups = Array.from(new Set(teams.map((t) => t.groupName).filter(Boolean))) as string[];
    groups.forEach((g) => {
      const pred = userPredictions.groups[g];
      initial[g] = {
        first: pred && pred.ordered[0] ? String(pred.ordered[0]) : "",
        second: pred && pred.ordered[1] ? String(pred.ordered[1]) : "",
      };
    });
    return initial;
  });

  // State for finalists prediction forms
  const [finalistsSelections, setFinalistsSelections] = useState<Record<string, { home: string; away: string }>>(() => {
    const initial: Record<string, { home: string; away: string }> = {};
    ["R1", "R2", "R3"].forEach((r) => {
      const pred = userPredictions.finalists[r];
      initial[r] = {
        home: pred ? String(pred.homeId) : "",
        away: pred ? String(pred.awayId) : "",
      };
    });
    return initial;
  });

  // State for tournament awards forms
  const [awardsInputs, setAwardsInputs] = useState({
    topScorer: userPredictions.tournament?.topScorer || "",
    topAssists: userPredictions.tournament?.topAssists || "",
    goldenBall: userPredictions.tournament?.goldenBall || "",
  });

  // Loading and feedback states
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleMatchScoreChange = (matchId: number, side: "home" | "away", val: string) => {
    if (!/^\d*$/.test(val)) return; // Allow only numbers
    setMatchInputs((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side]: val,
      },
    }));
  };

  const saveMatchPrediction = async (matchId: number) => {
    const input = matchInputs[matchId];
    if (input.home === "" || input.away === "") {
      showToast("Please enter scores for both teams", "error");
      return;
    }

    setSavingId(matchId);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "match",
          matchId,
          homeScore: input.home,
          awayScore: input.away,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save prediction");

      showToast("Match prediction locked successfully!", "success");
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.85 } });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      showToast(errorMsg, "error");
    } finally {
      setSavingId(null);
    }
  };

  const saveGroupPrediction = async (groupName: string) => {
    const sel = groupSelections[groupName];
    if (!sel.first || !sel.second) {
      showToast("Please select both 1st and 2nd place qualifiers", "error");
      return;
    }
    if (sel.first === sel.second) {
      showToast("A team cannot finish in both 1st and 2nd place!", "error");
      return;
    }

    setSavingId(`group-${groupName}`);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          groupName,
          qualifiedTeams: `${sel.first},${sel.second}`,
          orderedTeams: `${sel.first},${sel.second}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      showToast(`Group ${groupName} qualifications locked!`, "success");
      confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1 } });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error saving";
      showToast(errorMsg, "error");
    } finally {
      setSavingId(null);
    }
  };

  const saveFinalistsPrediction = async (roundType: string) => {
    const sel = finalistsSelections[roundType];
    if (!sel.home || !sel.away) {
      showToast("Please select two finalist teams", "error");
      return;
    }
    if (sel.home === sel.away) {
      showToast("Finalists must be two different teams!", "error");
      return;
    }

    setSavingId(`finalists-${roundType}`);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "finalists",
          homeFinalistId: sel.home,
          awayFinalistId: sel.away,
          roundType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save finalists");

      showToast(`Finalists predictions for ${roundType} locked!`, "success");
      confetti({ particleCount: 80, spread: 80 });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error saving finalists";
      showToast(errorMsg, "error");
    } finally {
      setSavingId(null);
    }
  };

  const saveTournamentAwards = async () => {
    setSavingId("tournament");
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tournament",
          topScorerName: awardsInputs.topScorer,
          topAssistsName: awardsInputs.topAssists,
          goldenBallName: awardsInputs.goldenBall,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save awards");

      showToast("Tournament award predictions locked!", "success");
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error saving awards";
      showToast(errorMsg, "error");
    } finally {
      setSavingId(null);
    }
  };

  const isMatchLocked = (kickoffTime: string) => {
    return new Date() >= new Date(kickoffTime);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-2xl flex items-center gap-2 ${
              toast.type === "success"
                ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                : "bg-red-950 text-red-400 border border-red-500/30"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-stone-950/60 rounded-2xl border border-stone-850">
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "matches" ? "bg-amber-500 text-stone-950 shadow-md font-extrabold" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Calendar className="w-4 h-4" /> Matches
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "groups" ? "bg-amber-500 text-stone-950 shadow-md font-extrabold" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Users className="w-4 h-4" /> Groups Stage
        </button>
        <button
          onClick={() => setActiveTab("finalists")}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "finalists" ? "bg-amber-500 text-stone-950 shadow-md font-extrabold" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Trophy className="w-4 h-4" /> Finalists (R1-R3)
        </button>
        <button
          onClick={() => setActiveTab("awards")}
          className={`flex items-center justify-center gap-1.5 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === "awards" ? "bg-amber-500 text-stone-950 shadow-md font-extrabold" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <Coffee className="w-4 h-4" /> Overall Awards
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
        >
          {/* MATCH PREDICTIONS TAB */}
          {activeTab === "matches" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((match) => {
                const locked = isMatchLocked(match.kickoffTime);
                const hasScorePred = userPredictions.matches[match.id];
                const points = hasScorePred?.pointsEarned;

                return (
                  <div
                    key={match.id}
                    className={`glass-panel p-6 rounded-3xl border flex flex-col gap-4 relative overflow-hidden ${
                      locked ? "border-stone-850 bg-stone-950/20" : "border-stone-800"
                    }`}
                  >
                    {/* Score status/badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-stone-900 border border-stone-850 px-2 py-0.5 rounded">
                        {match.stage} {match.groupName ? `| ${match.groupName}` : ""}
                      </span>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500/80 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-950">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">
                          <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Open
                        </span>
                      )}
                    </div>

                    {/* Team Predictor Inputs */}
                    <div className="flex items-center justify-between gap-4 my-2">
                      {/* Home */}
                      <div className="flex flex-col items-center gap-2 w-5/12 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={match.homeTeam.flagUrl || ""} alt={match.homeTeam.name} className="w-12 h-12 object-contain rounded-lg" />
                        <span className="text-sm font-bold text-stone-200">{match.homeTeam.name}</span>
                      </div>

                      {/* Score Inputs / Final Results */}
                      <div className="flex items-center justify-center gap-2 w-2/12">
                        <input
                          type="text"
                          maxLength={2}
                          disabled={locked}
                          value={matchInputs[match.id]?.home}
                          onChange={(e) => handleMatchScoreChange(match.id, "home", e.target.value)}
                          className="w-10 h-12 text-center bg-stone-950 border border-stone-800 disabled:border-stone-900 rounded-xl text-lg font-extrabold focus:border-amber-500/50 outline-none text-stone-100 disabled:text-stone-500"
                        />
                        <span className="text-stone-500 font-extrabold">:</span>
                        <input
                          type="text"
                          maxLength={2}
                          disabled={locked}
                          value={matchInputs[match.id]?.away}
                          onChange={(e) => handleMatchScoreChange(match.id, "away", e.target.value)}
                          className="w-10 h-12 text-center bg-stone-950 border border-stone-800 disabled:border-stone-900 rounded-xl text-lg font-extrabold focus:border-amber-500/50 outline-none text-stone-100 disabled:text-stone-500"
                        />
                      </div>

                      {/* Away */}
                      <div className="flex flex-col items-center gap-2 w-5/12 text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={match.awayTeam.flagUrl || ""} alt={match.awayTeam.name} className="w-12 h-12 object-contain rounded-lg" />
                        <span className="text-sm font-bold text-stone-200">{match.awayTeam.name}</span>
                      </div>
                    </div>

                    {/* Bottom Status / Buttons */}
                    <div className="flex items-center justify-between border-t border-stone-850/60 pt-4 mt-2">
                      <span className="text-[10px] text-stone-400">
                        {new Date(match.kickoffTime).toLocaleDateString('en-US', {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {locked ? (
                        <div className="flex items-center gap-3">
                          {match.status === "FT" && (
                            <span className="text-xs text-stone-400">
                              FT score: <span className="font-extrabold text-stone-200">{match.homeScore}-{match.awayScore}</span>
                            </span>
                          )}
                          {points !== undefined && points !== null ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              points === 3
                                ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                                : points === 1
                                ? "bg-amber-950/40 text-amber-500 border-amber-500/20"
                                : "bg-stone-900 text-stone-500 border-stone-800"
                            }`}>
                              +{points} pts
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-stone-900 text-stone-500 text-[10px] font-bold border border-stone-800">
                              Calculated FT
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => saveMatchPrediction(match.id)}
                          disabled={savingId === match.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {savingId === match.id ? "Saving..." : "Lock Prediction"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* GROUPS PREDICTIONS TAB */}
          {activeTab === "groups" && (
            <div className="flex flex-col gap-8">
              {Array.from(new Set(teams.map((t) => t.groupName).filter(Boolean))).map((groupName) => {
                const groupTeams = teams.filter((t) => t.groupName === groupName);

                return (
                  <div key={groupName} className="glass-panel p-6 sm:p-8 rounded-3xl border border-stone-800 flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-stone-850 pb-4">
                      <h3 className="text-lg font-bold text-stone-100">{groupName} Prediction</h3>
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        Group qualified = 2pts | Correct order = +3pts
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Left: Group Team Lists */}
                      <div className="flex flex-col gap-3">
                        {groupTeams.map((team) => (
                          <div key={team.id} className="flex items-center gap-3 p-3 bg-stone-950/40 border border-stone-850 rounded-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={team.flagUrl || ""} alt={team.name} className="w-7 h-7 object-contain rounded" />
                            <span className="text-sm font-semibold text-stone-200">{team.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* Right: Interactive ordering Selector */}
                      <div className="flex flex-col gap-4">
                        {/* 1st selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Predicted 1st Place (Winner)</label>
                          <select
                            value={groupSelections[groupName || ""]?.first}
                            onChange={(e) =>
                              setGroupSelections((prev) => ({
                                ...prev,
                                [groupName || ""]: { ...prev[groupName || ""], first: e.target.value },
                              }))
                            }
                            className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm font-semibold focus:border-amber-500/50 outline-none text-stone-200"
                          >
                            <option value="">-- Choose Winner --</option>
                            {groupTeams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 2nd selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Predicted 2nd Place (Runner-up)</label>
                          <select
                            value={groupSelections[groupName || ""]?.second}
                            onChange={(e) =>
                              setGroupSelections((prev) => ({
                                ...prev,
                                [groupName || ""]: { ...prev[groupName || ""], second: e.target.value },
                              }))
                            }
                            className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm font-semibold focus:border-amber-500/50 outline-none text-stone-200"
                          >
                            <option value="">-- Choose Runner-up --</option>
                            {groupTeams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={() => saveGroupPrediction(groupName || "")}
                          disabled={savingId === `group-${groupName}`}
                          className="w-full py-3.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-4 h-4" />
                          {savingId === `group-${groupName}` ? "Saving..." : "Lock Group Qualification"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FINALISTS PREDICTIONS TAB */}
          {activeTab === "finalists" && (
            <div className="grid grid-cols-1 gap-6">
              {[
                { round: "R1", label: "Group Stage Round 1 (After Match 1)", pts: "15 pts", desc: "Predict finalists before Group Stage Round 2 kicks off." },
                { round: "R2", label: "Group Stage Round 2 (After Match 2)", pts: "13 pts", desc: "Predict finalists before Group Stage Round 3 kicks off." },
                { round: "R3", label: "Group Stage Round 3 (After Match 3)", pts: "11 pts", desc: "Predict finalists before Knockout stage kicks off." },
              ].map((phase) => (
                <div key={phase.round} className="glass-panel p-6 sm:p-8 rounded-3xl border border-stone-800 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-850 pb-4 gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-stone-100">{phase.label} Prediction</h3>
                      <p className="text-stone-400 text-xs mt-0.5">{phase.desc}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-500 bg-amber-950/30 px-3 py-1.5 rounded-full border border-amber-900/30">
                      🏆 Worth {phase.pts}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Finalist 1 Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Predicted Finalist #1</label>
                      <select
                        value={finalistsSelections[phase.round]?.home}
                        onChange={(e) =>
                          setFinalistsSelections((prev) => ({
                            ...prev,
                            [phase.round]: { ...prev[phase.round], home: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm font-semibold focus:border-amber-500/50 outline-none text-stone-200"
                      >
                        <option value="">-- Choose Team --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Finalist 2 Selector */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wide">Predicted Finalist #2</label>
                      <select
                        value={finalistsSelections[phase.round]?.away}
                        onChange={(e) =>
                          setFinalistsSelections((prev) => ({
                            ...prev,
                            [phase.round]: { ...prev[phase.round], away: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-sm font-semibold focus:border-amber-500/50 outline-none text-stone-200"
                      >
                        <option value="">-- Choose Team --</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => saveFinalistsPrediction(phase.round)}
                      disabled={savingId === `finalists-${phase.round}`}
                      className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {savingId === `finalists-${phase.round}` ? "Saving..." : `Lock Finalists (${phase.round})`}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OVERALL AWARDS TAB */}
          {activeTab === "awards" && (
            <div className="max-w-2xl mx-auto glass-panel p-8 rounded-3xl border border-stone-800 flex flex-col gap-6 relative">
              <div className="flex flex-col gap-1 text-center">
                <h3 className="text-xl font-bold text-stone-100">Overall Tournament Predictions</h3>
                <p className="text-stone-400 text-xs">
                  Locked at the kickoff of the very first World Cup match. Make your choices carefully!
                </p>
              </div>

              {/* Awards inputs */}
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wide flex items-center justify-between">
                    <span>Golden Ball (Best Player)</span>
                    <span className="text-[10px] text-amber-500 font-extrabold normal-case bg-amber-950/20 px-2 py-0.5 rounded border border-amber-950">+15 pts</span>
                  </label>
                  <input
                    type="text"
                    value={awardsInputs.goldenBall}
                    onChange={(e) => setAwardsInputs((prev) => ({ ...prev, goldenBall: e.target.value }))}
                    placeholder="e.g. Lionel Messi or Kylian Mbappé"
                    className="px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:border-amber-500/50 outline-none text-sm font-semibold transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wide flex items-center justify-between">
                    <span>Golden Boot (Top Scorer)</span>
                    <span className="text-[10px] text-amber-500 font-extrabold normal-case bg-amber-950/20 px-2 py-0.5 rounded border border-amber-950">+8 pts</span>
                  </label>
                  <input
                    type="text"
                    value={awardsInputs.topScorer}
                    onChange={(e) => setAwardsInputs((prev) => ({ ...prev, topScorer: e.target.value }))}
                    placeholder="e.g. Harry Kane or Erling Haaland"
                    className="px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:border-amber-500/50 outline-none text-sm font-semibold transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wide flex items-center justify-between">
                    <span>Playmaker (Most Assists)</span>
                    <span className="text-[10px] text-amber-500 font-extrabold normal-case bg-amber-950/20 px-2 py-0.5 rounded border border-amber-950">+6 pts</span>
                  </label>
                  <input
                    type="text"
                    value={awardsInputs.topAssists}
                    onChange={(e) => setAwardsInputs((prev) => ({ ...prev, topAssists: e.target.value }))}
                    placeholder="e.g. Kevin De Bruyne"
                    className="px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-100 placeholder-stone-500 focus:border-amber-500/50 outline-none text-sm font-semibold transition-all"
                  />
                </div>

                <button
                  onClick={saveTournamentAwards}
                  disabled={savingId === "tournament"}
                  className="w-full py-3.5 mt-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-600 text-stone-950 font-bold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {savingId === "tournament" ? "Saving..." : "Lock Tournament Awards"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
