import { prisma } from "./db";

/**
 * Calculate match prediction points:
 * - Correct score: 3 points (e.g. predicted 2-1, actual 2-1)
 * - Correct result: 1 point (e.g. predicted 2-1, actual 1-0, both home wins)
 * - Wrong result: 0 points
 */
export function calculateMatchPoints(
  predHome: number,
  predAway: number,
  actHome: number,
  actAway: number
): number {
  if (predHome === actHome && predAway === actAway) {
    return 3;
  }
  
  const predResult = Math.sign(predHome - predAway);
  const actResult = Math.sign(actHome - actAway);
  
  if (predResult === actResult) {
    return 1;
  }
  
  return 0;
}

/**
 * Process match scoring:
 * 1. Fetches the finished match and all its predictions.
 * 2. Runs a transaction to award points, create ledger records, and update users.
 */
export async function processMatchScoring(matchId: number, actualHomeScore: number, actualAwayScore: number) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
    },
  });

  if (!match) throw new Error(`Match with ID ${matchId} not found`);

  // Update match score and status in db
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: actualHomeScore,
      awayScore: actualAwayScore,
      status: "FT",
    },
  });

  const predictions = await prisma.matchPrediction.findMany({
    where: { matchId },
  });

  for (const pred of predictions) {
    const points = calculateMatchPoints(
      pred.homeScore,
      pred.awayScore,
      actualHomeScore,
      actualAwayScore
    );

    // Run transaction per user to ensure reliability and auditability
    await prisma.$transaction(async (tx) => {
      // If already processed, rollback or subtract previous points first (idempotent scoring)
      const existingTx = await tx.pointTransaction.findFirst({
        where: {
          userId: pred.userId,
          referenceId: pred.id,
          reason: { startsWith: "Match prediction score" },
        },
      });

      if (existingTx) {
        // Decrement old points from User total
        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { decrement: existingTx.points } },
        });
        // Delete old transaction
        await tx.pointTransaction.delete({
          where: { id: existingTx.id },
        });
      }

      // Update prediction points
      await tx.matchPrediction.update({
        where: { id: pred.id },
        data: { pointsEarned: points },
      });

      if (points > 0) {
        // Create new PointTransaction
        await tx.pointTransaction.create({
          data: {
            userId: pred.userId,
            points: points,
            reason: `Match prediction score: ${match.homeTeam.name} vs ${match.awayTeam.name} (${actualHomeScore}-${actualAwayScore})`,
            referenceId: pred.id,
          },
        });

        // Increment User total
        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { increment: points } },
        });
      }
    });
  }

  await recalculateLeaderboardRanks();
}

/**
 * Process group predictions scoring:
 * - group qualified 2pts per team (max 4pts)
 * - correct order +3pts bonus
 */
export async function processGroupScoring(
  groupName: string,
  actualQualifiedIds: number[], // Exactly 2 team IDs
  actualOrderedIds: number[]    // Exactly 4 team IDs in finished order
) {
  const predictions = await prisma.groupPrediction.findMany({
    where: { groupName },
  });

  for (const pred of predictions) {
    const predQualified = pred.qualifiedTeams.split(",").map(Number);
    const predOrdered = pred.orderedTeams.split(",").map(Number);

    // Calculate qualification points: +2 points per correct team
    let points = 0;
    predQualified.forEach((teamId) => {
      if (actualQualifiedIds.includes(teamId)) {
        points += 2;
      }
    });

    // Calculate order points: +3 points if top 2 order matches exactly
    const orderCorrect =
      predOrdered.length >= 2 &&
      actualOrderedIds.length >= 2 &&
      predOrdered[0] === actualOrderedIds[0] &&
      predOrdered[1] === actualOrderedIds[1];

    if (orderCorrect) {
      points += 3;
    }

    await prisma.$transaction(async (tx) => {
      const existingTx = await tx.pointTransaction.findFirst({
        where: {
          userId: pred.userId,
          referenceId: pred.id,
          reason: { startsWith: "Group qualified & order" },
        },
      });

      if (existingTx) {
        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { decrement: existingTx.points } },
        });
        await tx.pointTransaction.delete({
          where: { id: existingTx.id },
        });
      }

      await tx.groupPrediction.update({
        where: { id: pred.id },
        data: { pointsEarned: points },
      });

      if (points > 0) {
        await tx.pointTransaction.create({
          data: {
            userId: pred.userId,
            points: points,
            reason: `Group qualified & order: Group ${groupName}`,
            referenceId: pred.id,
          },
        });

        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { increment: points } },
        });
      }
    });
  }

  await recalculateLeaderboardRanks();
}

/**
 * Process Finalists Prediction scoring at the end of the tournament:
 * - Predict both finalists:
 *   - R1: +15 points
 *   - R2: +13 points
 *   - R3: +11 points
 */
