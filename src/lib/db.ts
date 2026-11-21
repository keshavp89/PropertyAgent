import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  propertyAgentPool?: Pool;
  propertyAgentPrisma?: PrismaClient;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!connectionString.includes("-pooler.")) {
    throw new Error("DATABASE_URL must use the Neon pooled host");
  }
  return new Pool({
    connectionString,
    max: 1,
    ssl: { rejectUnauthorized: true },
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
  });
}

export function getPrisma() {
  if (!globalForPrisma.propertyAgentPrisma) {
    const pool = globalForPrisma.propertyAgentPool ?? createPool();
    globalForPrisma.propertyAgentPool = pool;
    globalForPrisma.propertyAgentPrisma = new PrismaClient({
      adapter: new PrismaPg(pool),
    });
  }
  return globalForPrisma.propertyAgentPrisma;
}

export type Db = ReturnType<typeof getPrisma>;
