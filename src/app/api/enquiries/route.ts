import { json, readBody, tenantApi } from "@/lib/api";
import { enquiryInput, listQuery } from "@/lib/schemas";
import { createEnquiry, listEnquiries } from "@/lib/services/enquiries";

export async function GET(request: Request) {
  return tenantApi(request, async (ctx) => {
    const filters = listQuery.parse({
      enquiryStatus: new URL(request.url).searchParams.get("status") || undefined,
    });
    const enquiries = await listEnquiries(ctx, filters.enquiryStatus);
    return json({ enquiries });
  });
}

export async function POST(request: Request) {
  return tenantApi(request, async (ctx) => {
    const enquiry = await createEnquiry(ctx, await readBody(request, enquiryInput));
    return json({ enquiry }, 201);
  });
}
