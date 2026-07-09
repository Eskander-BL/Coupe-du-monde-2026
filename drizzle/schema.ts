import { boolean, integer, numeric, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== WORLD CUP 2026 TABLES ====================

/**
 * Confederations (AFC, CAF, CONCACAF, CONMEBOL, OFC, UEFA)
 */
export const confederations = pgTable("confederations", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // AFC, CAF, etc.
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Confederation = typeof confederations.$inferSelect;
export type InsertConfederation = typeof confederations.$inferInsert;

/**
 * Teams - 48 teams qualified for World Cup 2026
 */
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 3 }).notNull().unique(), // ARG, BRA, FRA, etc.
  name: varchar("name", { length: 100 }).notNull(),
  confederationId: integer("confederationId").notNull(),
  groupId: varchar("groupId", { length: 1 }).notNull(), // A-L
  flagUrl: text("flagUrl"), // URL to flag image
  offensiveStrength: numeric("offensiveStrength", { precision: 3, scale: 1 }), // 0-10 rating
  defensiveStrength: numeric("defensiveStrength", { precision: 3, scale: 1 }), // 0-10 rating
  overallRating: numeric("overallRating", { precision: 3, scale: 1 }), // 0-10 rating
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

/**
 * Groups - 12 groups (A-L) for group stage
 */
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  letter: varchar("letter", { length: 1 }).notNull().unique(), // A-L
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Matches - 104 total matches
 */
export const stageEnum = pgEnum("stage", ["group", "round32", "round16", "quarterfinal", "semifinal", "final", "thirdplace"]);
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "completed"]);

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  matchNumber: integer("matchNumber").notNull().unique(), // 1-104
  homeTeamId: integer("homeTeamId").notNull(),
  awayTeamId: integer("awayTeamId").notNull(),
  homeGoals: integer("homeGoals"),
  awayGoals: integer("awayGoals"),
  matchDate: timestamp("matchDate").notNull(),
  stadium: varchar("stadium", { length: 150 }),
  city: varchar("city", { length: 100 }),
  stage: stageEnum("stage").notNull(),
  groupId: varchar("groupId", { length: 1 }), // Only for group stage
  status: matchStatusEnum("status").default("scheduled").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

/**
 * Players - All players in the tournament
 */
export const playerPositionEnum = pgEnum("player_position", ["GK", "DF", "MF", "FW"]);

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  photoUrl: text("photoUrl"),
  teamId: integer("teamId").notNull(),
  position: playerPositionEnum("position").notNull(),
  number: integer("number"),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  minutesPlayed: integer("minutesPlayed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Match Goals - Track goals scored in each match
 */
export const matchGoals = pgTable("matchGoals", {
  id: serial("id").primaryKey(),
  matchId: integer("matchId").notNull(),
  playerId: integer("playerId").notNull(),
  teamId: integer("teamId").notNull(),
  minute: integer("minute").notNull(),
  isOwnGoal: boolean("isOwnGoal").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchGoal = typeof matchGoals.$inferSelect;
export type InsertMatchGoal = typeof matchGoals.$inferInsert;

/**
 * Match Assists - Track assists in each match
 */
export const matchAssists = pgTable("matchAssists", {
  id: serial("id").primaryKey(),
  matchId: integer("matchId").notNull(),
  playerId: integer("playerId").notNull(),
  teamId: integer("teamId").notNull(),
  goalId: integer("goalId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchAssist = typeof matchAssists.$inferSelect;
export type InsertMatchAssist = typeof matchAssists.$inferInsert;

/**
 * Group Standings - Calculated standings for each group
 */
export const groupStandings = pgTable("groupStandings", {
  id: serial("id").primaryKey(),
  groupId: varchar("groupId", { length: 1 }).notNull(),
  teamId: integer("teamId").notNull(),
  wins: integer("wins").default(0).notNull(),
  draws: integer("draws").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  goalsFor: integer("goalsFor").default(0).notNull(),
  goalsAgainst: integer("goalsAgainst").default(0).notNull(),
  points: integer("points").default(0).notNull(),
  position: integer("position"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type GroupStanding = typeof groupStandings.$inferSelect;
export type InsertGroupStanding = typeof groupStandings.$inferInsert;

/**
 * Predictions - Store statistical predictions for tournament outcomes
 */
export const predictionTypeEnum = pgEnum("prediction_type", ["tournamentWinner", "topScorer", "bestPlayer"]);

export const predictions = pgTable("predictions", {
  id: serial("id").primaryKey(),
  predictionType: predictionTypeEnum("predictionType").notNull(),
  teamId: integer("teamId"),
  playerId: integer("playerId"),
  probability: numeric("probability", { precision: 5, scale: 2 }).notNull(), // 0-100
  reasoning: text("reasoning"),
  rank: integer("rank"), // 1st, 2nd, 3rd prediction
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;
