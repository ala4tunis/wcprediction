import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.message || !body?.email || !body?.issueType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      email: body.email,
      issueType: body.issueType,
      message: body.message,
      locale: body.locale || "en",
      userId: body.userId || null,
    },
  });

  return NextResponse.json({ ticketId: ticket.id });
}
