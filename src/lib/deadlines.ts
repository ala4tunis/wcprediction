import { isBefore } from "date-fns";
import { prisma } from "./db";

/**
 * Check if a match prediction is still editable.
 * Match predictions lock at the kickoff time of the match.
 */
export async function isMatchPredictionOpen(matchId: number): Promise<boolean> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { kickoffTime: true, status: true },
  });

  if (!match) return false;

  // If match has been manually locked, is live, or finished, prediction is closed
  if (match.status === "LOCKED" || match.status === "FT" || match.status === "LIVE") {
    return false;
  }

  // Enforce locking 5 minutes before kickoff
  const lockTime = new Date(match.kickoffTime.getTime() - 5 * 60 * 1000);
  return isBefore(new Date(), lockTime);
}

/**
 * Check if a group prediction is still editable.
 * Group predictions lock at the kickoff of the first match in that group.
 */
export async function isGroupPredictionOpen(groupName: string): Promise<boolean> {
  const firstMatch = await prisma.match.findFirst({
    where: { groupName },
    orderBy: { kickoffTime: "asc" },
    select: { kickoffTime: true },
  });

  if (!firstMatch) return true; // If no matches, keep open for safety

  return isBefore(new Date(), firstMatch.kickoffTime);
}

/**
 * Check if the overall tournament prediction is open.
 * Overall predictions lock on June 28, 2026 at 7 AM UTC.
 */
export async function isTournamentPredictionOpen(): Promise<boolean> {
  const deadline = new Date("2026-06-28T07:00:00Z");
  return isBefore(new Date(), deadline);
}

/**
 * Get deadline date for finalists prediction rounds (R1, R2, R3).
 * - "R1": Locked before Round 2 of group stage starts.
 * - "R2": Locked before Round 3 of group stage starts.
 * - "R3": Locked before Knockout stages start (Round of 16).
 */
export async function getFinalistsDeadline(roundType: "R1" | "R2" | "R3"): Promise<Date> {
  if (roundType === "R1") {
    // Find the first match of Round 2.
    // In a typical World Cup, group matches are divided into round 1, 2, 3.
    // If we assume fixtures are ordered by kickoff time, we can fetch matches and identify round ranges.
    // Alternatively, we can base it on a specific match sequence index or configured dates in env.
    // Let's programmatically define it:
    // Round 2 typically starts on day 5 of the tournament.
    // Let's find the first match where the stage is "Group Stage" and it is after the first 16 matches (Round 1 matches of 8 groups = 16 matches).
    const matches = await prisma.match.findMany({
      where: { stage: "Group Stage" },
      orderBy: { kickoffTime: "asc" },
      select: { kickoffTime: true },
    });

    if (matches.length > 16) {
      return matches[16].kickoffTime; // Start of match 17 is start of Round 2
    }
    // Fallback if schema doesn't have 16+ matches yet (dev mode)
    return new Date(Date.now() + 24 * 60 * 60 * 1000 * 3); // 3 days from now
  }

  if (roundType === "R2") {
    const matches = await prisma.match.findMany({
      where: { stage: "Group Stage" },
      orderBy: { kickoffTime: "asc" },
      select: { kickoffTime: true },
    });

    if (matches.length > 32) {
      return matches[32].kickoffTime; // Start of match 33 is start of Round 3
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000 * 6); // 6 days from now
  }

  if (roundType === "R3") {
    // Find the first match of the Knockout stage (Round of 16)
    const firstKnockout = await prisma.match.findFirst({
      where: {
        stage: {
          in: ["Round of 16", "1/8 Final", "Knockout Stage"],
        },
      },
      orderBy: { kickoffTime: "asc" },
      select: { kickoffTime: true },
    });

    if (firstKnockout) {
      return firstKnockout.kickoffTime;
    }

    // Default fallback: first match that is not Group Stage
    const nonGroupMatch = await prisma.match.findFirst({
      where: {
        NOT: { stage: "Group Stage" },
      },
      orderBy: { kickoffTime: "asc" },
      select: { kickoffTime: true },
    });

    if (nonGroupMatch) return nonGroupMatch.kickoffTime;

    return new Date(Date.now() + 24 * 60 * 60 * 1000 * 9); // 9 days from now
  }

  throw new Error("Invalid roundType");
}

/**
 * Check if a finalists prediction is still open for a specific round.
 */
export async function isFinalistsPredictionOpen(roundType: "R1" | "R2" | "R3"): Promise<boolean> {
  const deadline = await getFinalistsDeadline(roundType);
  return isBefore(new Date(), deadline);
}
