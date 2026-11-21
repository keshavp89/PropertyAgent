import { json, readBody, tenantApi } from "@/lib/api";
import { HttpError } from "@/lib/http";
import { recordId, requirementChangeInput } from "@/lib/schemas";
import { changeRequirement } from "@/lib/services/customers";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    const { id } = await context.params;
    const parsed = recordId.safeParse(id);
    if (!parsed.success) throw new HttpError(404, "Customer not found.");
    const requirement = await changeRequirement(ctx, parsed.data, await readBody(request, requirementChangeInput));
    return json({ requirement }, 201);
  });
}
