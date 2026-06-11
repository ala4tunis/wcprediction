import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

type SupportTicket = {
  id: string;
  email: string;
  issueType: string;
  message: string;
  locale: string;
  userId: string | null;
  createdAt: Date;
};

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all matches with teams
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    orderBy: {
      kickoffTime: "asc",
    },
  });

  let supportTickets: SupportTicket[] = [];
  try {
    supportTickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    });
  } catch (error) {
    console.warn("SupportTicket table is not available yet:", error);
  }

  return <AdminPanel matches={matches} supportTickets={supportTickets} />;
}
