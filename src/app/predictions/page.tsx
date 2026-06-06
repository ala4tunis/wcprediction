import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import PredictionsClient from "./PredictionsClient";

export const dynamic = "force-dynamic";

export default async function PredictionsPage() {
  const supabaseUser = await getUser();

  if (!supabaseUser) {
    redirect("/login");
  }

  // 1. Fetch matches with teams
  const matches = await prisma.match.findMany({
    orderBy: { kickoffTime: "asc" },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  // 2. Fetch all teams
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
  });

  // 3. Fetch user predictions
  const matchPreds = await prisma.matchPrediction.findMany({
    where: { userId: supabaseUser.id },
  });

  const groupPreds = await prisma.groupPrediction.findMany({
    where: { userId: supabaseUser.id },
  });

  const finalistsPreds = await prisma.finalistsPrediction.findMany({
    where: { userId: supabaseUser.id },
  });

  const tournamentPred = await prisma.tournamentPrediction.findUnique({
    where: { userId: supabaseUser.id },
  });

  // 4. Structure predictions for the client prop formats
  const matchPredictionsMap: Record<number, { homeScore: number; awayScore: number; pointsEarned: number | null }> = {};
  matchPreds.forEach((p) => {
    matchPredictionsMap[p.matchId] = {
      homeScore: p.homeScore,
      awayScore: p.awayScore,
      pointsEarned: p.pointsEarned,
    };
  });

  const groupPredictionsMap: Record<string, { qualified: number[]; ordered: number[] }> = {};
  groupPreds.forEach((p) => {
    groupPredictionsMap[p.groupName] = {
      qualified: p.qualifiedTeams.split(",").map(Number),
      ordered: p.orderedTeams.split(",").map(Number),
    };
  });

  const finalistsPredictionsMap: Record<string, { homeId: number; awayId: number }> = {};
  finalistsPreds.forEach((p) => {
    finalistsPredictionsMap[p.roundType] = {
      homeId: p.predictedHomeFinalistId,
      awayId: p.predictedAwayFinalistId,
    };
  });

  const tournamentStructured = tournamentPred
    ? {
        topScorer: tournamentPred.topScorerName || "",
        topAssists: tournamentPred.topAssistsName || "",
        goldenBall: tournamentPred.goldenBallName || "",
      }
    : null;

  const userPredictions = {
    matches: matchPredictionsMap,
    groups: groupPredictionsMap,
    finalists: finalistsPredictionsMap,
    tournament: tournamentStructured,
  };

  // Convert Date objects to strings for serialization compatibility
  const serializedMatches = matches.map((m) => ({
    ...m,
    kickoffTime: m.kickoffTime.toISOString(),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-100">Café Prediction Lounge</h1>
        <p className="text-stone-400 text-sm">
          Sip your brew and secure your scores. Double check countdowns; once kicked off, predictions lock!
        </p>
      </div>

      <PredictionsClient
        matches={serializedMatches}
        teams={teams}
        userPredictions={userPredictions}
      />
    </div>
  );
}
