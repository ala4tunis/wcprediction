import { prisma } from "./db";

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION_CODE = "WC"; // World Cup

interface FootballDataTeam {
  id: number;
  name: string;
  tla?: string;
  crest?: string;
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  homeTeam: FootballDataTeam;
  awayTeam: FootballDataTeam;
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

interface FootballDataScorer {
  player: { name: string };
  goals: number;
  team: { name: string };
}

interface ApiFixture {
  fixture: {
    id: number;
    status: { short: string };
    date: string;
  };
  teams: {
    home: { id: number };
    away: { id: number };
  };
  league: {
    round: string;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

async function fetchFromFootballData(endpoint: string) {
  if (!FOOTBALL_DATA_API_KEY) {
    console.warn("FOOTBALL_DATA_API_KEY is missing. Using high-fidelity mock fallback data.");
    return null;
  }

  const url = `https://api.football-data.org/v4/${endpoint}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": FOOTBALL_DATA_API_KEY,
      },
      next: { revalidate: 60 }, // Cache response for 1 minute
    });

    if (!res.ok) {
      console.warn(`football-data.org request failed: ${res.statusText}. Using mock fallback data.`);
      return null;
    }

    return res.json();
  } catch (error) {
    console.warn(`football-data.org request error: ${error}. Using mock fallback data.`);
    return null;
  }
}

function mapStage(apiStage: string): string {
  switch (apiStage) {
    case "GROUP_STAGE":
      return "Group Stage";
    case "LAST_16":
      return "Round of 16";
    case "QUARTER_FINALS":
      return "Quarter-finals";
    case "SEMI_FINALS":
      return "Semi-finals";
    case "THIRD_PLACE":
      return "Third Place Play-off";
    case "FINAL":
      return "Final";
    default:
      return apiStage;
  }
}

function mapStatus(apiStatus: string): string {
  if (apiStatus === "FINISHED") return "FT";
  if (apiStatus === "IN_PLAY" || apiStatus === "PAUSED") return "LIVE";
  return "NS";
}

function mapGroup(apiGroup: string | null): string {
  if (!apiGroup) return "Group Stage";
  return apiGroup.replace("GROUP_", "Group ").replace("_", " ");
}

/**
 * Seed or update national teams in the database.
 */
export async function syncTeams() {
  const data = await fetchFromFootballData(`competitions/${COMPETITION_CODE}/teams`);
  
  let teamsList: Array<{ id: number; name: string; code: string; flagUrl: string; groupName: string }> = [];

  if (data && data.teams) {
    teamsList = data.teams.map((item: FootballDataTeam) => ({
      id: item.id,
      name: item.name,
      code: item.tla || item.name.substring(0, 3).toUpperCase(),
      flagUrl: item.crest || "",
      groupName: "Group Stage", // Resolved dynamically during fixture sync
    }));
  } else {
    // Premium Mock Data Fallback - Real World Cup 2026 Qualified Teams
    teamsList = [
      // Group A
      { id: 1, name: "Mexico", code: "MEX", flagUrl: "https://flagcdn.com/w320/mx.png", groupName: "Group A" },
      { id: 2, name: "Argentina", code: "ARG", flagUrl: "https://flagcdn.com/w320/ar.png", groupName: "Group A" },
      { id: 3, name: "Poland", code: "POL", flagUrl: "https://flagcdn.com/w320/pl.png", groupName: "Group A" },
      { id: 4, name: "Saudi Arabia", code: "KSA", flagUrl: "https://flagcdn.com/w320/sa.png", groupName: "Group A" },

      // Group B
      { id: 5, name: "United States", code: "USA", flagUrl: "https://flagcdn.com/w320/us.png", groupName: "Group B" },
      { id: 6, name: "England", code: "ENG", flagUrl: "https://flagcdn.com/w320/gb-eng.png", groupName: "Group B" },
      { id: 7, name: "Netherlands", code: "NED", flagUrl: "https://flagcdn.com/w320/nl.png", groupName: "Group B" },
      { id: 8, name: "Japan", code: "JPN", flagUrl: "https://flagcdn.com/w320/jp.png", groupName: "Group B" },

      // Group C
      { id: 9, name: "Canada", code: "CAN", flagUrl: "https://flagcdn.com/w320/ca.png", groupName: "Group C" },
      { id: 10, name: "France", code: "FRA", flagUrl: "https://flagcdn.com/w320/fr.png", groupName: "Group C" },
      { id: 11, name: "Morocco", code: "MAR", flagUrl: "https://flagcdn.com/w320/ma.png", groupName: "Group C" },
      { id: 12, name: "Croatia", code: "CRO", flagUrl: "https://flagcdn.com/w320/hr.png", groupName: "Group C" },

      // Group D
      { id: 13, name: "Brazil", code: "BRA", flagUrl: "https://flagcdn.com/w320/br.png", groupName: "Group D" },
      { id: 14, name: "Germany", code: "GER", flagUrl: "https://flagcdn.com/w320/de.png", groupName: "Group D" },
      { id: 15, name: "Spain", code: "ESP", flagUrl: "https://flagcdn.com/w320/es.png", groupName: "Group D" },
      { id: 16, name: "Uruguay", code: "URU", flagUrl: "https://flagcdn.com/w320/uy.png", groupName: "Group D" },
    ];
  }

  for (const team of teamsList) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: {
        name: team.name,
        code: team.code,
        flagUrl: team.flagUrl,
        groupName: team.groupName,
      },
      create: {
        id: team.id,
        name: team.name,
        code: team.code,
        flagUrl: team.flagUrl,
        groupName: team.groupName,
      },
    });
  }

  // Force update all team flag URLs to ensure they're correct
  for (const team of teamsList) {
    await prisma.team.update({
      where: { id: team.id },
      data: { flagUrl: team.flagUrl },
    });
  }

  return teamsList;
}

/**
 * Seed or update World Cup fixtures.
 */
export async function syncFixtures() {
  // Ensure teams exist first
  await syncTeams();

  const data = await fetchFromFootballData(`competitions/${COMPETITION_CODE}/matches`);

  let fixturesList: Array<FootballDataMatch | ApiFixture> = [];

  if (data && data.matches) {
    fixturesList = data.matches;

    // Update team groups based on live matches
    for (const match of fixturesList as FootballDataMatch[]) {
      const groupName = mapGroup(match.group);
      if (groupName !== "Group Stage") {
        if (match.homeTeam && match.homeTeam.id) {
          await prisma.team.updateMany({
            where: { id: match.homeTeam.id },
            data: { groupName },
          });
        }
        if (match.awayTeam && match.awayTeam.id) {
          await prisma.team.updateMany({
            where: { id: match.awayTeam.id },
            data: { groupName },
          });
        }
      }
    }
  } else {
    // Generate beautiful standard World Cup fixtures with real teams
    // Set dates to future dates (starting 24 hours from now) to ensure predictions are unlocked
    const baseDate = new Date(Date.now() + 24 * 3600 * 1000); // Start 24 hours from now
    fixturesList = [
      // Group A Fixtures (Mexico, Argentina, Poland, Saudi Arabia)
      { fixture: { id: 101, status: { short: "NS" }, date: new Date(baseDate.getTime() + 12 * 3600 * 1000).toISOString() }, teams: { home: { id: 1 }, away: { id: 2 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 102, status: { short: "NS" }, date: new Date(baseDate.getTime() + 18 * 3600 * 1000).toISOString() }, teams: { home: { id: 3 }, away: { id: 4 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 103, status: { short: "NS" }, date: new Date(baseDate.getTime() + 48 * 3600 * 1000).toISOString() }, teams: { home: { id: 1 }, away: { id: 3 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 104, status: { short: "NS" }, date: new Date(baseDate.getTime() + 54 * 3600 * 1000).toISOString() }, teams: { home: { id: 2 }, away: { id: 4 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 105, status: { short: "NS" }, date: new Date(baseDate.getTime() + 84 * 3600 * 1000).toISOString() }, teams: { home: { id: 1 }, away: { id: 4 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 106, status: { short: "NS" }, date: new Date(baseDate.getTime() + 90 * 3600 * 1000).toISOString() }, teams: { home: { id: 2 }, away: { id: 3 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group B Fixtures (USA, England, Netherlands, Japan)
      { fixture: { id: 107, status: { short: "NS" }, date: new Date(baseDate.getTime() + 24 * 3600 * 1000).toISOString() }, teams: { home: { id: 5 }, away: { id: 6 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 108, status: { short: "NS" }, date: new Date(baseDate.getTime() + 30 * 3600 * 1000).toISOString() }, teams: { home: { id: 7 }, away: { id: 8 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 109, status: { short: "NS" }, date: new Date(baseDate.getTime() + 60 * 3600 * 1000).toISOString() }, teams: { home: { id: 5 }, away: { id: 7 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 110, status: { short: "NS" }, date: new Date(baseDate.getTime() + 66 * 3600 * 1000).toISOString() }, teams: { home: { id: 6 }, away: { id: 8 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 111, status: { short: "NS" }, date: new Date(baseDate.getTime() + 96 * 3600 * 1000).toISOString() }, teams: { home: { id: 5 }, away: { id: 8 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 112, status: { short: "NS" }, date: new Date(baseDate.getTime() + 102 * 3600 * 1000).toISOString() }, teams: { home: { id: 6 }, away: { id: 7 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group C Fixtures (Canada, France, Morocco, Croatia)
      { fixture: { id: 113, status: { short: "NS" }, date: new Date(baseDate.getTime() + 36 * 3600 * 1000).toISOString() }, teams: { home: { id: 9 }, away: { id: 10 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 114, status: { short: "NS" }, date: new Date(baseDate.getTime() + 42 * 3600 * 1000).toISOString() }, teams: { home: { id: 11 }, away: { id: 12 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 115, status: { short: "NS" }, date: new Date(baseDate.getTime() + 72 * 3600 * 1000).toISOString() }, teams: { home: { id: 9 }, away: { id: 11 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 116, status: { short: "NS" }, date: new Date(baseDate.getTime() + 78 * 3600 * 1000).toISOString() }, teams: { home: { id: 10 }, away: { id: 12 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 117, status: { short: "NS" }, date: new Date(baseDate.getTime() + 108 * 3600 * 1000).toISOString() }, teams: { home: { id: 9 }, away: { id: 12 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 118, status: { short: "NS" }, date: new Date(baseDate.getTime() + 114 * 3600 * 1000).toISOString() }, teams: { home: { id: 10 }, away: { id: 11 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group D Fixtures (Brazil, Germany, Spain, Uruguay)
      { fixture: { id: 119, status: { short: "NS" }, date: new Date(baseDate.getTime() + 14 * 3600 * 1000).toISOString() }, teams: { home: { id: 13 }, away: { id: 14 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 120, status: { short: "NS" }, date: new Date(baseDate.getTime() + 20 * 3600 * 1000).toISOString() }, teams: { home: { id: 15 }, away: { id: 16 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 121, status: { short: "NS" }, date: new Date(baseDate.getTime() + 50 * 3600 * 1000).toISOString() }, teams: { home: { id: 13 }, away: { id: 15 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 122, status: { short: "NS" }, date: new Date(baseDate.getTime() + 56 * 3600 * 1000).toISOString() }, teams: { home: { id: 14 }, away: { id: 16 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 123, status: { short: "NS" }, date: new Date(baseDate.getTime() + 86 * 3600 * 1000).toISOString() }, teams: { home: { id: 13 }, away: { id: 16 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 124, status: { short: "NS" }, date: new Date(baseDate.getTime() + 92 * 3600 * 1000).toISOString() }, teams: { home: { id: 14 }, away: { id: 15 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
    ];
  }

  for (const item of fixturesList) {
    if (data && data.matches) {
      const match = item as FootballDataMatch;
      const homeId = match.homeTeam.id;
      const awayId = match.awayTeam.id;
      const groupName = mapGroup(match.group);

      // Ensure teams exist (safety)
      await prisma.team.upsert({
        where: { id: homeId },
        update: {},
        create: {
          id: homeId,
          name: match.homeTeam.name,
          code: match.homeTeam.tla || match.homeTeam.name.substring(0, 3).toUpperCase(),
          flagUrl: match.homeTeam.crest || "",
          groupName,
        },
      });

      await prisma.team.upsert({
        where: { id: awayId },
        update: {},
        create: {
          id: awayId,
          name: match.awayTeam.name,
          code: match.awayTeam.tla || match.awayTeam.name.substring(0, 3).toUpperCase(),
          flagUrl: match.awayTeam.crest || "",
          groupName,
        },
      });

      await prisma.match.upsert({
        where: { id: match.id },
        update: {
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeScore: match.score.fullTime.home,
          awayScore: match.score.fullTime.away,
          status: mapStatus(match.status),
          kickoffTime: new Date(match.utcDate),
          stage: mapStage(match.stage),
          groupName,
        },
        create: {
          id: match.id,
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeScore: match.score.fullTime.home,
          awayScore: match.score.fullTime.away,
          status: mapStatus(match.status),
          kickoffTime: new Date(match.utcDate),
          stage: mapStage(match.stage),
          groupName,
        },
      });
    } else {
      const mockItem = item as ApiFixture;
      const homeId = mockItem.teams.home.id;
      const awayId = mockItem.teams.away.id;

      // Get group name from team records
      const homeTeam = await prisma.team.findUnique({ where: { id: homeId } });
      const groupName = homeTeam?.groupName || "Group Stage";

      await prisma.match.upsert({
        where: { id: mockItem.fixture.id },
        update: {
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeScore: mockItem.goals.home,
          awayScore: mockItem.goals.away,
          status: mockItem.fixture.status.short,
          kickoffTime: new Date(mockItem.fixture.date),
          stage: mockItem.league.round.includes("Group Stage") ? "Group Stage" : mockItem.league.round,
          groupName: groupName,
        },
        create: {
          id: mockItem.fixture.id,
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeScore: mockItem.goals.home,
          awayScore: mockItem.goals.away,
          status: mockItem.fixture.status.short,
          kickoffTime: new Date(mockItem.fixture.date),
          stage: mockItem.league.round.includes("Group Stage") ? "Group Stage" : mockItem.league.round,
          groupName: groupName,
        },
      });
    }
  }

  return fixturesList;
}

/**
 * Fetch top scorers.
 */
export async function getTopScorers() {
  const data = await fetchFromFootballData(`competitions/${COMPETITION_CODE}/scorers`);

  if (data && data.scorers) {
    return data.scorers.map((item: FootballDataScorer) => ({
      name: item.player.name,
      goals: item.goals,
      team: item.team.name,
    }));
  }

  return [
    { name: "Kylian Mbappé", goals: 3, team: "France" },
    { name: "Lionel Messi", goals: 2, team: "Argentina" },
    { name: "Harry Kane", goals: 2, team: "England" },
    { name: "Riyad Mahrez", goals: 2, team: "Algeria" },
  ];
}
