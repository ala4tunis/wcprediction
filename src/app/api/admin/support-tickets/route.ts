import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 }) };
  }

  return { user };
}

export async function DELETE(request: Request) {
  try {
    const adminCheck = await requireAdmin();
    if ("error" in adminCheck) return adminCheck.error;

    const body = await request.json();
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
    }

    await prisma.supportTicket.delete({
      where: { id: ticketId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting support ticket:", error);
    return NextResponse.json({ error: "Failed to delete support ticket" }, { status: 500 });
  }
}
