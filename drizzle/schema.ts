import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== WORLD CUP 2026 TABLES ====================

/**
 * Confederations (AFC, CAF, CONCACAF, CONMEBOL, OFC, UEFA)
 */
export const confederations = mysqlTable("confederations", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // AFC, CAF, etc.
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Confederation = typeof confederations.$inferSelect;
export type InsertConfederation = typeof confederations.$inferInsert;

/**
 * Teams - 48 teams qualified for World Cup 2026
 */
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(), // ARG, BRA, FRA, etc.
  name: varchar("name", { length: 100 }).notNull(),
  confederationId: int("confederationId").notNull(),
  groupId: varchar("groupId", { length: 1 }).notNull(), // A-L
  flagUrl: text("flagUrl"), // URL to flag image
  offensiveStrength: decimal("offensiveStrength", { precision: 3, scale: 1 }), // 0-10 rating
  defensiveStrength: decimal("defensiveStrength", { precision: 3, scale: 1 }), // 0-10 rating
  overallRating: decimal("overallRating", { precision: 3, scale: 1 }), // 0-10 rating
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Groups - 12 groups (A-L) for group stage
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  letter: varchar("letter", { length: 1 }).notNull().unique(), // A-L
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Matches - 104 total matches
 */
export const matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  matchNumber: int("matchNumber").notNull().unique(), // 1-104
  homeTeamId: int("homeTeamId").notNull(),
  awayTeamId: int("awayTeamId").notNull(),
  homeGoals: int("homeGoals"),
  awayGoals: int("awayGoals"),
  matchDate: timestamp("matchDate").notNull(),
  stadium: varchar("stadium", { length: 150 }),
  city: varchar("city", { length: 100 }),
  stage: mysqlEnum("stage", ["group", "round32", "round16", "quarterfinal", "semifinal", "final", "thirdplace"]).notNull(),
  groupId: varchar("groupId", { length: 1 }), // Only for group stage
  status: mysqlEnum("status", ["scheduled", "live", "completed"]).default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Players - All players in the tournament
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  photoUrl: text("photoUrl"),
  teamId: int("teamId").notNull(),
  position: mysqlEnum("position", ["GK", "DF", "MF", "FW"]).notNull(),
  number: int("number"),
  goals: int("goals").default(0).notNull(),
  assists: int("assists").default(0).notNull(),
  minutesPlayed: int("minutesPlayed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Match Goals - Track goals scored in each match
 */
export const matchGoals = mysqlTable("matchGoals", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  playerId: int("playerId").notNull(),
  teamId: int("teamId").notNull(),
  minute: int("minute").notNull(),
  isOwnGoal: boolean("isOwnGoal").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchGoal = typeof matchGoals.$inferSelect;
export type InsertMatchGoal = typeof matchGoals.$inferInsert;

/**
 * Match Assists - Track assists in each match
 */
export const matchAssists = mysqlTable("matchAssists", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  playerId: int("playerId").notNull(),
  teamId: int("teamId").notNull(),
  goalId: int("goalId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchAssist = typeof matchAssists.$inferSelect;
export type InsertMatchAssist = typeof matchAssists.$inferInsert;

/**
 * Group Standings - Calculated standings for each group
 */
export const groupStandings = mysqlTable("groupStandings", {
  id: int("id").autoincrement().primaryKey(),
  groupId: varchar("groupId", { length: 1 }).notNull(),
  teamId: int("teamId").notNull(),
  wins: int("wins").default(0).notNull(),
  draws: int("draws").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  goalsFor: int("goalsFor").default(0).notNull(),
  goalsAgainst: int("goalsAgainst").default(0).notNull(),
  points: int("points").default(0).notNull(),
  position: int("position"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GroupStanding = typeof groupStandings.$inferSelect;
export type InsertGroupStanding = typeof groupStandings.$inferInsert;

/**
 * Predictions - Store statistical predictions for tournament outcomes
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  predictionType: mysqlEnum("predictionType", ["tournamentWinner", "topScorer", "bestPlayer"]).notNull(),
  teamId: int("teamId"),
  playerId: int("playerId"),
  probability: decimal("probability", { precision: 5, scale: 2 }).notNull(), // 0-100
  reasoning: text("reasoning"),
  rank: int("rank"), // 1st, 2nd, 3rd prediction
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;
