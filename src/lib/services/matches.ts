import "server-only";
import { getPrisma } from "../db";
import { HttpError } from "../http";
import { rankProperties, type MatchProperty, type MatchRequirement } from "../matching";
import type { TenantContext } from "../tenant";
import { getCustomer } from "./customers";

export async function matchCustomer(ctx: TenantContext, customerId: string) {
  const customer = await getCustomer(ctx, customerId);
  const active = customer.requirements.find((requirement) => requirement.active);
  if (!active) throw new HttpError(404, "Add a requirement before matching properties.");
  const requirement: MatchRequirement = {
    intent: active.intent,
    propertyTypes: active.propertyTypes,
    minPriceInr: active.minPriceInr,
    maxPriceInr: active.maxPriceInr,
    minBedrooms: active.minBedrooms,
    maxBedrooms: active.maxBedrooms,
    minAreaSqft: active.minAreaSqft,
    cities: active.cities,
    localities: active.localities,
    amenities: active.amenities,
  };
  const prisma = getPrisma();
  const candidates = await prisma.property.findMany({
    where: {
      organizationId: ctx.organizationId,
      intent: active.intent,
      status: { in: ["AVAILABLE", "UNDER_OFFER"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });
  const properties: MatchProperty[] = candidates.map((property) => ({
    id: property.id,
    title: property.title,
    propertyType: property.propertyType,
    intent: property.intent,
    status: property.status,
    priceInr: property.priceInr,
    bedrooms: property.bedrooms,
    areaSqft: property.areaSqft,
    city: property.city,
    locality: property.locality,
    amenities: property.amenities,
  }));
  const ranked = rankProperties(requirement, properties);
  const byId = new Map(candidates.map((property) => [property.id, property]));
  return {
    requirement: active,
    matches: ranked.map((match) => {
      const property = byId.get(match.propertyId);
      return { ...match, property };
    }),
  };
}
