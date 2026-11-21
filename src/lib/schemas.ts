import { z } from "zod";

export class InputError extends Error {}
import {
  CUSTOMER_KINDS,
  ENQUIRY_STATUSES,
  FOLLOW_UP_KINDS,
  FURNISHINGS,
  INTENTS,
  PROPERTY_TYPES,
  STATUSES,
} from "./labels";

const money = z.number().int().positive().max(2_000_000_000);
const optionalMoney = money.nullable().optional();
const textList = z.array(z.string().trim().min(1).max(40)).max(20);

export const recordId = z.string().regex(/^c[a-z0-9]{8,32}$/);
export const userId = z.uuid();

function cleanList(values: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    next.push(trimmed);
  }
  return next;
}

export const requirementInput = z.object({
  intent: z.enum(INTENTS),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)).max(8),
  minPriceInr: optionalMoney,
  maxPriceInr: optionalMoney,
  minBedrooms: z.number().int().min(0).max(20).nullable().optional(),
  maxBedrooms: z.number().int().min(0).max(20).nullable().optional(),
  minAreaSqft: z.number().int().positive().max(1_000_000).nullable().optional(),
  cities: textList.default([]),
  localities: textList.default([]),
  amenities: textList.default([]),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const propertyInput = z.object({
  title: z.string().trim().min(3).max(120),
  propertyType: z.enum(PROPERTY_TYPES),
  intent: z.enum(INTENTS),
  status: z.enum(STATUSES).default("AVAILABLE"),
  priceInr: money,
  depositInr: optionalMoney,
  maintenanceInr: optionalMoney,
  bedrooms: z.number().int().min(0).max(20).nullable().optional(),
  bathrooms: z.number().int().min(0).max(20).nullable().optional(),
  areaSqft: z.number().int().positive().max(1_000_000).nullable().optional(),
  floor: z.number().int().min(0).max(200).nullable().optional(),
  totalFloors: z.number().int().min(0).max(200).nullable().optional(),
  city: z.string().trim().min(2).max(60),
  locality: z.string().trim().min(2).max(80),
  addressLine: z.string().trim().max(160).nullable().optional(),
  furnishing: z.enum(FURNISHINGS).default("UNFURNISHED"),
  amenities: textList.default([]),
  description: z.string().trim().min(10).max(4000),
});

export const customerInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20).regex(/^[0-9+\-\s()]+$/),
  email: z.email().max(120).nullable().optional().or(z.literal("")).transform((value) => value || null),
  kind: z.enum(CUSTOMER_KINDS),
  notes: z.string().trim().max(2000).nullable().optional(),
  assignedUserId: userId.optional(),
  requirement: requirementInput,
});

export const customerPatch = customerInput.omit({ requirement: true, assignedUserId: true }).extend({
  assignedUserId: userId.optional(),
});

export const enquiryInput = z.object({
  customerId: recordId,
  propertyId: recordId.nullable().optional(),
  source: z.string().trim().min(2).max(40),
  message: z.string().trim().min(2).max(2000),
  status: z.enum(ENQUIRY_STATUSES).default("NEW"),
});

export const enquiryPatch = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});

export const followUpInput = z.object({
  customerId: recordId,
  enquiryId: recordId.nullable().optional(),
  kind: z.enum(FOLLOW_UP_KINDS).exclude(["REQUIREMENT_CHANGE"]),
  notes: z.string().trim().min(2).max(2000),
  dueAt: z.iso.datetime().nullable().optional(),
});

export const followUpPatch = z.object({
  completed: z.boolean(),
});

export const requirementChangeInput = requirementInput.extend({
  notes: z.string().trim().min(2).max(2000),
});

export const organizationSelect = z.object({
  organizationId: userId,
});

export const listQuery = z.object({
  q: z.string().trim().max(80).optional(),
  intent: z.enum(INTENTS).optional(),
  status: z.enum(STATUSES).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  city: z.string().trim().max(60).optional(),
  enquiryStatus: z.enum(ENQUIRY_STATUSES).optional(),
});

export function parseJson<T>(schema: z.ZodType<T>, payload: unknown): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    throw new InputError(`${path}${issue?.message ?? "Invalid input."}`);
  }
  return parsed.data;
}

export function normalizeRequirement<T extends { cities: string[]; localities: string[]; amenities: string[] }>(
  input: T,
) {
  return {
    ...input,
    cities: cleanList(input.cities),
    localities: cleanList(input.localities),
    amenities: cleanList(input.amenities).map((item) => item.toLowerCase()),
  };
}

export function normalizePropertyAmenities<T extends { amenities: string[] }>(input: T) {
  return { ...input, amenities: cleanList(input.amenities).map((item) => item.toLowerCase()) };
}
