import { json, tenantApi } from "@/lib/api";
import { HttpError } from "@/lib/http";
import { recordId } from "@/lib/schemas";
import { matchCustomer } from "@/lib/services/matches";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    const { id } = await context.params;
    const parsed = recordId.safeParse(id);
    if (!parsed.success) throw new HttpError(404, "Customer not found.");
    return json(await matchCustomer(ctx, parsed.data));
  });
}
