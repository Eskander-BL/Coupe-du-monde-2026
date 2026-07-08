import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllTeams,
  getTeamById,
  getTeamsByGroup,
  getAllConfederations,
  getTeamsByConfederation,
  getGroupStandings,
  getAllGroupStandings,
  getMatchesByStage,
  getAllMatches,
  getTopScorers,
  getTopAssisters,
  getAllPlayers,
  getPlayersByTeam,
  getPredictions,
  getTournamentStats,
  getModelValidationReport,
  getDataQualityReport,
  getTeamReadinessReport,
  getMlTournamentForecast,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== WORLD CUP ROUTERS ====================

  teams: router({
    // Get all teams
    getAll: publicProcedure.query(async () => {
      return await getAllTeams();
    }),

    // Get team by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getTeamById(input.id);
      }),

    // Get teams by group
    getByGroup: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .query(async ({ input }) => {
        return await getTeamsByGroup(input.groupId);
      }),

    // Get teams by confederation
    getByConfederation: publicProcedure
      .input(z.object({ confederationId: z.number() }))
      .query(async ({ input }) => {
        return await getTeamsByConfederation(input.confederationId);
      }),
  }),

  confederations: router({
    // Get all confederations
    getAll: publicProcedure.query(async () => {
      return await getAllConfederations();
    }),
  }),

  standings: router({
    // Get standings for a specific group
    getGroup: publicProcedure
      .input(z.object({ groupId: z.string() }))
      .query(async ({ input }) => {
        return await getGroupStandings(input.groupId);
      }),

    // Get all group standings
    getAll: publicProcedure.query(async () => {
      return await getAllGroupStandings();
    }),
  }),

  matches: router({
    // Get all matches
    getAll: publicProcedure.query(async () => {
      return await getAllMatches();
    }),

    // Get matches by stage
    getByStage: publicProcedure
      .input(z.object({ stage: z.string() }))
      .query(async ({ input }) => {
        return await getMatchesByStage(input.stage);
      }),
  }),

  players: router({
    // Get all players with team info
    getAll: publicProcedure.query(async () => {
      return await getAllPlayers();
    }),

    // Get top scorers
    getTopScorers: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return await getTopScorers(input.limit);
      }),

    // Get top assisters
    getTopAssisters: publicProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return await getTopAssisters(input.limit);
      }),

    // Get players by team
    getByTeam: publicProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return await getPlayersByTeam(input.teamId);
      }),
  }),

  predictions: router({
    // Get predictions
    getAll: publicProcedure
      .input(z.object({ type: z.string().optional() }))
      .query(async ({ input }) => {
        return await getPredictions(input.type);
      }),
  }),

  stats: router({
    // Get tournament statistics
    getTournamentStats: publicProcedure.query(async () => {
      return await getTournamentStats();
    }),
    getModelValidation: publicProcedure.query(async () => {
      return await getModelValidationReport();
    }),
    getDataQuality: publicProcedure.query(async () => {
      return await getDataQualityReport();
    }),
    getTeamReadiness: publicProcedure.query(async () => {
      return await getTeamReadinessReport();
    }),
    getMlForecast: publicProcedure.query(async () => {
      return await getMlTournamentForecast();
    }),
  }),
});

export type AppRouter = typeof appRouter;
