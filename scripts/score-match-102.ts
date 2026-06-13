import { processMatchScoring } from "../src/lib/pointEngine";
import { prisma } from "../src/lib/db";

async function main() {
  console.log("=== Scoring Match 102 (Korea Republic 2 - 1 Czechia) ===");
  await processMatchScoring(102, 2, 1);
  console.log("Successfully scored Match 102 and updated leaderboard!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
