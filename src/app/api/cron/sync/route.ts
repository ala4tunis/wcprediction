import { NextResponse } from "next/server";
import { syncFixtures, getTopScorers } from "@/lib/apiFootball";
import {
  processMatchScoring,
  processGroupScoring,
  processFinalistsScoring,
  processTournamentScoring,
} from "@/lib/pointEngine";
import { prisma } from "@/lib/db";

// Next.js Route Handler configuration
export const dynamic = "force-dynamic";

/**
 * Automatically lock matches 5 minutes before kickoff.
 */
async function autoLockMatches() {
  console.log("[Auto-Lock] Checking for matches to lock...");
  
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  
  const matchesToLock = await prisma.match.findMany({
    where: {
      status: "NS",
      kickoffTime: {
        lte: fiveMinutesFromNow,
      },
    },
  });

  for (const match of matchesToLock) {
    console.log(`[Auto-Lock] Locking match ${match.id}: ${match.homeTeamId} vs ${match.awayTeamId}`);
    await prisma.match.update({
      where: { id: match.id },
      data: { status: "LOCKED" },
    });
  }

  if (matchesToLock.length > 0) {
    console.log(`[Auto-Lock] Locked ${matchesToLock.length} matches`);
  }
}

/**
 * Automatically checks and calculates points for group standings
 * when all matches in a group have been played (status: FT).
 */
async function autoScoreGroups() {
  console.log("[Auto-Scoring] Checking for completed groups...");
  
  const teams = await prisma.team.findMany({
    select: { groupName: true },
    distinct: ["groupName"],
  });

  const groupNames = teams.map((t) => t.groupName).filter(Boolean) as string[];

  for (const groupName of groupNames) {
    const groupMatches = await prisma.match.findMany({
      where: { groupName, stage: "Group Stage" },
    });

    if (groupMatches.length === 0) continue;

    // Check if all matches in this group are finished
    const allFinished = groupMatches.every((m) => m.status === "FT");
    if (allFinished) {
      console.log(`[Auto-Scoring] Group ${groupName} is fully completed. Computing standings...`);
      
      const groupTeams = await prisma.team.findMany({
        where: { groupName },
      });

      const standings: Record<number, { teamId: number; points: number; goalDiff: number; goalsFor: number }> = {};
      for (const team of groupTeams) {
        standings[team.id] = { teamId: team.id, points: 0, goalDiff: 0, goalsFor: 0 };
      }

      for (const match of groupMatches) {
        const hs = match.homeScore ?? 0;
        const as = match.awayScore ?? 0;

        if (!standings[match.homeTeamId]) standings[match.homeTeamId] = { teamId: match.homeTeamId, points: 0, goalDiff: 0, goalsFor: 0 };
        if (!standings[match.awayTeamId]) standings[match.awayTeamId] = { teamId: match.awayTeamId, points: 0, goalDiff: 0, goalsFor: 0 };

        standings[match.homeTeamId].goalsFor += hs;
        standings[match.awayTeamId].goalsFor += as;
        standings[match.homeTeamId].goalDiff += (hs - as);
        standings[match.awayTeamId].goalDiff += (as - hs);

        if (hs > as) {
          standings[match.homeTeamId].points += 3;
        } else if (hs < as) {
          standings[match.awayTeamId].points += 3;
        } else {
          standings[match.homeTeamId].points += 1;
          standings[match.awayTeamId].points += 1;
        }
      }

      const sorted = Object.values(standings).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.teamId - b.teamId;
      });

      const actualOrderedIds = sorted.map((s) => s.teamId);
      const actualQualifiedIds = actualOrderedIds.slice(0, 2);

      // Shorten Group name, e.g. "Group A" -> "A"
      const groupNameShort = groupName.replace("Group ", "");

      console.log(`[Auto-Scoring] Group ${groupName} standings:`, actualOrderedIds);
      await processGroupScoring(groupNameShort, actualQualifiedIds, actualOrderedIds);
    }
  }
}

/**
 * Automatically checks and calculates points for finalists when the final is scheduled.
 */
async function autoScoreFinalists() {
  console.log("[Auto-Scoring] Checking for finalists...");
  const finalMatch = await prisma.match.findFirst({
    where: { stage: "Final" },
  });

  if (finalMatch && finalMatch.homeTeamId && finalMatch.awayTeamId) {
    console.log(`[Auto-Scoring] Finalists determined: Team ${finalMatch.homeTeamId} and Team ${finalMatch.awayTeamId}`);
    await processFinalistsScoring([finalMatch.homeTeamId, finalMatch.awayTeamId]);
  }
}

