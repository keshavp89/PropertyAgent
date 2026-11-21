import { json, readBody, tenantApi } from "@/lib/api";
import { HttpError } from "@/lib/http";
import { enquiryPatch, recordId } from "@/lib/schemas";
import { updateEnquiryStatus } from "@/lib/services/enquiries";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    const { id } = await context.params;
    const parsed = recordId.safeParse(id);
    if (!parsed.success) throw new HttpError(404, "Enquiry not found.");
    const body = await readBody(request, enquiryPatch);
    const enquiry = await updateEnquiryStatus(ctx, parsed.data, body.status);
    return json({ enquiry });
  });
}
