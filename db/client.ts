import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";

let cachedDb: NeonHttpDatabase<typeof schema> | null = null;

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Neon Postgres access.");
  }

  cachedDb = drizzle(neon(databaseUrl), { schema });
  return cachedDb;
}
