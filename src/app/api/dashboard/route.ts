import { json, tenantApi } from "@/lib/api";
import { dashboard } from "@/lib/services/dashboard";

export async function GET(request: Request) {
  return tenantApi(request, async (ctx) => json(await dashboard(ctx)));
}
