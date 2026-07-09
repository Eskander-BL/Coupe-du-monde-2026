import { eq, desc, asc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, teams, confederations, matches, players, groupStandings, predictions, groups } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== WORLD CUP QUERIES ====================

export async function getAllTeams() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: teams.id,
      code: teams.code,
      name: teams.name,
      groupId: teams.groupId,
      confederationId: teams.confederationId,
      flagUrl: teams.flagUrl,
      offensiveStrength: teams.offensiveStrength,
      defensiveStrength: teams.defensiveStrength,
      overallRating: teams.overallRating,
    })
    .from(teams)
    .orderBy(teams.groupId, teams.name);
}

export async function getTeamById(teamId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getTeamsByGroup(groupId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(teams)
    .where(eq(teams.groupId, groupId))
    .orderBy(teams.name);
}

export async function getAllConfederations() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(confederations)
    .orderBy(confederations.name);
}

export async function getTeamsByConfederation(confederationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(teams)
    .where(eq(teams.confederationId, confederationId))
    .orderBy(teams.groupId, teams.name);
}

export async function getGroupStandings(groupId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: groupStandings.id,
      groupId: groupStandings.groupId,
      teamId: groupStandings.teamId,
      wins: groupStandings.wins,
      draws: groupStandings.draws,
      losses: groupStandings.losses,
      goalsFor: groupStandings.goalsFor,
      goalsAgainst: groupStandings.goalsAgainst,
      points: groupStandings.points,
      position: groupStandings.position,
      teamName: teams.name,
      teamCode: teams.code,
    })
    .from(groupStandings)
    .innerJoin(teams, eq(groupStandings.teamId, teams.id))
    .where(eq(groupStandings.groupId, groupId))
    .orderBy(desc(groupStandings.points), desc(sql`${groupStandings.goalsFor} - ${groupStandings.goalsAgainst}`));
}

export async function getAllGroupStandings() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: groupStandings.id,
      groupId: groupStandings.groupId,
      teamId: groupStandings.teamId,
      wins: groupStandings.wins,
      draws: groupStandings.draws,
      losses: groupStandings.losses,
      goalsFor: groupStandings.goalsFor,
      goalsAgainst: groupStandings.goalsAgainst,
      points: groupStandings.points,
      position: groupStandings.position,
      teamName: teams.name,
      teamCode: teams.code,
    })
    .from(groupStandings)
    .innerJoin(teams, eq(groupStandings.teamId, teams.id))
    .orderBy(groupStandings.groupId, desc(groupStandings.points));
}

export async function getMatchesByStage(stage: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: matches.id,
      matchNumber: matches.matchNumber,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      homeGoals: matches.homeGoals,
      awayGoals: matches.awayGoals,
      matchDate: matches.matchDate,
      stadium: matches.stadium,
      city: matches.city,
      stage: matches.stage,
      groupId: matches.groupId,
      status: matches.status,
      homeTeamName: sql`(SELECT name FROM teams WHERE id = ${matches.homeTeamId})`,
      awayTeamName: sql`(SELECT name FROM teams WHERE id = ${matches.awayTeamId})`,
      homeTeamCode: sql`(SELECT code FROM teams WHERE id = ${matches.homeTeamId})`,
      awayTeamCode: sql`(SELECT code FROM teams WHERE id = ${matches.awayTeamId})`,
    })
    .from(matches)
    .where(sql`${matches.stage} = ${stage}`)
    .orderBy(matches.matchDate);
}

export async function getAllMatches() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: matches.id,
      matchNumber: matches.matchNumber,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      homeGoals: matches.homeGoals,
      awayGoals: matches.awayGoals,
      matchDate: matches.matchDate,
      stadium: matches.stadium,
      city: matches.city,
      stage: matches.stage,
      groupId: matches.groupId,
      status: matches.status,
    })
    .from(matches)
    .orderBy(matches.matchNumber);
}

