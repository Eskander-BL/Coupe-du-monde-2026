import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { sql } from "drizzle-orm";
import { getDb } from "../server/db";
import { matches, players, teams } from "../drizzle/schema";

export default async function handler(
  _req: IncomingMessage,
  res: ServerResponse,
) {
  res.setHeader("Content-Type", "application/json");

  try {
    const db = await getDb();
    if (!db) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          ok: false,
          reason: "db_unavailable",
          hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        }),
      );
      return;
    }

    const [teamCountRow, playerCountRow, matchCountRow, topScorerCountRow] =
      await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(teams),
        db.select({ count: sql<number>`count(*)` }).from(players),
        db.select({ count: sql<number>`count(*)` }).from(matches),
        db
          .select({ count: sql<number>`count(*)` })
          .from(players)
          .where(sql`${players.goals} > 0`),
      ]);

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        counts: {
          teams: Number(teamCountRow[0]?.count ?? 0),
          players: Number(playerCountRow[0]?.count ?? 0),
          matches: Number(matchCountRow[0]?.count ?? 0),
          topScorers: Number(topScorerCountRow[0]?.count ?? 0),
        },
      }),
    );
  } catch (error) {
    console.error("[health-db] Failed:", error);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        ok: false,
        reason: "db_query_failed",
        error: error instanceof Error ? error.message : "unknown_error",
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      }),
    );
  }
}
