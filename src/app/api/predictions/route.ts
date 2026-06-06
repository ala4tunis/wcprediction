import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import {
  isMatchPredictionOpen,
  isGroupPredictionOpen,
  isFinalistsPredictionOpen,
  isTournamentPredictionOpen,
} from "@/lib/deadlines";

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type } = body;

    // 1. MATCH PREDICTIONS SAVE
    if (type === "match") {
      const { matchId, homeScore, awayScore } = body;
      const parsedMatchId = parseInt(matchId, 10);
      const parsedHomeScore = parseInt(homeScore, 10);
      const parsedAwayScore = parseInt(awayScore, 10);

      if (isNaN(parsedMatchId) || isNaN(parsedHomeScore) || isNaN(parsedAwayScore)) {
        return NextResponse.json({ success: false, error: "Invalid score data" }, { status: 400 });
      }

      // Check Match Kickoff Deadline
      const isOpen = await isMatchPredictionOpen(parsedMatchId);
      if (!isOpen) {
        return NextResponse.json({ success: false, error: "Prediction window is closed for this match" }, { status: 400 });
      }

      const prediction = await prisma.matchPrediction.upsert({
        where: {
          userId_matchId: {
            userId: user.id,
            matchId: parsedMatchId,
          },
        },
        update: {
          homeScore: parsedHomeScore,
          awayScore: parsedAwayScore,
        },
        create: {
          userId: user.id,
          matchId: parsedMatchId,
          homeScore: parsedHomeScore,
          awayScore: parsedAwayScore,
        },
      });

      return NextResponse.json({ success: true, data: prediction });
    }

    // 2. GROUP PREDICTIONS SAVE
    if (type === "group") {
      const { groupName, qualifiedTeams, orderedTeams } = body; // comma separated team IDs

      if (!groupName || !qualifiedTeams || !orderedTeams) {
        return NextResponse.json({ success: false, error: "Missing group data" }, { status: 400 });
      }

      // Check Group Stage Kickoff Deadline
      const isOpen = await isGroupPredictionOpen(groupName);
      if (!isOpen) {
        return NextResponse.json({ success: false, error: `Group ${groupName} predictions are locked!` }, { status: 400 });
      }

      const prediction = await prisma.groupPrediction.upsert({
        where: {
          userId_groupName: {
            userId: user.id,
            groupName,
          },
        },
        update: {
          qualifiedTeams,
          orderedTeams,
        },
        create: {
          userId: user.id,
          groupName,
          qualifiedTeams,
          orderedTeams,
        },
      });

      return NextResponse.json({ success: true, data: prediction });
    }

    // 3. FINALISTS PREDICTIONS SAVE
    if (type === "finalists") {
      const { homeFinalistId, awayFinalistId, roundType } = body;
      const parsedHome = parseInt(homeFinalistId, 10);
      const parsedAway = parseInt(awayFinalistId, 10);

      if (isNaN(parsedHome) || isNaN(parsedAway) || !roundType) {
        return NextResponse.json({ success: false, error: "Invalid finalists data" }, { status: 400 });
      }

      // Check Round Deadline (R1, R2, R3)
      const isOpen = await isFinalistsPredictionOpen(roundType);
      if (!isOpen) {
        return NextResponse.json({ success: false, error: `Prediction lock: ${roundType} window has closed!` }, { status: 400 });
      }

      const prediction = await prisma.finalistsPrediction.upsert({
        where: {
          userId_roundType: {
            userId: user.id,
            roundType,
          },
        },
        update: {
          predictedHomeFinalistId: parsedHome,
          predictedAwayFinalistId: parsedAway,
        },
        create: {
          userId: user.id,
          predictedHomeFinalistId: parsedHome,
          predictedAwayFinalistId: parsedAway,
          roundType,
        },
      });

      return NextResponse.json({ success: true, data: prediction });
    }

    // 4. TOURNAMENT OVERALL AWARDS SAVE
    if (type === "tournament") {
      const { topScorerName, topAssistsName, goldenBallName } = body;

      // Check Tournament kickoff deadline
      const isOpen = await isTournamentPredictionOpen();
      if (!isOpen) {
        return NextResponse.json({ success: false, error: "Tournament kickoff passed. Predictions locked!" }, { status: 400 });
      }

      const prediction = await prisma.tournamentPrediction.upsert({
        where: { userId: user.id },
        update: {
          topScorerName,
          topAssistsName,
          goldenBallName,
        },
        create: {
          userId: user.id,
          topScorerName,
          topAssistsName,
          goldenBallName,
        },
      });

      return NextResponse.json({ success: true, data: prediction });
    }

    return NextResponse.json({ success: false, error: "Invalid prediction type" }, { status: 400 });
  } catch (error) {
    const err = error as Error;
    console.error("[Prediction API Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Server Error" }, { status: 500 });
  }
}