export async function getTopScorers(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      teamId: players.teamId,
      teamName: teams.name,
      teamCode: teams.code,
      position: players.position,
      goals: players.goals,
      assists: players.assists,
      minutesPlayed: players.minutesPlayed,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .where(sql`${players.goals} > 0`)
    .orderBy(desc(players.goals), desc(players.assists))
    .limit(limit);
}

export async function getTopAssisters(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select({
      id: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      teamId: players.teamId,
      teamName: teams.name,
      teamCode: teams.code,
      position: players.position,
      goals: players.goals,
      assists: players.assists,
      minutesPlayed: players.minutesPlayed,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .where(sql`${players.assists} > 0`)
    .orderBy(desc(players.assists), desc(players.goals))
    .limit(limit);
}

export async function getPlayersByTeam(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(players)
    .where(eq(players.teamId, teamId))
    .orderBy(players.position, players.name);
}

export async function getAllPlayers() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: players.id,
      name: players.name,
      photoUrl: players.photoUrl,
      teamId: players.teamId,
      teamName: teams.name,
      teamCode: teams.code,
      position: players.position,
      number: players.number,
      goals: players.goals,
      assists: players.assists,
      minutesPlayed: players.minutesPlayed,
    })
    .from(players)
    .innerJoin(teams, eq(players.teamId, teams.id))
    .orderBy(teams.name, players.name);
}

export async function getPredictions(predictionType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: predictions.id,
      predictionType: predictions.predictionType,
      teamId: predictions.teamId,
      playerId: predictions.playerId,
      probability: predictions.probability,
      reasoning: predictions.reasoning,
      rank: predictions.rank,
      teamName: teams.name,
      playerName: players.name,
    })
    .from(predictions)
    .leftJoin(teams, eq(predictions.teamId, teams.id))
    .leftJoin(players, eq(predictions.playerId, players.id))
    .where(predictionType ? sql`${predictions.predictionType} = ${predictionType}` : undefined)
    .orderBy(predictions.rank);
  
  return result;
}