export async function processFinalistsScoring(actualFinalistIds: number[]) {
  if (actualFinalistIds.length < 2) {
    throw new Error("Must provide exactly two actual finalist team IDs.");
  }

  const predictions = await prisma.finalistsPrediction.findMany();

  for (const pred of predictions) {
    const predTeams = [pred.predictedHomeFinalistId, pred.predictedAwayFinalistId];
    
    // Check if both predicted finalists made it to the final
    const matchesBoth =
      actualFinalistIds.includes(predTeams[0]) &&
      actualFinalistIds.includes(predTeams[1]);

    let points = 0;
    if (matchesBoth) {
      if (pred.roundType === "R1") points = 15;
      else if (pred.roundType === "R2") points = 13;
      else if (pred.roundType === "R3") points = 11;
    }

    await prisma.$transaction(async (tx) => {
      const existingTx = await tx.pointTransaction.findFirst({
        where: {
          userId: pred.userId,
          referenceId: pred.id,
          reason: { startsWith: "Finalists Prediction" },
        },
      });

      if (existingTx) {
        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { decrement: existingTx.points } },
        });
        await tx.pointTransaction.delete({
          where: { id: existingTx.id },
        });
      }

      await tx.finalistsPrediction.update({
        where: { id: pred.id },
        data: { pointsEarned: points },
      });

      if (points > 0) {
        await tx.pointTransaction.create({
          data: {
            userId: pred.userId,
            points: points,
            reason: `Finalists Prediction correct (${pred.roundType})`,
            referenceId: pred.id,
          },
        });

        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { increment: points } },
        });
      }
    });
  }

  await recalculateLeaderboardRanks();
}

/**
 * Process Tournament Overall predictions scoring at the end of the tournament:
 * - Golden Ball: +15 points
 * - Top Scorer: +8 points
 * - Top Assists: +6 points
 */
export async function processTournamentScoring(
  actualTopScorers: string[],
  actualTopAssists: string[],
  actualGoldenBalls: string[]
) {
  const predictions = await prisma.tournamentPrediction.findMany();

  // Normalize names for fuzzy comparison
  const normalize = (s: string) => s.toLowerCase().trim();

  for (const pred of predictions) {
    let pointsScorer = 0;
    let pointsAssists = 0;
    let pointsGolden = 0;

    if (pred.topScorerName && actualTopScorers.map(normalize).includes(normalize(pred.topScorerName))) {
      pointsScorer = 8;
    }
    if (pred.topAssistsName && actualTopAssists.map(normalize).includes(normalize(pred.topAssistsName))) {
      pointsAssists = 6;
    }
    if (pred.goldenBallName && actualGoldenBalls.map(normalize).includes(normalize(pred.goldenBallName))) {
      pointsGolden = 15;
    }

    const totalPoints = pointsScorer + pointsAssists + pointsGolden;

    await prisma.$transaction(async (tx) => {
      const existingTx = await tx.pointTransaction.findFirst({
        where: {
          userId: pred.userId,
          referenceId: pred.id,
          reason: { startsWith: "Tournament Overall Awards" },
        },
      });

      if (existingTx) {
        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { decrement: existingTx.points } },
        });
        await tx.pointTransaction.delete({
          where: { id: existingTx.id },
        });
      }

      await tx.tournamentPrediction.update({
        where: { id: pred.id },
        data: {
          pointsEarnedScorer: pointsScorer,
          pointsEarnedAssists: pointsAssists,
          pointsEarnedGolden: pointsGolden,
        },
      });

      if (totalPoints > 0) {
        await tx.pointTransaction.create({
          data: {
            userId: pred.userId,
            points: totalPoints,
            reason: `Tournament Overall Awards: Scorer(${pointsScorer}) Assists(${pointsAssists}) GoldenBall(${pointsGolden})`,
            referenceId: pred.id,
          },
        });

        await tx.user.update({
          where: { id: pred.userId },
          data: { totalPoints: { increment: totalPoints } },
        });
      }
    });
  }

  await recalculateLeaderboardRanks();
}

/**
 * Re-calculate ranks for all users based on total points.
 * Users with the same points get the same rank, next user skips intermediate ranks (standard ranking).
 */
export async function recalculateLeaderboardRanks() {
  const users = await prisma.user.findMany({
    orderBy: { totalPoints: "desc" },
  });

  let currentRank = 1;
  let skipped = 0;
  
  for (let i = 0; i < users.length; i++) {
    if (i > 0) {
      if (users[i].totalPoints < users[i - 1].totalPoints) {
        currentRank = currentRank + skipped + 1;
        skipped = 0;
      } else {
        skipped++;
      }
    }

    if (users[i].rank !== currentRank) {
      await prisma.user.update({
        where: { id: users[i].id },
        data: { rank: currentRank },
      });
    }
  }
}
