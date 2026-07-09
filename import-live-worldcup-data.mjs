import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const provider = String(process.env.WC2026_PROVIDER ?? "feed").toLowerCase();
const bearerToken = process.env.WC2026_API_BEARER_TOKEN;
const feedUrl = process.env.WC2026_PLAYERS_FEED_URL;
const matchesUrl = process.env.WC2026_MATCHES_URL;
const playerStatsByMatchUrlTemplate = process.env.WC2026_PLAYER_STATS_BY_MATCH_URL_TEMPLATE;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

function pickNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return 0;
}

function normalizePosition(positionRaw) {
  const value = String(positionRaw ?? "").toUpperCase();
  if (value.includes("GK") || value.includes("GOAL")) return "GK";
  if (value.includes("DF") || value.includes("DEF")) return "DF";
  if (value.includes("MF") || value.includes("MID")) return "MF";
  return "FW";
}

function parseRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.players)) return payload.players;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function headersWithAuth() {
  const headers = {};
  if (bearerToken) {
    headers.Authorization = `Bearer ${bearerToken}`;
  }
  return headers;
}

function mapToFlatRow(raw) {
  const player = raw.player ?? raw.athlete ?? {};
  const team = raw.team ?? raw.club ?? {};
  const goalkeeping = raw.goalkeeping ?? {};
  const defending = raw.defending ?? {};
  const passing = raw.passing ?? {};
  const shooting = raw.shooting ?? {};

  return {
    player_name: raw.player_name ?? raw.name ?? raw.playerName ?? player.name,
    photo_url:
      raw.photo_url ??
      raw.photoUrl ??
      raw.image ??
      raw.avatar ??
      player.photo_url ??
      player.photoUrl ??
      player.image,
    team_code: raw.team_code ?? raw.teamCode ?? raw.team ?? team.code ?? team.short_name,
    position: raw.position ?? player.position,
    number: raw.number ?? raw.shirt_number ?? raw.shirtNumber ?? player.number,
    goals: raw.goals ?? raw.goal ?? raw.total_goals ?? shooting.goals,
    assists: raw.assists ?? raw.total_assists ?? passing.assists,
    minutesPlayed: raw.minutesPlayed ?? raw.minutes ?? raw.total_minutes ?? raw.minutes_played,
    defensiveActions:
      pickNumber(defending.tackles_won, defending.interceptions, goalkeeping.saves),
  };
}

async function fetchProviderRows() {
  const headers = headersWithAuth();

  if (provider === "feed") {
    if (!feedUrl) {
      console.warn(
        "Skipping live import: WC2026_PLAYERS_FEED_URL is not set (provider=feed).",
      );
      return [];
    }
    const response = await fetch(feedUrl, { headers });
    if (!response.ok) {
      throw new Error(`Feed request failed (${response.status}): ${response.statusText}`);
    }
    const payload = await response.json();
    return parseRows(payload).map(mapToFlatRow);
  }

  if (provider === "thestatsapi") {
    if (!matchesUrl || !playerStatsByMatchUrlTemplate) {
      throw new Error(
        "For WC2026_PROVIDER=thestatsapi, set WC2026_MATCHES_URL and WC2026_PLAYER_STATS_BY_MATCH_URL_TEMPLATE.",
      );
    }

    const matchesResponse = await fetch(matchesUrl, { headers });
    if (!matchesResponse.ok) {
      throw new Error(`Matches request failed (${matchesResponse.status}): ${matchesResponse.statusText}`);
    }

    const matchesPayload = await matchesResponse.json();
    const matchRows = parseRows(matchesPayload).filter(
      match => (match.status ?? match.state ?? "").toString().toLowerCase() === "completed",
    );

    const aggregate = new Map();
    for (const match of matchRows) {
      const matchId = String(match.id ?? match.match_id ?? match.event_id ?? "");
      if (!matchId) continue;
      const statsUrl = playerStatsByMatchUrlTemplate.replace("{MATCH_ID}", matchId);
      const statsResponse = await fetch(statsUrl, { headers });
      if (!statsResponse.ok) continue;

      const statsPayload = await statsResponse.json();
      const playerRows = parseRows(statsPayload).map(mapToFlatRow);

      for (const row of playerRows) {
        const key = `${row.player_name}|${row.team_code}`;
        const current = aggregate.get(key) ?? {
          ...row,
          goals: 0,
          assists: 0,
          minutesPlayed: 0,
          defensiveActions: 0,
        };
        current.goals += pickNumber(row.goals);
        current.assists += pickNumber(row.assists);
        current.minutesPlayed += pickNumber(row.minutesPlayed);
        current.defensiveActions += pickNumber(row.defensiveActions);
        aggregate.set(key, current);
      }
    }

    return Array.from(aggregate.values());
  }

  throw new Error(`Unsupported WC2026_PROVIDER value: ${provider}`);
}

async function main() {
  const rows = await fetchProviderRows();
  if (!rows.length) {
    console.warn("No live rows imported. Database seed remains unchanged.");
    return;
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const teamRowsResult = await client.query("SELECT id, code FROM teams");
  const teamMap = new Map(teamRowsResult.rows.map(team => [String(team.code).toUpperCase(), team.id]));

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = String(row.player_name ?? row.name ?? row.playerName ?? "").trim();
    const teamCode = String(row.team_code ?? row.teamCode ?? row.team ?? "").trim().toUpperCase();
    if (!name || !teamCode || !teamMap.has(teamCode)) {
      skipped += 1;
      continue;
    }

    const teamId = teamMap.get(teamCode);
    const goals = pickNumber(row.goals, row.goal, row.total_goals);
    const assists = pickNumber(row.assists, row.total_assists);
    const minutesPlayed = pickNumber(row.minutesPlayed, row.minutes, row.total_minutes);
    const position = normalizePosition(row.position);
    const number = pickNumber(row.number, row.shirt_number, row.shirtNumber) || null;
    const photoUrl = row.photo_url ? String(row.photo_url) : null;

    const exists = await client.query(
      'SELECT id FROM players WHERE name = $1 AND "teamId" = $2 LIMIT 1',
      [name, teamId],
    );

    if (exists.rows.length > 0) {
      await client.query(
        'UPDATE players SET goals = $1, assists = $2, "minutesPlayed" = $3, position = $4, number = $5, "photoUrl" = COALESCE($6, "photoUrl") WHERE id = $7',
        [goals, assists, minutesPlayed, position, number, photoUrl, exists.rows[0].id],
      );
      updated += 1;
    } else {
      await client.query(
        'INSERT INTO players (name, "teamId", position, number, goals, assists, "minutesPlayed", "photoUrl") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [name, teamId, position, number, goals, assists, minutesPlayed, photoUrl],
      );
      inserted += 1;
    }
  }

  await client.end();

  console.log("Live player sync completed.");
  console.log(`Provider: ${provider}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
}

main().catch(error => {
  console.error("Import failed:", error);
  process.exit(1);
});
