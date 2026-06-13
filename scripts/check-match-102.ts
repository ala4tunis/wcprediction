import { prisma } from "../src/lib/db";

async function main() {
  const match = await prisma.match.findUnique({
    where: { id: 102 },
    include: {
      homeTeam: true,
      awayTeam: true,
      matchPredictions: {
        include: {
          user: true
        }
      }
    }
  });

  console.log("=== MATCH 102 DETAILS ===");
  console.log(JSON.stringify(match, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