/**
 * Automatically checks and calculates points for overall tournament awards
 * once the final match is completed (FT).
 */
async function autoScoreTournamentAwards() {
  console.log("[Auto-Scoring] Checking if tournament is complete for awards scoring...");
  const finalMatch = await prisma.match.findFirst({
    where: { stage: "Final", status: "FT" },
  });

  if (finalMatch) {
    console.log("[Auto-Scoring] Final match finished! Calculating overall tournament awards...");

    // Get Top Scorer(s)
    const scorers = await getTopScorers();
    const maxGoals = Math.max(...scorers.map((s: { goals: number }) => s.goals));
    const actualTopScorers = scorers.filter((s: { goals: number }) => s.goals === maxGoals).map((s: { name: string }) => s.name);

    // Get Top Assists and Golden Ball (using env variables or defaults)
    const goldenBallWinner = process.env.GOLDEN_BALL_WINNER || "Lionel Messi";
    const topAssistsWinner = process.env.TOP_ASSISTS_WINNER || "Kevin De Bruyne";

    const actualTopAssists = [topAssistsWinner];
    const actualGoldenBalls = [goldenBallWinner];

    await processTournamentScoring(actualTopScorers, actualTopAssists, actualGoldenBalls);
  }
}

/**
 * GET /api/cron/sync
 * Syncs fixtures, scores matches, and triggers points calculations.
 * Also supports match scoring simulation: `/api/cron/sync?simulateMatchId=101&homeScore=2&awayScore=1`
 */
export async function GET(request: Request) {
  // Verify Vercel Cron authorization header if present in production
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const simulateMatchId = searchParams.get("simulateMatchId");
    const homeScoreParam = searchParams.get("homeScore");
    const awayScoreParam = searchParams.get("awayScore");

    // 1. Simulate Match Scoring (Excellent developer utility)
    if (simulateMatchId) {
      const matchId = parseInt(simulateMatchId, 10);
      const homeScore = homeScoreParam !== null ? parseInt(homeScoreParam, 10) : 2;
      const awayScore = awayScoreParam !== null ? parseInt(awayScoreParam, 10) : 1;

      console.log(`[Simulator] Scoring match ${matchId} with score ${homeScore}-${awayScore}`);
      await processMatchScoring(matchId, homeScore, awayScore);

      // Auto score groups, finalists, and awards in simulation too!
      await autoLockMatches();
      await autoScoreGroups();
      await autoScoreFinalists();
      await autoScoreTournamentAwards();

      return NextResponse.json({
        success: true,
        message: `Simulation completed. Match ${matchId} scored as ${homeScore}-${awayScore}. Leaderboard recalculated.`,
      });
    }

    // 2. Standard Cron Sync Operation
    console.log("[Cron] Syncing fixtures from API-Football...");
    const fixtures = await syncFixtures();

    // Auto-lock matches 5 minutes before kickoff
    await autoLockMatches();

    // Find any matches that are finished (status FT) in the database but have NOT been scored yet.
    const unscoredFinishedMatches = await prisma.match.findMany({
      where: {
        status: "FT",
        homeScore: { not: null },
        awayScore: { not: null },
        matchPredictions: {
          some: {
            pointsEarned: null,
          },
        },
      },
    });

    console.log(`[Cron] Found ${unscoredFinishedMatches.length} unscored finished matches.`);
    for (const match of unscoredFinishedMatches) {
      console.log(`[Cron] Processing scoring for match ${match.id}: ${match.homeScore}-${match.awayScore}`);
      await processMatchScoring(match.id, match.homeScore!, match.awayScore!);
    }

    // Auto score groups, finalists, and awards
    await autoScoreGroups();
    await autoScoreFinalists();
    await autoScoreTournamentAwards();

    return NextResponse.json({
      success: true,
      message: "Sync and points calculations completed successfully.",
      syncedFixturesCount: fixtures.length,
      processedMatchesCount: unscoredFinishedMatches.length,
    });
  } catch (error) {
    const err = error as Error;
    console.error("[Cron Sync Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/sync
 * Secure Vercel Cron trigger
 */
export async function POST(request: Request) {
  // Verify Vercel Cron authorization header if present in production
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  return GET(request);
}
