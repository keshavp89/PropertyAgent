import "server-only";
import type { Prisma } from "@prisma/client";
import { canEditProperty } from "../access";
import { getPrisma } from "../db";
import { HttpError } from "../http";
import { normalizePropertyAmenities, type propertyInput } from "../schemas";
import type { TenantContext } from "../tenant";
import type { z } from "zod";

type PropertyInput = z.infer<typeof propertyInput>;

function dataFrom(input: PropertyInput, ctx: TenantContext): Prisma.PropertyUncheckedCreateInput {
  const normalized = normalizePropertyAmenities(input);
  return {
    organizationId: ctx.organizationId,
    title: normalized.title,
    propertyType: normalized.propertyType,
    intent: normalized.intent,
    status: normalized.status,
    priceInr: normalized.priceInr,
    depositInr: normalized.depositInr ?? null,
    maintenanceInr: normalized.maintenanceInr ?? null,
    bedrooms: normalized.bedrooms ?? null,
    bathrooms: normalized.bathrooms ?? null,
    areaSqft: normalized.areaSqft ?? null,
    floor: normalized.floor ?? null,
    totalFloors: normalized.totalFloors ?? null,
    city: normalized.city,
    locality: normalized.locality,
    addressLine: normalized.addressLine || null,
    furnishing: normalized.furnishing,
    amenities: normalized.amenities,
    description: normalized.description,
    listedByUserId: ctx.user.id,
  };
}

export async function listProperties(
  ctx: TenantContext,
  filters: { q?: string; intent?: PropertyInput["intent"]; status?: PropertyInput["status"]; propertyType?: PropertyInput["propertyType"]; city?: string },
) {
  const prisma = getPrisma();
  const where: Prisma.PropertyWhereInput = {
    organizationId: ctx.organizationId,
    ...(filters.intent ? { intent: filters.intent } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
    ...(filters.city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { locality: { contains: filters.q, mode: "insensitive" } },
            { city: { contains: filters.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  return prisma.property.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function getProperty(ctx: TenantContext, id: string) {
  const prisma = getPrisma();
  const property = await prisma.property.findFirst({
    where: { id, organizationId: ctx.organizationId },
  });
  if (!property) throw new HttpError(404, "Property not found.");
  return property;
}

export async function createProperty(ctx: TenantContext, input: PropertyInput) {
  const prisma = getPrisma();
  return prisma.property.create({ data: dataFrom(input, ctx) });
}

export async function updateProperty(ctx: TenantContext, id: string, input: PropertyInput) {
  const existing = await getProperty(ctx, id);
  if (!canEditProperty(ctx.role, ctx.user.id, existing.listedByUserId)) {
    throw new HttpError(403, "You can edit listings you added. Owners and admins can edit every listing.");
  }
  const prisma = getPrisma();
  const data = dataFrom(input, ctx);
  return prisma.property.update({
    where: { id: existing.id },
    data: {
      ...data,
      listedByUserId: existing.listedByUserId,
      organizationId: existing.organizationId,
    },
  });
}

export async function deleteProperty(ctx: TenantContext, id: string) {
  const existing = await getProperty(ctx, id);
  if (!canEditProperty(ctx.role, ctx.user.id, existing.listedByUserId)) {
    throw new HttpError(403, "You can remove listings you added. Owners and admins can remove every listing.");
  }
  const prisma = getPrisma();
  await prisma.property.delete({ where: { id: existing.id } });
}