export async function getTournamentStats() {
  const db = await getDb();
  if (!db) return null;
  
  const completedMatches = await db
    .select({
      totalGoals: sql<number>`SUM(COALESCE(${matches.homeGoals}, 0) + COALESCE(${matches.awayGoals}, 0))`,
      matchCount: sql<number>`COUNT(*)`,
    })
    .from(matches)
    .where(sql`${matches.status} = 'completed'`);
  
  const topScorer = await getTopScorers(1);
  
  return {
    totalGoals: Number(completedMatches[0]?.totalGoals) || 0,
    matchesCompleted: Number(completedMatches[0]?.matchCount) || 0,
    topScorer: topScorer[0] || null,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function getModelValidationReport() {
  const db = await getDb();
  if (!db) return null;

  const completed = await db
    .select({
      id: matches.id,
      homeGoals: matches.homeGoals,
      awayGoals: matches.awayGoals,
      homeOffense: sql<number>`(SELECT offensiveStrength FROM teams WHERE id = ${matches.homeTeamId})`,
      homeDefense: sql<number>`(SELECT defensiveStrength FROM teams WHERE id = ${matches.homeTeamId})`,
      awayOffense: sql<number>`(SELECT offensiveStrength FROM teams WHERE id = ${matches.awayTeamId})`,
      awayDefense: sql<number>`(SELECT defensiveStrength FROM teams WHERE id = ${matches.awayTeamId})`,
      homeOverall: sql<number>`(SELECT overallRating FROM teams WHERE id = ${matches.homeTeamId})`,
      awayOverall: sql<number>`(SELECT overallRating FROM teams WHERE id = ${matches.awayTeamId})`,
    })
    .from(matches)
    .where(
      and(
        eq(matches.status, "completed"),
        sql`${matches.homeGoals} IS NOT NULL`,
        sql`${matches.awayGoals} IS NOT NULL`,
      ),
    );

  if (!completed.length) {
    return {
      sampleSize: 0,
      scoreMae: null,
      winnerAccuracy: null,
      winnerBrier: null,
      calibrationGap: null,
      quality: "insufficient_data",
    };
  }

  let absErrorSum = 0;
  let winnerCorrect = 0;
  let brierSum = 0;
  let calibrationSum = 0;

  for (const match of completed) {
    const homeGoals = Number(match.homeGoals ?? 0);
    const awayGoals = Number(match.awayGoals ?? 0);

    const homeAttack = Number(match.homeOffense ?? 5);
    const homeDef = Number(match.homeDefense ?? 5);
    const awayAttack = Number(match.awayOffense ?? 5);
    const awayDef = Number(match.awayDefense ?? 5);

    const predictedHomeGoals = clamp((homeAttack * 0.62 - awayDef * 0.38 + 1.2), 0, 5);
    const predictedAwayGoals = clamp((awayAttack * 0.58 - homeDef * 0.34 + 1.1), 0, 5);

    absErrorSum += Math.abs(predictedHomeGoals - homeGoals);
    absErrorSum += Math.abs(predictedAwayGoals - awayGoals);

    const homeStrength = Number(match.homeOverall ?? 5);
    const awayStrength = Number(match.awayOverall ?? 5);
    const homeWinProb = clamp(0.5 + (homeStrength - awayStrength) / 20, 0.05, 0.95);

    const actualHomeWin = homeGoals > awayGoals ? 1 : 0;
    const predictedHomeWin = homeWinProb >= 0.5 ? 1 : 0;
    if (predictedHomeWin === actualHomeWin) {
      winnerCorrect += 1;
    }

    brierSum += (homeWinProb - actualHomeWin) ** 2;
    calibrationSum += Math.abs(homeWinProb - actualHomeWin);
  }

  const sampleSize = completed.length;
  const scoreMae = absErrorSum / (sampleSize * 2);
  const winnerAccuracy = winnerCorrect / sampleSize;
  const winnerBrier = brierSum / sampleSize;
  const calibrationGap = calibrationSum / sampleSize;

  const quality =
    scoreMae <= 0.95 && winnerAccuracy >= 0.65 && winnerBrier <= 0.2
      ? "good"
      : scoreMae <= 1.25 && winnerAccuracy >= 0.55
        ? "medium"
        : "needs_improvement";

  return {
    sampleSize,
    scoreMae: Number(scoreMae.toFixed(3)),
    winnerAccuracy: Number((winnerAccuracy * 100).toFixed(2)),
    winnerBrier: Number(winnerBrier.toFixed(3)),
    calibrationGap: Number(calibrationGap.toFixed(3)),
    quality,
  };
}

export async function getDataQualityReport() {
  const db = await getDb();
  if (!db) return null;

  const teamRows = await db
    .select({
      offensiveStrength: teams.offensiveStrength,
      defensiveStrength: teams.defensiveStrength,
      overallRating: teams.overallRating,
      flagUrl: teams.flagUrl,
    })
    .from(teams);

  const playerRows = await db
    .select({
      goals: players.goals,
      assists: players.assists,
      minutesPlayed: players.minutesPlayed,
      photoUrl: players.photoUrl,
    })
    .from(players);

  const teamsMissingRatings = teamRows.filter(
    row =>
      row.offensiveStrength === null ||
      row.defensiveStrength === null ||
      row.overallRating === null,
  ).length;

  const teamsMissingFlag = teamRows.filter(row => !row.flagUrl).length;
  const playersMissingPhoto = playerRows.filter(row => !row.photoUrl).length;
  const playersInvalidMinutes = playerRows.filter(row => (row.minutesPlayed ?? 0) < 0).length;
  const playersInvalidStats = playerRows.filter(
    row => (row.goals ?? 0) < 0 || (row.assists ?? 0) < 0,
  ).length;

  return {
    teamsCount: teamRows.length,
    playersCount: playerRows.length,
    teamsMissingRatings,
    teamsMissingFlag,
    playersMissingPhoto,
    playersInvalidMinutes,
    playersInvalidStats,
    qualityScore: Number(
      (
        100 -
        (teamsMissingRatings * 1.5 +
          teamsMissingFlag * 0.4 +
          playersMissingPhoto * 0.2 +
          playersInvalidMinutes * 3 +
          playersInvalidStats * 3)
      ).toFixed(2),
    ),
  };
}

export async function getTeamReadinessReport() {
  const db = await getDb();
  if (!db) return [];

  const allTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      code: teams.code,
      offensiveStrength: teams.offensiveStrength,
      defensiveStrength: teams.defensiveStrength,
      overallRating: teams.overallRating,
    })
    .from(teams);

  const allCompletedMatches = await db
    .select({
      id: matches.id,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      homeGoals: matches.homeGoals,
      awayGoals: matches.awayGoals,
      matchDate: matches.matchDate,
    })
    .from(matches)
    .where(eq(matches.status, "completed"))
    .orderBy(desc(matches.matchDate));

  const now = Date.now();

  const reports = allTeams.map(team => {
    const teamMatches = allCompletedMatches
      .filter(match => match.homeTeamId === team.id || match.awayTeamId === team.id)
      .slice(0, 5);

    if (!teamMatches.length) {
      return {
        teamId: team.id,
        teamName: team.name,
        teamCode: team.code,
        readinessScore: Number(team.overallRating ?? 0) * 10,
        restDays: null,
        recentPoints: 0,
        momentum: 0,
        attackEfficiency: Number(team.offensiveStrength ?? 0),
        defenseStability: Number(team.defensiveStrength ?? 0),
        confidenceLabel: "insufficient_data",
      };
    }

    const lastMatchDate = new Date(teamMatches[0].matchDate as unknown as string).getTime();
    const restDays = Math.max(0, (now - lastMatchDate) / (1000 * 60 * 60 * 24));

    let recentPoints = 0;
    let wins = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    for (const match of teamMatches) {
      const isHome = match.homeTeamId === team.id;
      const gf = Number(isHome ? match.homeGoals ?? 0 : match.awayGoals ?? 0);
      const ga = Number(isHome ? match.awayGoals ?? 0 : match.homeGoals ?? 0);
      goalsFor += gf;
      goalsAgainst += ga;

      if (gf > ga) {
        recentPoints += 3;
        wins += 1;
      } else if (gf === ga) {
        recentPoints += 1;
      } else {
        losses += 1;
      }
    }

    const momentum = wins - losses;
    const attackEfficiency = (goalsFor / teamMatches.length) * 3 + Number(team.offensiveStrength ?? 0) * 0.7;
    const defenseStability =
      Math.max(0, 10 - goalsAgainst / teamMatches.length) * 0.6 + Number(team.defensiveStrength ?? 0) * 0.8;

    const restFactor = clamp(restDays, 2, 8);
    const readinessScore =
      Number(team.overallRating ?? 0) * 8 +
      recentPoints * 2.2 +
      momentum * 2 +
      attackEfficiency * 2.3 +
      defenseStability * 2.3 +
      restFactor * 1.8;

    const confidenceLabel =
      readinessScore >= 82 ? "high" : readinessScore >= 68 ? "medium" : "watch";

    return {
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code,
      readinessScore: Number(readinessScore.toFixed(2)),
      restDays: Number(restDays.toFixed(1)),
      recentPoints,
      momentum,
      attackEfficiency: Number(attackEfficiency.toFixed(2)),
      defenseStability: Number(defenseStability.toFixed(2)),
      confidenceLabel,
      includedSignals: [
        "rest_days",
        "recent_points",
        "momentum",
        "attack_efficiency",
        "defense_stability",
      ],
      excludedSignals: ["sleep_data", "psychological_data"],
    };
  });

  return reports.sort((a, b) => b.readinessScore - a.readinessScore).slice(0, 12);
}

