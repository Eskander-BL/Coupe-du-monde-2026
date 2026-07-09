import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

// Get team IDs by code
const teamRowsResult = await client.query('SELECT id, code FROM teams');
const teamMap = {};
teamRowsResult.rows.forEach(t => teamMap[t.code] = t.id);

// ==================== INSERT TOP PLAYERS WITH REAL STATS ====================

const players = [
  // Argentina
  { teamCode: 'ARG', name: 'Lionel Messi', position: 'FW', number: 10, goals: 5, assists: 0, minutes: 187 },
  { teamCode: 'ARG', name: 'Julián Álvarez', position: 'FW', number: 9, goals: 2, assists: 1, minutes: 120 },
  { teamCode: 'ARG', name: 'Ángel Di María', position: 'MF', number: 11, goals: 1, assists: 2, minutes: 150 },
  
  // France
  { teamCode: 'FRA', name: 'Kylian Mbappé', position: 'FW', number: 10, goals: 4, assists: 1, minutes: 199 },
  { teamCode: 'FRA', name: 'Ousmane Dembélé', position: 'FW', number: 11, goals: 1, assists: 1, minutes: 155 },
  { teamCode: 'FRA', name: 'Antoine Griezmann', position: 'FW', number: 7, goals: 0, assists: 2, minutes: 180 },
  
  // Brazil
  { teamCode: 'BRA', name: 'Vinícius Júnior', position: 'FW', number: 7, goals: 2, assists: 1, minutes: 190 },
  { teamCode: 'BRA', name: 'Neymar', position: 'MF', number: 10, goals: 1, assists: 2, minutes: 160 },
  { teamCode: 'BRA', name: 'Rodrygo', position: 'FW', number: 11, goals: 1, assists: 0, minutes: 140 },
  
  // Spain
  { teamCode: 'ESP', name: 'Pedri', position: 'MF', number: 8, goals: 0, assists: 1, minutes: 170 },
  { teamCode: 'ESP', name: 'Álvaro Morata', position: 'FW', number: 9, goals: 1, assists: 0, minutes: 145 },
  { teamCode: 'ESP', name: 'Gavi', position: 'MF', number: 7, goals: 0, assists: 1, minutes: 155 },
  
  // Germany
  { teamCode: 'GER', name: 'Kai Havertz', position: 'FW', number: 7, goals: 2, assists: 0, minutes: 192 },
  { teamCode: 'GER', name: 'Serge Gnabry', position: 'FW', number: 10, goals: 1, assists: 1, minutes: 165 },
  { teamCode: 'GER', name: 'Jamal Musiala', position: 'MF', number: 42, goals: 0, assists: 1, minutes: 175 },
  
  // England
  { teamCode: 'ENG', name: 'Harry Kane', position: 'FW', number: 9, goals: 2, assists: 0, minutes: 204 },
  { teamCode: 'ENG', name: 'Phil Foden', position: 'MF', number: 20, goals: 1, assists: 1, minutes: 180 },
  { teamCode: 'ENG', name: 'Bukayo Saka', position: 'FW', number: 19, goals: 0, assists: 1, minutes: 170 },
  
  // Portugal
  { teamCode: 'POR', name: 'Cristiano Ronaldo', position: 'FW', number: 7, goals: 2, assists: 0, minutes: 201 },
  { teamCode: 'POR', name: 'Bruno Fernandes', position: 'MF', number: 8, goals: 0, assists: 2, minutes: 190 },
  { teamCode: 'POR', name: 'Diogo Jota', position: 'FW', number: 20, goals: 1, assists: 0, minutes: 155 },
  
  // Netherlands
  { teamCode: 'NED', name: 'Cody Gakpo', position: 'FW', number: 18, goals: 2, assists: 1, minutes: 181 },
  { teamCode: 'NED', name: 'Frenkie de Jong', position: 'MF', number: 21, goals: 0, assists: 1, minutes: 175 },
  { teamCode: 'NED', name: 'Memphis Depay', position: 'FW', number: 10, goals: 1, assists: 0, minutes: 145 },
  
  // Norway
  { teamCode: 'NOR', name: 'Erling Haaland', position: 'FW', number: 9, goals: 4, assists: 0, minutes: 207 },
  { teamCode: 'NOR', name: 'Alexander Isak', position: 'FW', number: 10, goals: 1, assists: 3, minutes: 194 },
  { teamCode: 'NOR', name: 'Morten Thorsby', position: 'MF', number: 8, goals: 0, assists: 0, minutes: 160 },
  
  // Colombia
  { teamCode: 'COL', name: 'Luis Díaz', position: 'FW', number: 19, goals: 1, assists: 1, minutes: 198 },
  { teamCode: 'COL', name: 'Radamel Falcao', position: 'FW', number: 9, goals: 0, assists: 0, minutes: 120 },
  { teamCode: 'COL', name: 'James Rodríguez', position: 'MF', number: 10, goals: 0, assists: 1, minutes: 175 },
  
  // Uruguay
  { teamCode: 'URY', name: 'Luis Suárez', position: 'FW', number: 9, goals: 1, assists: 0, minutes: 140 },
  { teamCode: 'URY', name: 'Edinson Cavani', position: 'FW', number: 21, goals: 0, assists: 0, minutes: 100 },
  { teamCode: 'URY', name: 'Federico Valverde', position: 'MF', number: 15, goals: 0, assists: 0, minutes: 180 },
  
  // Belgium
  { teamCode: 'BEL', name: 'Romelu Lukaku', position: 'FW', number: 9, goals: 1, assists: 0, minutes: 160 },
  { teamCode: 'BEL', name: 'Eden Hazard', position: 'MF', number: 10, goals: 0, assists: 1, minutes: 145 },
  { teamCode: 'BEL', name: 'Youri Tielemans', position: 'MF', number: 8, goals: 0, assists: 0, minutes: 170 },
  
  // USA
  { teamCode: 'USA', name: 'Christian Pulisic', position: 'MF', number: 10, goals: 1, assists: 1, minutes: 175 },
  { teamCode: 'USA', name: 'Weston McKennie', position: 'MF', number: 16, goals: 0, assists: 0, minutes: 180 },
  { teamCode: 'USA', name: 'Sergiño Dest', position: 'MF', number: 19, goals: 0, assists: 0, minutes: 150 },
  
  // Mexico
  { teamCode: 'MEX', name: 'Hirving Lozano', position: 'FW', number: 22, goals: 1, assists: 0, minutes: 165 },
  { teamCode: 'MEX', name: 'Raúl Jiménez', position: 'FW', number: 9, goals: 0, assists: 0, minutes: 140 },
  { teamCode: 'MEX', name: 'Guillermo Ochoa', position: 'GK', number: 1, goals: 0, assists: 0, minutes: 270 },
  
  // Japan
  { teamCode: 'JPN', name: 'Takumi Minamino', position: 'FW', number: 20, goals: 1, assists: 0, minutes: 160 },
  { teamCode: 'JPN', name: 'Daichi Kamada', position: 'MF', number: 8, goals: 2, assists: 0, minutes: 176 },
  { teamCode: 'JPN', name: 'Ayase Ueda', position: 'FW', number: 9, goals: 2, assists: 1, minutes: 174 },
  
  // South Korea
  { teamCode: 'KOR', name: 'Son Heung-min', position: 'FW', number: 7, goals: 1, assists: 0, minutes: 180 },
  { teamCode: 'KOR', name: 'Lee Kang-in', position: 'MF', number: 10, goals: 0, assists: 1, minutes: 165 },
  { teamCode: 'KOR', name: 'Kim Min-jae', position: 'DF', number: 3, goals: 0, assists: 0, minutes: 270 },
];

