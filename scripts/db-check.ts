import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== DB CHECK USER ===");
  const users = await prisma.user.findMany();
  console.log("Total users:", users.length);
  for (const user of users) {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
  }

  console.log("\n=== DB CHECK MATCHES ===");
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
    },
    take: 15,
  });
  console.log("Total matches in DB:", await prisma.match.count());
  for (const match of matches) {
    console.log(`- Match ID: ${match.id}, ${match.homeTeam.name} vs ${match.awayTeam.name}, Status: ${match.status}, Stage: ${match.stage}, Kickoff: ${match.kickoffTime}`);
  }

  console.log("\n=== DB CHECK TEAMS ===");
  const teams = await prisma.team.findMany({ take: 5 });
  console.log("Total teams in DB:", await prisma.team.count());
  for (const team of teams) {
    console.log(`- Team ID: ${team.id}, Name: ${team.name}, Group: ${team.groupName}`);
  }
}

main()

  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