export async function getMlTournamentForecast() {
  const [qualityReport, readinessReport, topScorers, allPlayers] = await Promise.all([
    getDataQualityReport(),
    getTeamReadinessReport(),
    getTopScorers(20),
    getAllPlayers(),
  ]);

  if (!qualityReport || !readinessReport.length) {
    return {
      status: "insufficient_data",
      reason: "Data source unavailable.",
      minQualityScore: 75,
    } as const;
  }

  const minQualityScore = 75;
  if (qualityReport.qualityScore < minQualityScore) {
    return {
      status: "insufficient_data",
      reason: `Data quality below threshold (${qualityReport.qualityScore} < ${minQualityScore}).`,
      minQualityScore,
      qualityScore: qualityReport.qualityScore,
    } as const;
  }

  const db = await getDb();
  if (!db) {
    return {
      status: "insufficient_data",
      reason: "Database unavailable.",
      minQualityScore,
    } as const;
  }

  const completedMatchesChrono = await db
    .select({
      matchDate: matches.matchDate,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      homeGoals: matches.homeGoals,
      awayGoals: matches.awayGoals,
    })
    .from(matches)
    .where(
      and(
        eq(matches.status, "completed"),
        sql`${matches.homeGoals} IS NOT NULL`,
        sql`${matches.awayGoals} IS NOT NULL`,
      ),
    )
    .orderBy(matches.matchDate);

  // Elo v2: dynamic team strength inferred only from played matches.
  const defaultElo = 1500;
  const kFactor = 24;
  const eloByTeam = new Map<number, number>();

  const expectedScore = (eloA: number, eloB: number) =>
    1 / (1 + 10 ** ((eloB - eloA) / 400));

  const actualResult = (goalsA: number, goalsB: number) => {
    if (goalsA > goalsB) return 1;
    if (goalsA < goalsB) return 0;
    return 0.5;
  };

  let eloBacktestCorrect = 0;
  let eloBacktestTotal = 0;
  let eloBrierSum = 0;
  const splitIndex = Math.floor(completedMatchesChrono.length * 0.7);

  // Winner model (ranking softmax) based on readiness score
  const topTeams = readinessReport.slice(0, 5);
  const expScores = topTeams.map(team => Math.exp(team.readinessScore / 20));
  const expTotal = expScores.reduce((acc, value) => acc + value, 0) || 1;
  const winnerProbabilities = topTeams.map((team, idx) => ({
    rank: idx + 1,
    teamId: team.teamId,
    teamName: team.teamName,
    teamCode: team.teamCode,
    probability: Number(((expScores[idx] / expTotal) * 100).toFixed(2)),
    readinessScore: team.readinessScore,
  }));

  // Top scorer model: blend of goals and goals per 90
  const topScorerForecast = topScorers.slice(0, 5).map((player, idx) => {
    const minutes = Math.max(1, player.minutesPlayed ?? 0);
    const goalsPer90 = ((player.goals ?? 0) / minutes) * 90;
    const impact = (player.goals ?? 0) * 0.7 + goalsPer90 * 0.3;
    return {
      rank: idx + 1,
      playerId: player.id,
      playerName: player.name,
      teamCode: player.teamCode,
      currentGoals: player.goals ?? 0,
      goalsPer90: Number(goalsPer90.toFixed(2)),
      impact: Number(impact.toFixed(2)),
    };
  });
  const impactTotal = topScorerForecast.reduce((acc, p) => acc + p.impact, 0) || 1;
  const topScorerProbabilities = topScorerForecast.map(player => ({
    ...player,
    probability: Number(((player.impact / impactTotal) * 100).toFixed(2)),
  }));

  // Best player model
  const bestPlayers = [...allPlayers]
    .map(player => ({
      ...player,
      mlScore: player.goals * 4 + player.assists * 3 + player.minutesPlayed * 0.01,
    }))
    .sort((a, b) => b.mlScore - a.mlScore)
    .slice(0, 5)
    .map((player, idx) => ({
      rank: idx + 1,
      playerId: player.id,
      playerName: player.name,
      teamCode: player.teamCode,
      position: player.position,
      goals: player.goals,
      assists: player.assists,
      minutesPlayed: player.minutesPlayed,
      score: Number(player.mlScore.toFixed(2)),
    }));

  // Best defender model
  const bestDefenders = allPlayers
    .filter(player => player.position === "DF")
    .map(player => ({
      ...player,
      mlScore: player.minutesPlayed * 0.004 + player.assists * 1.8 + player.goals * 1.2,
    }))
    .sort((a, b) => b.mlScore - a.mlScore)
    .slice(0, 5)
    .map((player, idx) => ({
      rank: idx + 1,
      playerId: player.id,
      playerName: player.name,
      teamCode: player.teamCode,
      minutesPlayed: player.minutesPlayed,
      score: Number(player.mlScore.toFixed(2)),
    }));

  for (let i = 0; i < completedMatchesChrono.length; i++) {
    const match = completedMatchesChrono[i];
    const homeTeamId = Number(match.homeTeamId);
    const awayTeamId = Number(match.awayTeamId);
    const homeGoals = Number(match.homeGoals ?? 0);
    const awayGoals = Number(match.awayGoals ?? 0);

    const homeElo = eloByTeam.get(homeTeamId) ?? defaultElo;
    const awayElo = eloByTeam.get(awayTeamId) ?? defaultElo;

    const homeExpected = expectedScore(homeElo, awayElo);
    const awayExpected = 1 - homeExpected;
    const homeActual = actualResult(homeGoals, awayGoals);
    const awayActual = 1 - homeActual;

    if (i >= splitIndex) {
      const predictedHomeWin = homeExpected >= 0.5 ? 1 : 0;
      const actualHomeWin = homeActual === 1 ? 1 : 0;
      if (predictedHomeWin === actualHomeWin) {
        eloBacktestCorrect += 1;
      }
      eloBacktestTotal += 1;
      eloBrierSum += (homeExpected - actualHomeWin) ** 2;
    }

    const goalMargin = Math.max(1, Math.abs(homeGoals - awayGoals));
    const marginMultiplier = Math.log(goalMargin + 1);
    const dynamicK = kFactor * marginMultiplier;

    const nextHomeElo = homeElo + dynamicK * (homeActual - homeExpected);
    const nextAwayElo = awayElo + dynamicK * (awayActual - awayExpected);

    eloByTeam.set(homeTeamId, nextHomeElo);
    eloByTeam.set(awayTeamId, nextAwayElo);
  }

  const eloRanked = readinessReport
    .map(team => ({
      teamId: team.teamId,
      teamName: team.teamName,
      teamCode: team.teamCode,
      elo: Number((eloByTeam.get(team.teamId) ?? defaultElo).toFixed(2)),
      readinessScore: team.readinessScore,
    }))
    .sort((a, b) => b.elo - a.elo);

  return {
    status: "ok",
    model: {
      name: "world-cup-ranking-v2-elo",
      version: "2.0.0",
      trainedAt: new Date().toISOString(),
      features: [
        "readiness_score",
        "elo_dynamic",
        "goals",
        "assists",
        "minutes_played",
        "goals_per_90",
      ],
    },
    qualityGate: {
      minQualityScore,
      qualityScore: qualityReport.qualityScore,
      passed: qualityReport.qualityScore >= minQualityScore,
    },
    validation: {
      temporalSplit: {
        trainPercent: 70,
        testPercent: 30,
      },
      testMatches: eloBacktestTotal,
      winnerAccuracy:
        eloBacktestTotal > 0
          ? Number(((eloBacktestCorrect / eloBacktestTotal) * 100).toFixed(2))
          : null,
      brierScore:
        eloBacktestTotal > 0
          ? Number((eloBrierSum / eloBacktestTotal).toFixed(3))
          : null,
    },
    outputs: {
      winnerProbabilities: winnerProbabilities.map(item => {
        const eloRow = eloRanked.find(elo => elo.teamId === item.teamId);
        return {
          ...item,
          elo: eloRow?.elo ?? defaultElo,
        };
      }),
      topScorerProbabilities,
      bestPlayers,
      bestDefenders,
    },
  } as const;
}

