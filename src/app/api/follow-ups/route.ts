import { json, readBody, tenantApi } from "@/lib/api";
import { followUpInput } from "@/lib/schemas";
import { createFollowUp, listFollowUps } from "@/lib/services/follow-ups";

export async function GET(request: Request) {
  return tenantApi(request, async (ctx) => json({ followUps: await listFollowUps(ctx) }));
}

export async function POST(request: Request) {
  return tenantApi(request, async (ctx) => {
    const followUp = await createFollowUp(ctx, await readBody(request, followUpInput));
    return json({ followUp }, 201);
  });
}
