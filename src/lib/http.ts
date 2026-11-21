import "server-only";
import { Prisma } from "@prisma/client";
import { getPrisma } from "./db";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Request body must be JSON.");
  }
}

const LIMITS = { read: 180, write: 40 } as const;

export async function assertRateLimit(userId: string, method: string) {
  const bucket = method === "GET" || method === "HEAD" ? "read" : "write";
  const limit = LIMITS[bucket];
  const key = `${bucket}:${userId}`;
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    INSERT INTO "RateLimit" ("key", "windowStart", "count")
    VALUES (${key}, NOW(), 1)
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" < NOW() - INTERVAL '60 seconds' THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" < NOW() - INTERVAL '60 seconds' THEN NOW()
        ELSE "RateLimit"."windowStart"
      END
    RETURNING "count"
  `);
  const count = rows[0]?.count ?? limit + 1;
  if (count > limit) {
    throw new HttpError(429, "Too many requests. Wait a minute and try again.");
  }
}

export async function withApi(request: Request, run: () => Promise<Response>) {
  try {
    return await run();
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error(error);
    return json({ error: "Something went wrong." }, 500);
  }
}
