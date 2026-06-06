import { prisma } from "@/lib/db";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Query all users ordered by total points
  const users = await prisma.user.findMany({
    orderBy: [
      { totalPoints: "desc" },
      { name: "asc" },
    ],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-100">Café Leaderboard</h1>
        <p className="text-stone-400 text-sm">
          Watch the ranks shift live! Rankings update instantly when players score points.
        </p>
      </div>

      <LeaderboardClient initialUsers={users} />
    </div>
  );
}
