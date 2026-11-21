import "server-only";
import { ZodError } from "zod";
import { HttpError, assertRateLimit, json, readJson, withApi } from "./http";
import { InputError, parseJson } from "./schemas";
import { requireApiTenant, type TenantContext } from "./tenant";
import type { z } from "zod";

export async function tenantApi(request: Request, run: (ctx: TenantContext) => Promise<Response>) {
  return withApi(request, async () => {
    const ctx = await requireApiTenant();
    await assertRateLimit(ctx.user.id, request.method);
    try {
      return await run(ctx);
    } catch (error) {
      if (error instanceof InputError) throw new HttpError(400, error.message);
      if (error instanceof ZodError) {
        throw new HttpError(400, error.issues[0]?.message ?? "Invalid input.");
      }
      throw error;
    }
  });
}

export async function readBody<T>(request: Request, schema: z.ZodType<T>) {
  return parseJson(schema, await readJson(request));
}

export { json };
