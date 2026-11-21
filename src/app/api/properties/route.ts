import { json, readBody, tenantApi } from "@/lib/api";
import { listQuery, propertyInput } from "@/lib/schemas";
import { createProperty, listProperties } from "@/lib/services/properties";

export async function GET(request: Request) {
  return tenantApi(request, async (ctx) => {
    const url = new URL(request.url);
    const filters = listQuery.parse({
      q: url.searchParams.get("q") || undefined,
      intent: url.searchParams.get("intent") || undefined,
      status: url.searchParams.get("status") || undefined,
      propertyType: url.searchParams.get("propertyType") || undefined,
      city: url.searchParams.get("city") || undefined,
    });
    const properties = await listProperties(ctx, filters);
    return json({ properties });
  });
}

export async function POST(request: Request) {
  return tenantApi(request, async (ctx) => {
    const body = await readBody(request, propertyInput);
    const property = await createProperty(ctx, body);
    return json({ property }, 201);
  });
}
