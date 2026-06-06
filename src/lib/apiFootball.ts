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
      // Group A: Mexico, South Africa, Korea Republic, Czechia
      { id: 1, name: "Mexico", code: "MEX", flagUrl: "https://flagcdn.com/w320/mx.png", groupName: "Group A" },
      { id: 2, name: "South Africa", code: "RSA", flagUrl: "https://flagcdn.com/w320/za.png", groupName: "Group A" },
      { id: 3, name: "Korea Republic", code: "KOR", flagUrl: "https://flagcdn.com/w320/kr.png", groupName: "Group A" },
      { id: 4, name: "Czechia", code: "CZE", flagUrl: "https://flagcdn.com/w320/cz.png", groupName: "Group A" },

      // Group B: Canada, Bosnia and Herzegovina, Qatar, Switzerland
      { id: 5, name: "Canada", code: "CAN", flagUrl: "https://flagcdn.com/w320/ca.png", groupName: "Group B" },
      { id: 6, name: "Bosnia and Herzegovina", code: "BIH", flagUrl: "https://flagcdn.com/w320/ba.png", groupName: "Group B" },
      { id: 7, name: "Qatar", code: "QAT", flagUrl: "https://flagcdn.com/w320/qa.png", groupName: "Group B" },
      { id: 8, name: "Switzerland", code: "SUI", flagUrl: "https://flagcdn.com/w320/ch.png", groupName: "Group B" },

      // Group C: Brazil, Morocco, Haiti, Scotland
      { id: 9, name: "Brazil", code: "BRA", flagUrl: "https://flagcdn.com/w320/br.png", groupName: "Group C" },
      { id: 10, name: "Morocco", code: "MAR", flagUrl: "https://flagcdn.com/w320/ma.png", groupName: "Group C" },
      { id: 11, name: "Haiti", code: "HTI", flagUrl: "https://flagcdn.com/w320/ht.png", groupName: "Group C" },
      { id: 12, name: "Scotland", code: "SCO", flagUrl: "https://flagcdn.com/w320/gb-sct.png", groupName: "Group C" },

      // Group D: United States, Paraguay, Australia, Türkiye
      { id: 13, name: "United States", code: "USA", flagUrl: "https://flagcdn.com/w320/us.png", groupName: "Group D" },
      { id: 14, name: "Paraguay", code: "PAR", flagUrl: "https://flagcdn.com/w320/py.png", groupName: "Group D" },
      { id: 15, name: "Australia", code: "AUS", flagUrl: "https://flagcdn.com/w320/au.png", groupName: "Group D" },
      { id: 16, name: "Türkiye", code: "TUR", flagUrl: "https://flagcdn.com/w320/tr.png", groupName: "Group D" },

      // Group E: Germany, Curaçao, Ivory Coast, Ecuador
      { id: 17, name: "Germany", code: "GER", flagUrl: "https://flagcdn.com/w320/de.png", groupName: "Group E" },
      { id: 18, name: "Curaçao", code: "CUW", flagUrl: "https://flagcdn.com/w320/cw.png", groupName: "Group E" },
      { id: 19, name: "Ivory Coast", code: "CIV", flagUrl: "https://flagcdn.com/w320/ci.png", groupName: "Group E" },
      { id: 20, name: "Ecuador", code: "ECU", flagUrl: "https://flagcdn.com/w320/ec.png", groupName: "Group E" },

      // Group F: Netherlands, Japan, Sweden, Tunisia
      { id: 21, name: "Netherlands", code: "NED", flagUrl: "https://flagcdn.com/w320/nl.png", groupName: "Group F" },
      { id: 22, name: "Japan", code: "JPN", flagUrl: "https://flagcdn.com/w320/jp.png", groupName: "Group F" },
      { id: 23, name: "Sweden", code: "SWE", flagUrl: "https://flagcdn.com/w320/se.png", groupName: "Group F" },
      { id: 24, name: "Tunisia", code: "TUN", flagUrl: "https://flagcdn.com/w320/tn.png", groupName: "Group F" },

      // Group G: Belgium, Egypt, Iran, New Zealand
      { id: 25, name: "Belgium", code: "BEL", flagUrl: "https://flagcdn.com/w320/be.png", groupName: "Group G" },
      { id: 26, name: "Egypt", code: "EGY", flagUrl: "https://flagcdn.com/w320/eg.png", groupName: "Group G" },
      { id: 27, name: "Iran", code: "IRN", flagUrl: "https://flagcdn.com/w320/ir.png", groupName: "Group G" },
      { id: 28, name: "New Zealand", code: "NZL", flagUrl: "https://flagcdn.com/w320/nz.png", groupName: "Group G" },

      // Group H: Spain, Cape Verde, Saudi Arabia, Uruguay
      { id: 29, name: "Spain", code: "ESP", flagUrl: "https://flagcdn.com/w320/es.png", groupName: "Group H" },
      { id: 30, name: "Cape Verde", code: "CPV", flagUrl: "https://flagcdn.com/w320/cv.png", groupName: "Group H" },
      { id: 31, name: "Saudi Arabia", code: "KSA", flagUrl: "https://flagcdn.com/w320/sa.png", groupName: "Group H" },
      { id: 32, name: "Uruguay", code: "URU", flagUrl: "https://flagcdn.com/w320/uy.png", groupName: "Group H" },

      // Group I: France, Senegal, Iraq, Norway
      { id: 33, name: "France", code: "FRA", flagUrl: "https://flagcdn.com/w320/fr.png", groupName: "Group I" },
      { id: 34, name: "Senegal", code: "SEN", flagUrl: "https://flagcdn.com/w320/sn.png", groupName: "Group I" },
      { id: 35, name: "Iraq", code: "IRQ", flagUrl: "https://flagcdn.com/w320/iq.png", groupName: "Group I" },
      { id: 36, name: "Norway", code: "NOR", flagUrl: "https://flagcdn.com/w320/no.png", groupName: "Group I" },

      // Group J: Argentina, Algeria, Austria, Jordan
      { id: 37, name: "Argentina", code: "ARG", flagUrl: "https://flagcdn.com/w320/ar.png", groupName: "Group J" },
      { id: 38, name: "Algeria", code: "DZA", flagUrl: "https://flagcdn.com/w320/dz.png", groupName: "Group J" },
      { id: 39, name: "Austria", code: "AUT", flagUrl: "https://flagcdn.com/w320/at.png", groupName: "Group J" },
      { id: 40, name: "Jordan", code: "JOR", flagUrl: "https://flagcdn.com/w320/jo.png", groupName: "Group J" },

      // Group K: Portugal, DR Congo, Uzbekistan, Colombia
      { id: 41, name: "Portugal", code: "POR", flagUrl: "https://flagcdn.com/w320/pt.png", groupName: "Group K" },
      { id: 42, name: "DR Congo", code: "COD", flagUrl: "https://flagcdn.com/w320/cd.png", groupName: "Group K" },
      { id: 43, name: "Uzbekistan", code: "UZB", flagUrl: "https://flagcdn.com/w320/uz.png", groupName: "Group K" },
      { id: 44, name: "Colombia", code: "COL", flagUrl: "https://flagcdn.com/w320/co.png", groupName: "Group K" },

      // Group L: England, Croatia, Ghana, Panama
      { id: 45, name: "England", code: "ENG", flagUrl: "https://flagcdn.com/w320/gb-eng.png", groupName: "Group L" },
      { id: 46, name: "Croatia", code: "CRO", flagUrl: "https://flagcdn.com/w320/hr.png", groupName: "Group L" },
      { id: 47, name: "Ghana", code: "GHA", flagUrl: "https://flagcdn.com/w320/gh.png", groupName: "Group L" },
      { id: 48, name: "Panama", code: "PAN", flagUrl: "https://flagcdn.com/w320/pa.png", groupName: "Group L" },
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
    // World Cup 2026 fixtures with actual dates (June 11-27, 2026)
    // All times in Eastern Time (ET)
    fixturesList = [
      // Group A: Mexico, South Africa, Korea Republic, Czechia
      { fixture: { id: 101, status: { short: "NS" }, date: "2026-06-11T15:00:00-04:00" }, teams: { home: { id: 1 }, away: { id: 2 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 102, status: { short: "NS" }, date: "2026-06-11T22:00:00-04:00" }, teams: { home: { id: 3 }, away: { id: 4 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 103, status: { short: "NS" }, date: "2026-06-18T12:00:00-04:00" }, teams: { home: { id: 4 }, away: { id: 2 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 104, status: { short: "NS" }, date: "2026-06-18T21:00:00-04:00" }, teams: { home: { id: 1 }, away: { id: 3 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 105, status: { short: "NS" }, date: "2026-06-24T21:00:00-04:00" }, teams: { home: { id: 4 }, away: { id: 1 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 106, status: { short: "NS" }, date: "2026-06-24T21:00:00-04:00" }, teams: { home: { id: 2 }, away: { id: 3 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group B: Canada, Bosnia and Herzegovina, Qatar, Switzerland
      { fixture: { id: 107, status: { short: "NS" }, date: "2026-06-12T15:00:00-04:00" }, teams: { home: { id: 5 }, away: { id: 6 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 108, status: { short: "NS" }, date: "2026-06-13T15:00:00-04:00" }, teams: { home: { id: 7 }, away: { id: 8 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 109, status: { short: "NS" }, date: "2026-06-18T15:00:00-04:00" }, teams: { home: { id: 8 }, away: { id: 6 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 110, status: { short: "NS" }, date: "2026-06-18T18:00:00-04:00" }, teams: { home: { id: 5 }, away: { id: 7 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 111, status: { short: "NS" }, date: "2026-06-24T15:00:00-04:00" }, teams: { home: { id: 8 }, away: { id: 5 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 112, status: { short: "NS" }, date: "2026-06-24T15:00:00-04:00" }, teams: { home: { id: 6 }, away: { id: 7 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group C: Brazil, Morocco, Haiti, Scotland
      { fixture: { id: 113, status: { short: "NS" }, date: "2026-06-13T18:00:00-04:00" }, teams: { home: { id: 9 }, away: { id: 10 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 114, status: { short: "NS" }, date: "2026-06-13T21:00:00-04:00" }, teams: { home: { id: 11 }, away: { id: 12 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 115, status: { short: "NS" }, date: "2026-06-19T18:00:00-04:00" }, teams: { home: { id: 12 }, away: { id: 10 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 116, status: { short: "NS" }, date: "2026-06-19T20:30:00-04:00" }, teams: { home: { id: 9 }, away: { id: 11 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 117, status: { short: "NS" }, date: "2026-06-24T18:00:00-04:00" }, teams: { home: { id: 12 }, away: { id: 9 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 118, status: { short: "NS" }, date: "2026-06-24T18:00:00-04:00" }, teams: { home: { id: 10 }, away: { id: 11 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group D: United States, Paraguay, Australia, Türkiye
      { fixture: { id: 119, status: { short: "NS" }, date: "2026-06-12T21:00:00-04:00" }, teams: { home: { id: 13 }, away: { id: 14 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 120, status: { short: "NS" }, date: "2026-06-13T00:00:00-04:00" }, teams: { home: { id: 15 }, away: { id: 16 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 121, status: { short: "NS" }, date: "2026-06-19T15:00:00-04:00" }, teams: { home: { id: 13 }, away: { id: 15 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 122, status: { short: "NS" }, date: "2026-06-19T23:00:00-04:00" }, teams: { home: { id: 16 }, away: { id: 14 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 123, status: { short: "NS" }, date: "2026-06-25T22:00:00-04:00" }, teams: { home: { id: 16 }, away: { id: 13 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 124, status: { short: "NS" }, date: "2026-06-25T22:00:00-04:00" }, teams: { home: { id: 14 }, away: { id: 15 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group E: Germany, Curaçao, Ivory Coast, Ecuador
      { fixture: { id: 125, status: { short: "NS" }, date: "2026-06-14T13:00:00-04:00" }, teams: { home: { id: 17 }, away: { id: 18 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 126, status: { short: "NS" }, date: "2026-06-14T19:00:00-04:00" }, teams: { home: { id: 19 }, away: { id: 20 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 127, status: { short: "NS" }, date: "2026-06-20T16:00:00-04:00" }, teams: { home: { id: 17 }, away: { id: 19 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 128, status: { short: "NS" }, date: "2026-06-20T20:00:00-04:00" }, teams: { home: { id: 20 }, away: { id: 18 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 129, status: { short: "NS" }, date: "2026-06-25T16:00:00-04:00" }, teams: { home: { id: 18 }, away: { id: 19 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 130, status: { short: "NS" }, date: "2026-06-25T16:00:00-04:00" }, teams: { home: { id: 20 }, away: { id: 17 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group F: Netherlands, Japan, Sweden, Tunisia
      { fixture: { id: 131, status: { short: "NS" }, date: "2026-06-14T16:00:00-04:00" }, teams: { home: { id: 21 }, away: { id: 22 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 132, status: { short: "NS" }, date: "2026-06-14T22:00:00-04:00" }, teams: { home: { id: 23 }, away: { id: 24 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 133, status: { short: "NS" }, date: "2026-06-20T13:00:00-04:00" }, teams: { home: { id: 21 }, away: { id: 23 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 134, status: { short: "NS" }, date: "2026-06-20T00:00:00-04:00" }, teams: { home: { id: 24 }, away: { id: 22 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 135, status: { short: "NS" }, date: "2026-06-25T19:00:00-04:00" }, teams: { home: { id: 22 }, away: { id: 23 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 136, status: { short: "NS" }, date: "2026-06-25T19:00:00-04:00" }, teams: { home: { id: 24 }, away: { id: 21 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group G: Belgium, Egypt, Iran, New Zealand
      { fixture: { id: 137, status: { short: "NS" }, date: "2026-06-15T15:00:00-04:00" }, teams: { home: { id: 25 }, away: { id: 26 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 138, status: { short: "NS" }, date: "2026-06-15T21:00:00-04:00" }, teams: { home: { id: 27 }, away: { id: 28 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 139, status: { short: "NS" }, date: "2026-06-21T15:00:00-04:00" }, teams: { home: { id: 25 }, away: { id: 27 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 140, status: { short: "NS" }, date: "2026-06-21T21:00:00-04:00" }, teams: { home: { id: 28 }, away: { id: 26 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 141, status: { short: "NS" }, date: "2026-06-26T23:00:00-04:00" }, teams: { home: { id: 26 }, away: { id: 27 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 142, status: { short: "NS" }, date: "2026-06-26T23:00:00-04:00" }, teams: { home: { id: 28 }, away: { id: 25 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group H: Spain, Cape Verde, Saudi Arabia, Uruguay
      { fixture: { id: 143, status: { short: "NS" }, date: "2026-06-15T12:00:00-04:00" }, teams: { home: { id: 29 }, away: { id: 30 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 144, status: { short: "NS" }, date: "2026-06-15T18:00:00-04:00" }, teams: { home: { id: 31 }, away: { id: 32 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 145, status: { short: "NS" }, date: "2026-06-21T12:00:00-04:00" }, teams: { home: { id: 29 }, away: { id: 31 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 146, status: { short: "NS" }, date: "2026-06-21T18:00:00-04:00" }, teams: { home: { id: 32 }, away: { id: 30 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 147, status: { short: "NS" }, date: "2026-06-26T20:00:00-04:00" }, teams: { home: { id: 30 }, away: { id: 31 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 148, status: { short: "NS" }, date: "2026-06-26T20:00:00-04:00" }, teams: { home: { id: 32 }, away: { id: 29 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group I: France, Senegal, Iraq, Norway
      { fixture: { id: 149, status: { short: "NS" }, date: "2026-06-16T15:00:00-04:00" }, teams: { home: { id: 33 }, away: { id: 34 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 150, status: { short: "NS" }, date: "2026-06-16T18:00:00-04:00" }, teams: { home: { id: 35 }, away: { id: 36 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 151, status: { short: "NS" }, date: "2026-06-22T17:00:00-04:00" }, teams: { home: { id: 33 }, away: { id: 35 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 152, status: { short: "NS" }, date: "2026-06-22T20:00:00-04:00" }, teams: { home: { id: 36 }, away: { id: 34 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 153, status: { short: "NS" }, date: "2026-06-26T15:00:00-04:00" }, teams: { home: { id: 36 }, away: { id: 33 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 154, status: { short: "NS" }, date: "2026-06-26T15:00:00-04:00" }, teams: { home: { id: 34 }, away: { id: 35 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group J: Argentina, Algeria, Austria, Jordan
      { fixture: { id: 155, status: { short: "NS" }, date: "2026-06-16T21:00:00-04:00" }, teams: { home: { id: 37 }, away: { id: 38 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 156, status: { short: "NS" }, date: "2026-06-17T00:00:00-04:00" }, teams: { home: { id: 39 }, away: { id: 40 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 157, status: { short: "NS" }, date: "2026-06-22T13:00:00-04:00" }, teams: { home: { id: 37 }, away: { id: 39 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 158, status: { short: "NS" }, date: "2026-06-22T23:00:00-04:00" }, teams: { home: { id: 40 }, away: { id: 38 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 159, status: { short: "NS" }, date: "2026-06-27T22:00:00-04:00" }, teams: { home: { id: 40 }, away: { id: 37 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 160, status: { short: "NS" }, date: "2026-06-27T22:00:00-04:00" }, teams: { home: { id: 38 }, away: { id: 39 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group K: Portugal, DR Congo, Uzbekistan, Colombia
      { fixture: { id: 161, status: { short: "NS" }, date: "2026-06-17T13:00:00-04:00" }, teams: { home: { id: 41 }, away: { id: 42 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 162, status: { short: "NS" }, date: "2026-06-17T22:00:00-04:00" }, teams: { home: { id: 43 }, away: { id: 44 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 163, status: { short: "NS" }, date: "2026-06-23T13:00:00-04:00" }, teams: { home: { id: 41 }, away: { id: 43 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 164, status: { short: "NS" }, date: "2026-06-23T22:00:00-04:00" }, teams: { home: { id: 44 }, away: { id: 42 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 165, status: { short: "NS" }, date: "2026-06-27T19:30:00-04:00" }, teams: { home: { id: 44 }, away: { id: 41 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 166, status: { short: "NS" }, date: "2026-06-27T19:30:00-04:00" }, teams: { home: { id: 42 }, away: { id: 43 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },

      // Group L: England, Croatia, Ghana, Panama
      { fixture: { id: 167, status: { short: "NS" }, date: "2026-06-17T16:00:00-04:00" }, teams: { home: { id: 45 }, away: { id: 46 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 168, status: { short: "NS" }, date: "2026-06-17T19:00:00-04:00" }, teams: { home: { id: 47 }, away: { id: 48 } }, league: { round: "Group Stage - 1" }, goals: { home: null, away: null } },
      { fixture: { id: 169, status: { short: "NS" }, date: "2026-06-23T16:00:00-04:00" }, teams: { home: { id: 45 }, away: { id: 47 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 170, status: { short: "NS" }, date: "2026-06-23T19:00:00-04:00" }, teams: { home: { id: 48 }, away: { id: 46 } }, league: { round: "Group Stage - 2" }, goals: { home: null, away: null } },
      { fixture: { id: 171, status: { short: "NS" }, date: "2026-06-27T17:00:00-04:00" }, teams: { home: { id: 48 }, away: { id: 45 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
      { fixture: { id: 172, status: { short: "NS" }, date: "2026-06-27T17:00:00-04:00" }, teams: { home: { id: 46 }, away: { id: 47 } }, league: { round: "Group Stage - 3" }, goals: { home: null, away: null } },
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
