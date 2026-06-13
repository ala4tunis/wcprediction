import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { processMatchScoring } from "@/lib/pointEngine";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { matchId, homeScore, awayScore } = body;

    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update match first
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        status: "FT",
      },
    });

    console.log(`[Admin API] Match ${matchId} updated to ${homeScore}-${awayScore} FT`);

    // Then process scoring
    await processMatchScoring(matchId, homeScore, awayScore);

    console.log(`[Admin API] Scoring completed for match ${matchId}`);

    return NextResponse.json({ success: true, match, message: "Match saved and points awarded" });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
}
