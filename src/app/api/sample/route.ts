import { json, tenantApi } from "@/lib/api";
import { loadSampleDesk } from "@/lib/sample";

export async function POST(request: Request) {
  return tenantApi(request, async (ctx) => {
    await loadSampleDesk(ctx);
    return json({ ok: true }, 201);
  });
}
