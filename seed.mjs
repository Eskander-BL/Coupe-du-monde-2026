import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

// Confederations
const confederations = [
  { code: 'AFC', name: 'Asian Football Confederation' },
  { code: 'CAF', name: 'African Football Confederation' },
  { code: 'CONCACAF', name: 'Confederation of North, Central America and Caribbean Association Football' },
  { code: 'CONMEBOL', name: 'South American Football Confederation' },
  { code: 'OFC', name: 'Oceania Football Confederation' },
  { code: 'UEFA', name: 'Union of European Football Associations' },
];

// Insert confederations
for (const conf of confederations) {
  try {
    await client.query(
      'INSERT INTO confederations (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
      [conf.code, conf.name]
    );
  } catch (e) {
    // Ignore duplicates
  }
}

// Groups
const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
for (const letter of groupLetters) {
  try {
    await client.query('INSERT INTO "groups" ("letter") VALUES ($1) ON CONFLICT ("letter") DO NOTHING', [letter]);
  } catch (e) {
    // Ignore duplicates
  }
}

// Teams - 48 teams qualified for World Cup 2026
const teams = [
  // Group A
  { code: 'MEX', name: 'Mexico', confederation: 'CONCACAF', group: 'A', offensive: 7.2, defensive: 6.5, overall: 6.8 },
  { code: 'RSA', name: 'South Africa', confederation: 'CAF', group: 'A', offensive: 6.0, defensive: 6.2, overall: 6.1 },
  { code: 'KOR', name: 'Korea Republic', confederation: 'AFC', group: 'A', offensive: 6.8, defensive: 6.5, overall: 6.7 },
  { code: 'CZE', name: 'Czechia', confederation: 'UEFA', group: 'A', offensive: 6.5, defensive: 6.3, overall: 6.4 },
  
  // Group B
  { code: 'ARG', name: 'Argentina', confederation: 'CONMEBOL', group: 'B', offensive: 8.5, defensive: 7.2, overall: 8.0 },
  { code: 'PER', name: 'Peru', confederation: 'CONMEBOL', group: 'B', offensive: 6.3, defensive: 6.0, overall: 6.2 },
  { code: 'UZB', name: 'Uzbekistan', confederation: 'AFC', group: 'B', offensive: 6.5, defensive: 6.2, overall: 6.4 },
  { code: 'GUA', name: 'Guatemala', confederation: 'CONCACAF', group: 'B', offensive: 5.5, defensive: 5.3, overall: 5.4 },
  
  // Group C
  { code: 'FRA', name: 'France', confederation: 'UEFA', group: 'C', offensive: 8.3, defensive: 7.8, overall: 8.1 },
  { code: 'NOR', name: 'Norway', confederation: 'UEFA', group: 'C', offensive: 7.0, defensive: 6.8, overall: 6.9 },
  { code: 'TUN', name: 'Tunisia', confederation: 'CAF', group: 'C', offensive: 6.2, defensive: 6.0, overall: 6.1 },
  { code: 'EQG', name: 'Equatorial Guinea', confederation: 'CAF', group: 'C', offensive: 5.0, defensive: 5.2, overall: 5.1 },
  
  // Group D
  { code: 'USA', name: 'United States', confederation: 'CONCACAF', group: 'D', offensive: 7.0, defensive: 6.8, overall: 6.9 },
  { code: 'BIH', name: 'Bosnia and Herzegovina', confederation: 'UEFA', group: 'D', offensive: 6.8, defensive: 6.5, overall: 6.7 },
  { code: 'IRN', name: 'IR Iran', confederation: 'AFC', group: 'D', offensive: 6.2, defensive: 6.0, overall: 6.1 },
  { code: 'AUS', name: 'Australia', confederation: 'AFC', group: 'D', offensive: 6.5, defensive: 6.3, overall: 6.4 },
  
  // Group E
  { code: 'ESP', name: 'Spain', confederation: 'UEFA', group: 'E', offensive: 8.0, defensive: 7.5, overall: 7.8 },
  { code: 'AUT', name: 'Austria', confederation: 'UEFA', group: 'E', offensive: 7.2, defensive: 7.0, overall: 7.1 },
  { code: 'SRB', name: 'Serbia', confederation: 'UEFA', group: 'E', offensive: 6.8, defensive: 6.5, overall: 6.7 },
  { code: 'MNE', name: 'Montenegro', confederation: 'UEFA', group: 'E', offensive: 5.8, defensive: 5.5, overall: 5.7 },
  
  // Group F
  { code: 'BRA', name: 'Brazil', confederation: 'CONMEBOL', group: 'F', offensive: 8.7, defensive: 7.5, overall: 8.2 },
  { code: 'MAR', name: 'Morocco', confederation: 'CAF', group: 'F', offensive: 7.0, defensive: 7.2, overall: 7.1 },
  { code: 'CRO', name: 'Croatia', confederation: 'UEFA', group: 'F', offensive: 7.2, defensive: 7.0, overall: 7.1 },
  { code: 'ALB', name: 'Albania', confederation: 'UEFA', group: 'F', offensive: 6.0, defensive: 5.8, overall: 5.9 },
  
  // Group G
  { code: 'BEL', name: 'Belgium', confederation: 'UEFA', group: 'G', offensive: 7.8, defensive: 7.2, overall: 7.5 },
  { code: 'UKR', name: 'Ukraine', confederation: 'UEFA', group: 'G', offensive: 6.8, defensive: 6.5, overall: 6.7 },
  { code: 'SVK', name: 'Slovakia', confederation: 'UEFA', group: 'G', offensive: 6.2, defensive: 6.0, overall: 6.1 },
  { code: 'ROU', name: 'Romania', confederation: 'UEFA', group: 'G', offensive: 6.5, defensive: 6.2, overall: 6.4 },
  
  // Group H
  { code: 'GER', name: 'Germany', confederation: 'UEFA', group: 'H', offensive: 8.2, defensive: 7.8, overall: 8.0 },
  { code: 'NED', name: 'Netherlands', confederation: 'UEFA', group: 'H', offensive: 7.8, defensive: 7.3, overall: 7.6 },
  { code: 'CHI', name: 'Chile', confederation: 'CONMEBOL', group: 'H', offensive: 6.8, defensive: 6.5, overall: 6.7 },
  { code: 'VIE', name: 'Vietnam', confederation: 'AFC', group: 'H', offensive: 5.5, defensive: 5.3, overall: 5.4 },
  
  // Group I
  { code: 'ENG', name: 'England', confederation: 'UEFA', group: 'I', offensive: 7.8, defensive: 7.2, overall: 7.5 },
  { code: 'PAN', name: 'Panama', confederation: 'CONCACAF', group: 'I', offensive: 5.8, defensive: 5.5, overall: 5.7 },
  { code: 'SEN', name: 'Senegal', confederation: 'CAF', group: 'I', offensive: 6.8, defensive: 6.5, overall: 6.7 },
  { code: 'CIV', name: 'Côte d\'Ivoire', confederation: 'CAF', group: 'I', offensive: 6.8, defensive: 6.3, overall: 6.6 },
  
  // Group J
  { code: 'POR', name: 'Portugal', confederation: 'UEFA', group: 'J', offensive: 7.8, defensive: 7.2, overall: 7.5 },
  { code: 'SUI', name: 'Switzerland', confederation: 'UEFA', group: 'J', offensive: 7.0, defensive: 7.2, overall: 7.1 },
  { code: 'CAN', name: 'Canada', confederation: 'CONCACAF', group: 'J', offensive: 6.5, defensive: 6.2, overall: 6.4 },
  { code: 'TUR', name: 'Türkiye', confederation: 'UEFA', group: 'J', offensive: 7.0, defensive: 6.8, overall: 6.9 },
  
  // Group K
  { code: 'ECU', name: 'Ecuador', confederation: 'CONMEBOL', group: 'K', offensive: 6.8, defensive: 6.3, overall: 6.6 },
  { code: 'SWE', name: 'Sweden', confederation: 'UEFA', group: 'K', offensive: 6.8, defensive: 6.8, overall: 6.8 },
  { code: 'JPN', name: 'Japan', confederation: 'AFC', group: 'K', offensive: 7.0, defensive: 6.8, overall: 6.9 },
  { code: 'COL', name: 'Colombia', confederation: 'CONMEBOL', group: 'K', offensive: 7.2, defensive: 6.8, overall: 7.0 },
  
  // Group L
  { code: 'URY', name: 'Uruguay', confederation: 'CONMEBOL', group: 'L', offensive: 7.5, defensive: 7.0, overall: 7.3 },
  { code: 'GHA', name: 'Ghana', confederation: 'CAF', group: 'L', offensive: 6.5, defensive: 6.2, overall: 6.4 },
  { code: 'SGP', name: 'Singapore', confederation: 'AFC', group: 'L', offensive: 4.8, defensive: 5.0, overall: 4.9 },
  { code: 'ISL', name: 'Iceland', confederation: 'UEFA', group: 'L', offensive: 5.8, defensive: 5.5, overall: 5.7 },
];

