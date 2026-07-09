import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { getDb } from "../server/db";
import { teams, players, matches } from "../drizzle/schema";
import { sql } from "drizzle-orm";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/health-db", async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      res.status(500).json({
        ok: false,
        reason: "db_unavailable",
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      });
      return;
    }

    const teamCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams);
    const playerCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(players);
    const matchCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches);
    const topScorerCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(sql`${players.goals} > 0`);

    res.status(200).json({
      ok: true,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      counts: {
        teams: Number(teamCountRow[0]?.count ?? 0),
        players: Number(playerCountRow[0]?.count ?? 0),
        matches: Number(matchCountRow[0]?.count ?? 0),
        topScorers: Number(topScorerCountRow[0]?.count ?? 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      reason: "db_query_failed",
      error: error instanceof Error ? error.message : "unknown_error",
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    });
  }
});

app.get("/api/health-db", async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) {
      res.status(500).json({
        ok: false,
        reason: "db_unavailable",
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      });
      return;
    }

    const teamCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams);
    const playerCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(players);
    const matchCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(matches);
    const topScorerCountRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(sql`${players.goals} > 0`);

    res.status(200).json({
      ok: true,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      counts: {
        teams: Number(teamCountRow[0]?.count ?? 0),
        players: Number(playerCountRow[0]?.count ?? 0),
        matches: Number(matchCountRow[0]?.count ?? 0),
        topScorers: Number(topScorerCountRow[0]?.count ?? 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      reason: "db_query_failed",
      error: error instanceof Error ? error.message : "unknown_error",
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    });
  }
});

export default app;
