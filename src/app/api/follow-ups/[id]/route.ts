import { json, readBody, tenantApi } from "@/lib/api";
import { HttpError } from "@/lib/http";
import { followUpPatch, recordId } from "@/lib/schemas";
import { setFollowUpCompleted } from "@/lib/services/follow-ups";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    const { id } = await context.params;
    const parsed = recordId.safeParse(id);
    if (!parsed.success) throw new HttpError(404, "Follow-up not found.");
    const body = await readBody(request, followUpPatch);
    const followUp = await setFollowUpCompleted(ctx, parsed.data, body.completed);
    return json({ followUp });
  });
}
