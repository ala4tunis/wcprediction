import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

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
    const { matchId, locked } = body;

    if (!matchId || locked === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update match status to lock/unlock predictions
    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: locked ? "LOCKED" : "NS",
      },
    });

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("Error locking/unlocking predictions:", error);
    return NextResponse.json({ error: "Failed to lock/unlock predictions" }, { status: 500 });
  }
}
