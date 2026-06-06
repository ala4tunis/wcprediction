import { prisma } from "../src/lib/db";
import { syncTeams, syncFixtures } from "../src/lib/apiFootball";

async function main() {
  console.log("🌱 Starting database seed...");

  try {
    // Sync teams first
    console.log("📋 Syncing teams...");
    const teams = await syncTeams();
    console.log(`✅ Synced ${teams.length} teams`);

    // Sync fixtures
    console.log("📋 Syncing fixtures...");
    const fixtures = await syncFixtures();
    console.log(`✅ Synced ${fixtures.length} fixtures`);

    console.log("🎉 Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
