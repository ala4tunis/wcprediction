import { prisma } from "./src/lib/db";

async function checkGroupD() {
  console.log("=== Checking Group D matches ===");
  
  const matches = await prisma.match.findMany({
    where: { groupName: "Group D" },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: { id: 'asc' }
  });

  for (const match of matches) {
    console.log(`Match ${match.id}: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    console.log(`  Status: ${match.status}, Score: ${match.homeScore}-${match.awayScore}`);
  }
}

checkGroupD()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
