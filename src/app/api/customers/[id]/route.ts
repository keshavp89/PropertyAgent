import { json, readBody, tenantApi } from "@/lib/api";
import { HttpError } from "@/lib/http";
import { customerPatch, recordId } from "@/lib/schemas";
import { getCustomer, updateCustomer } from "@/lib/services/customers";

async function idFrom(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = recordId.safeParse(id);
  if (!parsed.success) throw new HttpError(404, "Customer not found.");
  return parsed.data;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => json({ customer: await getCustomer(ctx, await idFrom(context.params)) }));
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    const customer = await updateCustomer(ctx, await idFrom(context.params), await readBody(request, customerPatch));
    return json({ customer });
  });
}