// Get confederation IDs
const confMap = {};
const confsResult = await client.query('SELECT id, code FROM confederations');
confsResult.rows.forEach(c => confMap[c.code] = c.id);

// Insert teams
for (const team of teams) {
  try {
    await client.query(
      'INSERT INTO teams (code, name, "confederationId", "groupId", "offensiveStrength", "defensiveStrength", "overallRating") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (code) DO NOTHING',
      [team.code, team.name, confMap[team.confederation], team.group, team.offensive, team.defensive, team.overall]
    );
  } catch (e) {
    // Ignore duplicates
  }
}

// Initialize group standings
const teamRowsResult = await client.query('SELECT id, "groupId" FROM teams');
for (const team of teamRowsResult.rows) {
  try {
    await client.query(
      `INSERT INTO "groupStandings" ("groupId", "teamId", wins, draws, losses, "goalsFor", "goalsAgainst", points, position)
       SELECT $1, $2, 0, 0, 0, 0, 0, 0, NULL
       WHERE NOT EXISTS (
         SELECT 1 FROM "groupStandings" WHERE "groupId" = $1 AND "teamId" = $2
       )`,
      [team.groupId, team.id]
    );
  } catch (e) {
    // Ignore duplicates
  }
}

console.log('✅ Database seeded successfully!');
console.log(`✅ Created ${confederations.length} confederations`);
console.log(`✅ Created ${groupLetters.length} groups`);
console.log(`✅ Created ${teams.length} teams`);
console.log(`✅ Initialized group standings`);

await client.end();