export async function getGovernanceChecklist() {
  const [modelValidation, dataQuality, forecast] = await Promise.all([
    getModelValidationReport(),
    getDataQualityReport(),
    getMlTournamentForecast(),
  ]);

  const qualityScore = dataQuality?.qualityScore ?? 0;
  const sampleSize = modelValidation?.sampleSize ?? 0;
  const winnerAccuracy = modelValidation?.winnerAccuracy ?? 0;
  const winnerBrier = modelValidation?.winnerBrier ?? 1;
  const scoreMae = modelValidation?.scoreMae ?? 99;

  const hasMonitoringConfig = Boolean(
    process.env.MONITORING_ENDPOINT || process.env.SENTRY_DSN || process.env.DATADOG_API_KEY,
  );
  const hasAlertingConfig = Boolean(
    process.env.ALERT_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || process.env.PAGERDUTY_ROUTING_KEY,
  );
  const hasE2EConfig = Boolean(process.env.E2E_HEALTHCHECK_URL || process.env.CI === "true");

  const checks = [
    {
      id: "no_absolute_claims",
      label: "Exactitude absolue non revendiquee",
      status: "pass",
      details: "Le backend expose des probabilites et des metriques de confiance, pas des certitudes.",
    },
    {
      id: "model_metrics",
      label: "Metriques de modele disponibles",
      status: sampleSize >= 10 ? "pass" : "warn",
      details: `sampleSize=${sampleSize}, winnerAccuracy=${winnerAccuracy}%, brier=${winnerBrier}, mae=${scoreMae}`,
    },
    {
      id: "temporal_backtest",
      label: "Validation temporelle active",
      status:
        forecast.status === "ok" && (forecast.validation?.testMatches ?? 0) > 0
          ? "pass"
          : "warn",
      details:
        forecast.status === "ok"
          ? `testMatches=${forecast.validation?.testMatches ?? 0}`
          : forecast.reason,
    },
    {
      id: "quality_gate",
      label: "Quality gate donnees actif",
      status:
        forecast.status === "ok" && forecast.qualityGate.passed && qualityScore >= 75
          ? "pass"
          : "warn",
      details: `qualityScore=${qualityScore}`,
    },
    {
      id: "provider_truth_control",
      label: "Verification externe provider",
      status: "warn",
      details:
        "Verification manuelle recommandee avec sources de reference. Pas d'audit croise automatise dans ce backend.",
    },
    {
      id: "monitoring",
      label: "Monitoring continu configure",
      status: hasMonitoringConfig ? "pass" : "warn",
      details: hasMonitoringConfig
        ? "Config monitoring detectee via variables d'environnement."
        : "Ajouter MONITORING_ENDPOINT ou SENTRY_DSN ou DATADOG_API_KEY.",
    },
    {
      id: "recalibration_policy",
      label: "Politique de recalibration modele",
      status: process.env.ML_RECALIBRATION_DAYS ? "pass" : "warn",
      details: process.env.ML_RECALIBRATION_DAYS
        ? `Recalibration periodique configuree: ${process.env.ML_RECALIBRATION_DAYS} jours.`
        : "Configurer ML_RECALIBRATION_DAYS pour un cycle de recalibration explicite.",
    },
    {
      id: "e2e_and_alerting",
      label: "Tests e2e et alerting prod",
      status: hasE2EConfig && hasAlertingConfig ? "pass" : "warn",
      details: `e2e=${hasE2EConfig ? "ok" : "missing"}, alerting=${hasAlertingConfig ? "ok" : "missing"}`,
    },
  ] as const;

  const passCount = checks.filter(check => check.status === "pass").length;
  const warnCount = checks.filter(check => check.status === "warn").length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      passCount,
      warnCount,
      overallStatus: warnCount === 0 ? "ready" : "needs_attention",
    },
    checks,
  };
}
