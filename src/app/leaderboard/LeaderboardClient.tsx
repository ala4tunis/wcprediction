"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, User, Zap } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  rank: number;
}

interface LeaderboardClientProps {
  initialUsers: UserRow[];
}

export default function LeaderboardClient({ initialUsers }: LeaderboardClientProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [ticker, setTicker] = useState<string | null>(null);

  // Keep a ref to the current users list to avoid resubscriptions
  const usersRef = useRef<UserRow[]>(users);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to changes in the "User" table (PostgreSQL replication)
    const channel = supabase
      .channel("public-user-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "User",
        },
        (payload) => {
          const updatedUser = payload.new as UserRow;
          console.log("[Realtime Update]:", updatedUser);

          // Update local state list
          setUsers((prevUsers) => {
            const nextUsers = prevUsers.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
            
            // Re-sort users by totalPoints desc
            const sorted = [...nextUsers].sort((a, b) => b.totalPoints - a.totalPoints);
            
            // Re-apply ranks programmatically in client
            let currentRank = 1;
            let skipped = 0;
            return sorted.map((u, i) => {
              if (i > 0) {
                if (u.totalPoints < sorted[i - 1].totalPoints) {
                  currentRank = currentRank + skipped + 1;
                  skipped = 0;
                } else {
                  skipped++;
                }
              }
              return { ...u, rank: currentRank };
            });
          });

          // Show a beautiful live ticker toast
          const oldUser = usersRef.current.find((u) => u.id === updatedUser.id);
          if (oldUser && updatedUser.totalPoints > oldUser.totalPoints) {
            setTicker(`☕ ${updatedUser.name} just scored points! Now at ${updatedUser.totalPoints} pts`);
            setTimeout(() => setTicker(null), 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Live Ticker Banner */}
      <AnimatePresence>
        {ticker && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold text-center flex items-center justify-center gap-2 glow-bronze"
          >
            <Zap className="w-4 h-4 animate-bounce fill-amber-400" />
            {ticker}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard Table Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-2xl relative overflow-hidden">
        
        {/* Header decoration */}
        <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none -z-10" />

        <div className="flex items-center justify-between border-b border-stone-850 pb-5 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-stone-100 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-500 animate-pulse" /> Café Leaderboard
          </h2>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Real-time active
          </span>
        </div>

        {/* Column labels */}
        <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-extrabold text-stone-500 uppercase tracking-widest border-b border-stone-850/50">
          <div className="col-span-2">Rank</div>
          <div className="col-span-7">Player</div>
          <div className="col-span-3 text-right">Points</div>
        </div>

        {/* Rows with layout animation */}
        <div className="flex flex-col gap-2 mt-4">
          <AnimatePresence initial={false}>
            {users.map((user) => {
              const isTop3 = user.rank <= 3;
              const isFirst = user.rank === 1;

              return (
                <motion.div
                  key={user.id}
                  layout
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className={`grid grid-cols-12 items-center px-4 py-3.5 rounded-xl border transition-all ${
                    isFirst
                      ? "bg-amber-950/20 border-amber-500/30 shadow-md shadow-amber-500/5 glow-bronze"
                      : isTop3
                      ? "bg-stone-900/40 border-stone-800"
                      : "bg-stone-950/20 border-stone-900"
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className={`font-extrabold text-sm ${
                      isFirst
                        ? "text-amber-400"
                        : user.rank === 2
                        ? "text-stone-300"
                        : user.rank === 3
                        ? "text-amber-700"
                        : "text-stone-500"
                    }`}>
                      {user.rank}
                    </span>
                    {isFirst && <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/10" />}
                  </div>

                  {/* Player info */}
                  <div className="col-span-7 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-stone-500" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-stone-200 line-clamp-1">{user.name}</span>
                  </div>

                  {/* Points */}
                  <div className="col-span-3 text-right">
                    <span className="font-extrabold text-sm text-stone-100">{user.totalPoints}</span>
                    <span className="text-[9px] text-stone-500 block">pts</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