// Insert players
for (const player of players) {
  const teamId = teamMap[player.teamCode];
  if (teamId) {
    try {
      await client.query(
        'INSERT INTO players (name, "teamId", position, number, goals, assists, "minutesPlayed") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
        [player.name, teamId, player.position, player.number, player.goals, player.assists, player.minutes]
      );
    } catch (e) {
      // Ignore duplicates
    }
  }
}

// ==================== INSERT SAMPLE MATCHES ====================

const matches = [
  // Group A matches (sample)
  { matchNum: 1, homeCode: 'MEX', awayCode: 'RSA', homeGoals: 1, awayGoals: 0, date: '2026-06-11', stage: 'group', group: 'A', stadium: 'MetLife Stadium', city: 'East Rutherford, NJ', status: 'completed' },
  { matchNum: 2, homeCode: 'KOR', awayCode: 'CZE', homeGoals: 2, awayGoals: 1, date: '2026-06-11', stage: 'group', group: 'A', stadium: 'Arrowhead Stadium', city: 'Kansas City, MO', status: 'completed' },
  { matchNum: 3, homeCode: 'MEX', awayCode: 'CZE', homeGoals: 0, awayGoals: 1, date: '2026-06-16', stage: 'group', group: 'A', stadium: 'Soldier Field', city: 'Chicago, IL', status: 'completed' },
  { matchNum: 4, homeCode: 'RSA', awayCode: 'KOR', homeGoals: 1, awayGoals: 1, date: '2026-06-16', stage: 'group', group: 'A', stadium: 'Toyota Stadium', city: 'Frisco, TX', status: 'completed' },
  { matchNum: 5, homeCode: 'RSA', awayCode: 'CZE', homeGoals: 0, awayGoals: 2, date: '2026-06-21', stage: 'group', group: 'A', stadium: 'SoFi Stadium', city: 'Inglewood, CA', status: 'completed' },
  { matchNum: 6, homeCode: 'MEX', awayCode: 'KOR', homeGoals: 2, awayGoals: 1, date: '2026-06-21', stage: 'group', group: 'A', stadium: 'Levi\'s Stadium', city: 'Santa Clara, CA', status: 'completed' },
  
  // Group B matches (sample)
  { matchNum: 7, homeCode: 'ARG', awayCode: 'PER', homeGoals: 2, awayGoals: 0, date: '2026-06-12', stage: 'group', group: 'B', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta, GA', status: 'completed' },
  { matchNum: 8, homeCode: 'UZB', awayCode: 'GUA', homeGoals: 3, awayGoals: 0, date: '2026-06-12', stage: 'group', group: 'B', stadium: 'NRG Stadium', city: 'Houston, TX', status: 'completed' },
  { matchNum: 9, homeCode: 'ARG', awayCode: 'UZB', homeGoals: 1, awayGoals: 1, date: '2026-06-17', stage: 'group', group: 'B', stadium: 'Gillette Stadium', city: 'Foxborough, MA', status: 'completed' },
  { matchNum: 10, homeCode: 'PER', awayCode: 'GUA', homeGoals: 2, awayGoals: 1, date: '2026-06-17', stage: 'group', group: 'B', stadium: 'Acrisure Stadium', city: 'Pittsburgh, PA', status: 'completed' },
  { matchNum: 11, homeCode: 'PER', awayCode: 'UZB', homeGoals: 0, awayGoals: 1, date: '2026-06-22', stage: 'group', group: 'B', stadium: 'Empower Field', city: 'Denver, CO', status: 'completed' },
  { matchNum: 12, homeCode: 'ARG', awayCode: 'GUA', homeGoals: 3, awayGoals: 0, date: '2026-06-22', stage: 'group', group: 'B', stadium: 'Caesars Superdome', city: 'New Orleans, LA', status: 'completed' },
];

// Insert matches
for (const match of matches) {
  const homeTeamId = teamMap[match.homeCode];
  const awayTeamId = teamMap[match.awayCode];
  
  if (homeTeamId && awayTeamId) {
    try {
      await client.query(
        'INSERT INTO matches ("matchNumber", "homeTeamId", "awayTeamId", "homeGoals", "awayGoals", "matchDate", stadium, city, stage, "groupId", status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT ("matchNumber") DO NOTHING',
        [match.matchNum, homeTeamId, awayTeamId, match.homeGoals, match.awayGoals, match.date, match.stadium, match.city, match.stage, match.group, match.status]
      );
    } catch (e) {
      // Ignore duplicates
    }
  }
}

// ==================== UPDATE GROUP STANDINGS ====================

// Recalculate standings based on matches
const allMatchesResult = await client.query(
  `SELECT m.*, t1.code as homeCode, t2.code as awayCode 
   FROM matches m 
   JOIN teams t1 ON m."homeTeamId" = t1.id 
   JOIN teams t2 ON m."awayTeamId" = t2.id 
   WHERE m.status = 'completed' AND m.stage = 'group'`
);
const allMatches = allMatchesResult.rows;

// Reset standings
await client.query('UPDATE "groupStandings" SET wins = 0, draws = 0, losses = 0, "goalsFor" = 0, "goalsAgainst" = 0, points = 0');

// Calculate standings
const standingsMap = {};

for (const match of allMatches) {
  const homeTeamId = match.homeTeamId;
  const awayTeamId = match.awayTeamId;
  const homeGoals = match.homeGoals;
  const awayGoals = match.awayGoals;
  const groupId = match.groupId;

  // Initialize if not exists
  if (!standingsMap[`${groupId}-${homeTeamId}`]) {
    standingsMap[`${groupId}-${homeTeamId}`] = { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
  }
  if (!standingsMap[`${groupId}-${awayTeamId}`]) {
    standingsMap[`${groupId}-${awayTeamId}`] = { wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 };
  }

  // Update goals
  standingsMap[`${groupId}-${homeTeamId}`].gf += homeGoals;
  standingsMap[`${groupId}-${homeTeamId}`].ga += awayGoals;
  standingsMap[`${groupId}-${awayTeamId}`].gf += awayGoals;
  standingsMap[`${groupId}-${awayTeamId}`].ga += homeGoals;

  // Update wins/draws/losses
  if (homeGoals > awayGoals) {
    standingsMap[`${groupId}-${homeTeamId}`].wins++;
    standingsMap[`${groupId}-${homeTeamId}`].points += 3;
    standingsMap[`${groupId}-${awayTeamId}`].losses++;
  } else if (homeGoals < awayGoals) {
    standingsMap[`${groupId}-${awayTeamId}`].wins++;
    standingsMap[`${groupId}-${awayTeamId}`].points += 3;
    standingsMap[`${groupId}-${homeTeamId}`].losses++;
  } else {
    standingsMap[`${groupId}-${homeTeamId}`].draws++;
    standingsMap[`${groupId}-${homeTeamId}`].points += 1;
    standingsMap[`${groupId}-${awayTeamId}`].draws++;
    standingsMap[`${groupId}-${awayTeamId}`].points += 1;
  }
}

// Update database
for (const [key, standing] of Object.entries(standingsMap)) {
  const [groupId, teamId] = key.split('-');
  await client.query(
    'UPDATE "groupStandings" SET wins = $1, draws = $2, losses = $3, "goalsFor" = $4, "goalsAgainst" = $5, points = $6 WHERE "groupId" = $7 AND "teamId" = $8',
    [standing.wins, standing.draws, standing.losses, standing.gf, standing.ga, standing.points, groupId, teamId]
  );
}

console.log('✅ Matches and players seeded successfully!');
console.log(`✅ Inserted ${players.length} players`);
console.log(`✅ Inserted ${matches.length} matches`);
console.log(`✅ Updated group standings`);

await client.end();
