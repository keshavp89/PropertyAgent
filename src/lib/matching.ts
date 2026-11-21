import type { ListingIntent, PropertyStatus, PropertyType } from "@prisma/client";

export type MatchProperty = {
  id: string;
  title: string;
  propertyType: PropertyType;
  intent: ListingIntent;
  status: PropertyStatus;
  priceInr: number;
  bedrooms: number | null;
  areaSqft: number | null;
  city: string;
  locality: string;
  amenities: string[];
};

export type MatchRequirement = {
  intent: ListingIntent;
  propertyTypes: PropertyType[];
  minPriceInr: number | null;
  maxPriceInr: number | null;
  minBedrooms: number | null;
  maxBedrooms: number | null;
  minAreaSqft: number | null;
  cities: string[];
  localities: string[];
  amenities: string[];
};

export type MatchBand = "strong" | "possible" | "stretch";

export type RankedMatch = {
  propertyId: string;
  score: number;
  band: MatchBand;
  reasons: string[];
};

const BUDGET_STRETCH = 1.15;
const BUDGET_FLOOR = 0.7;
const AREA_FLOOR = 0.85;

function norm(value: string) {
  return value.trim().toLowerCase();
}

function bandFor(score: number): MatchBand {
  if (score >= 80) return "strong";
  if (score >= 60) return "possible";
  return "stretch";
}

function scoreOne(requirement: MatchRequirement, property: MatchProperty): RankedMatch | null {
  const reasons: string[] = [];
  if (property.intent !== requirement.intent) return null;
  if (property.status !== "AVAILABLE" && property.status !== "UNDER_OFFER") return null;

  let score = 0;

  if (requirement.propertyTypes.length === 0) {
    score += 10;
    reasons.push("Any property type was acceptable.");
  } else if (!requirement.propertyTypes.includes(property.propertyType)) {
    return null;
  } else {
    score += 15;
    reasons.push("Property type matches the brief.");
  }

  const { minPriceInr: minPrice, maxPriceInr: maxPrice } = requirement;
  if (minPrice == null && maxPrice == null) {
    score += 12;
    reasons.push("No budget was set, so price was not used as a filter.");
  } else if (maxPrice != null && property.priceInr > maxPrice * BUDGET_STRETCH) {
    return null;
  } else if (minPrice != null && property.priceInr < minPrice * BUDGET_FLOOR) {
    return null;
  } else if (maxPrice != null && property.priceInr > maxPrice) {
    const over = (property.priceInr - maxPrice) / maxPrice;
    score += over <= 0.08 ? 14 : 7;
    reasons.push(`Price is ${Math.round(over * 100)}% over the maximum budget.`);
  } else if (minPrice != null && property.priceInr < minPrice) {
    score += 12;
    reasons.push("Price is under the minimum, but still close to the brief.");
  } else {
    score += 25;
    reasons.push("Price sits inside the budget.");
  }

  const { minBedrooms, maxBedrooms } = requirement;
  if (minBedrooms == null && maxBedrooms == null) {
    score += 8;
    reasons.push("Bedroom count was not specified.");
  } else if (property.bedrooms == null) {
    score += 4;
    reasons.push("Bedroom count is not listed on this property.");
  } else if (minBedrooms != null && property.bedrooms < minBedrooms) {
    return null;
  } else if (maxBedrooms != null && property.bedrooms > maxBedrooms) {
    score += 8;
    reasons.push("More bedrooms than requested.");
  } else {
    score += 15;
    reasons.push("Bedroom count fits the brief.");
  }

  if (requirement.minAreaSqft == null) {
    score += 6;
  } else if (property.areaSqft == null) {
    score += 3;
    reasons.push("Area is not listed on this property.");
  } else if (property.areaSqft < requirement.minAreaSqft * AREA_FLOOR) {
    return null;
  } else if (property.areaSqft < requirement.minAreaSqft) {
    score += 5;
    reasons.push("Area is slightly under what was asked for.");
  } else {
    score += 10;
    reasons.push("Area meets the minimum.");
  }

  const cities = requirement.cities.map(norm).filter(Boolean);
  const localities = requirement.localities.map(norm).filter(Boolean);
  const city = norm(property.city);
  const locality = norm(property.locality);
  if (cities.length === 0) {
    score += 8;
    reasons.push("Any city was acceptable.");
  } else if (!cities.includes(city)) {
    return null;
  } else if (localities.length === 0) {
    score += 16;
    reasons.push("City matches the brief.");
  } else if (localities.includes(locality)) {
    score += 20;
    reasons.push("City and locality both match.");
  } else {
    score += 9;
    reasons.push("City matches; the locality is different.");
  }

  const wanted = requirement.amenities.map(norm).filter(Boolean);
  const have = new Set(property.amenities.map(norm));
  if (wanted.length === 0) {
    score += 6;
  } else {
    const hit = wanted.filter((item) => have.has(item)).length;
    score += Math.round((hit / wanted.length) * 10);
    reasons.push(`${hit} of ${wanted.length} requested amenities are present.`);
  }

  if (property.status === "AVAILABLE") {
    score += 5;
    reasons.push("Currently available.");
  } else {
    score += 2;
    reasons.push("Under offer, so it may not stay available.");
  }

  const capped = Math.max(0, Math.min(100, score));
  return { propertyId: property.id, score: capped, band: bandFor(capped), reasons };
}

export function rankProperties(requirement: MatchRequirement, properties: MatchProperty[]): RankedMatch[] {
  const ranked: RankedMatch[] = [];
  for (const property of properties) {
    const match = scoreOne(requirement, property);
    if (match) ranked.push(match);
  }
  const byId = new Map(properties.map((property) => [property.id, property]));
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const priceA = byId.get(a.propertyId)?.priceInr ?? 0;
    const priceB = byId.get(b.propertyId)?.priceInr ?? 0;
    return priceA - priceB;
  });
  return ranked;
}
