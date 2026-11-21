import assert from "node:assert/strict";
import test from "node:test";
import { rankProperties, type MatchProperty, type MatchRequirement } from "./matching.ts";

const requirement: MatchRequirement = {
  intent: "SALE",
  propertyTypes: ["APARTMENT"],
  minPriceInr: 8_000_000,
  maxPriceInr: 10_000_000,
  minBedrooms: 2,
  maxBedrooms: 3,
  minAreaSqft: 900,
  cities: ["Bengaluru"],
  localities: ["Indiranagar"],
  amenities: ["parking", "lift"],
};

function property(overrides: Partial<MatchProperty> = {}): MatchProperty {
  return {
    id: "p1",
    title: "Light-filled flat",
    propertyType: "APARTMENT",
    intent: "SALE",
    status: "AVAILABLE",
    priceInr: 9_500_000,
    bedrooms: 3,
    areaSqft: 1100,
    city: "Bengaluru",
    locality: "Indiranagar",
    amenities: ["parking", "lift", "power backup"],
    ...overrides,
  };
}

test("a close listing ranks as a strong match", () => {
  const [match] = rankProperties(requirement, [property()]);
  assert.ok(match);
  assert.equal(match.band, "strong");
  assert.ok(match.score >= 80);
  assert.ok(match.reasons.some((reason) => reason.includes("inside the budget")));
});

test("intent, city, type, bedrooms, area, and stretched budget are hard filters", () => {
  const cases: MatchProperty[] = [
    property({ id: "rent", intent: "RENT" }),
    property({ id: "city", city: "Mumbai" }),
    property({ id: "type", propertyType: "VILLA" }),
    property({ id: "beds", bedrooms: 1 }),
    property({ id: "area", areaSqft: 700 }),
    property({ id: "price", priceInr: 11_500_001 }),
    property({ id: "sold", status: "SOLD" }),
    property({ id: "cheap", priceInr: 5_000_000 }),
  ];
  const ranked = rankProperties(requirement, cases);
  assert.deepEqual(
    ranked.map((match) => match.propertyId),
    [],
  );
});

test("a listing 10% over budget stays visible and ranks below an in-budget listing", () => {
  const ranked = rankProperties(requirement, [
    property({ id: "stretch", priceInr: 11_000_000 }),
    property({ id: "fit", priceInr: 9_000_000 }),
  ]);
  assert.deepEqual(
    ranked.map((match) => match.propertyId),
    ["fit", "stretch"],
  );
  assert.ok(ranked[1].reasons.some((reason) => reason.includes("over the maximum")));
});

test("the exact 15% budget boundary is still included", () => {
  const ranked = rankProperties(requirement, [property({ id: "edge", priceInr: 11_500_000 })]);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].propertyId, "edge");
});

test("equal scores prefer the lower price", () => {
  const ranked = rankProperties(
    { ...requirement, amenities: [], localities: [], minPriceInr: null, maxPriceInr: null },
    [
      property({ id: "dear", priceInr: 9_800_000, amenities: [] }),
      property({ id: "dear-too", priceInr: 9_200_000, amenities: [] }),
    ],
  );
  assert.deepEqual(
    ranked.map((match) => match.propertyId),
    ["dear-too", "dear"],
  );
  assert.equal(ranked[0].score, ranked[1].score);
});

test("amenity overlap is explained", () => {
  const [match] = rankProperties(requirement, [property({ amenities: ["parking"] })]);
  assert.ok(match.reasons.some((reason) => reason === "1 of 2 requested amenities are present."));
});
