import { json, readBody, tenantApi } from "@/lib/api";
import { HttpError } from "@/lib/http";
import { propertyInput, recordId } from "@/lib/schemas";
import { deleteProperty, getProperty, updateProperty } from "@/lib/services/properties";

async function idFrom(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = recordId.safeParse(id);
  if (!parsed.success) throw new HttpError(404, "Property not found.");
  return parsed.data;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    const property = await getProperty(ctx, await idFrom(context.params));
    return json({ property });
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    const property = await updateProperty(ctx, await idFrom(context.params), await readBody(request, propertyInput));
    return json({ property });
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return tenantApi(request, async (ctx) => {
    await deleteProperty(ctx, await idFrom(context.params));
    return json({ ok: true });
  });
}
