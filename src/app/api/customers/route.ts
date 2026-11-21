import { json, readBody, tenantApi } from "@/lib/api";
import { customerInput } from "@/lib/schemas";
import { createCustomer, listCustomers } from "@/lib/services/customers";

export async function GET(request: Request) {
  return tenantApi(request, async (ctx) => {
    const q = new URL(request.url).searchParams.get("q") || undefined;
    const customers = await listCustomers(ctx, q?.slice(0, 80));
    return json({ customers });
  });
}

export async function POST(request: Request) {
  return tenantApi(request, async (ctx) => {
    const customer = await createCustomer(ctx, await readBody(request, customerInput));
    return json({ customer }, 201);
  });
}
