import { prisma } from "./src/lib/db";

async function checkLocked() {
  console.log("=== Checking all LOCKED matches ===");
  
  const matches = await prisma.match.findMany({
    where: { status: "LOCKED" },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
    orderBy: { id: 'asc' }
  });

  console.log(`Found ${matches.length} LOCKED matches:`);
  for (const match of matches) {
    console.log(`Match ${match.id}: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.groupName})`);
  }
}

checkLocked()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
