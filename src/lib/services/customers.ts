import "server-only";
import type { Prisma } from "@prisma/client";
import { canViewCustomer, isManager } from "../access";
import { getPrisma } from "../db";
import { HttpError } from "../http";
import { normalizeRequirement, type customerInput, type customerPatch, type requirementChangeInput } from "../schemas";
import { userIsMember, type TenantContext } from "../tenant";
import type { z } from "zod";

type CustomerInput = z.infer<typeof customerInput>;
type CustomerPatch = z.infer<typeof customerPatch>;
type RequirementChange = z.infer<typeof requirementChangeInput>;

function customerScope(ctx: TenantContext): Prisma.CustomerWhereInput {
  if (isManager(ctx.role)) return { organizationId: ctx.organizationId };
  return { organizationId: ctx.organizationId, assignedUserId: ctx.user.id };
}

async function assigneeFor(ctx: TenantContext, requested?: string) {
  if (!isManager(ctx.role)) return ctx.user.id;
  const assignee = requested ?? ctx.user.id;
  if (!(await userIsMember(ctx.organizationId, assignee))) {
    throw new HttpError(400, "Assign the customer to someone in this brokerage.");
  }
  return assignee;
}

export async function listCustomers(ctx: TenantContext, q?: string) {
  const prisma = getPrisma();
  return prisma.customer.findMany({
    where: {
      ...customerScope(ctx),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      requirements: { where: { active: true }, take: 1 },
      enquiries: { where: { status: { notIn: ["WON", "LOST"] } }, select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function getCustomer(ctx: TenantContext, id: string) {
  const prisma = getPrisma();
  const customer = await prisma.customer.findFirst({
    where: { id, ...customerScope(ctx) },
    include: {
      requirements: { orderBy: { version: "desc" } },
      enquiries: { orderBy: { createdAt: "desc" }, include: { property: { select: { id: true, title: true } } } },
      followUps: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!customer || !canViewCustomer(ctx.role, ctx.user.id, customer.assignedUserId)) {
    throw new HttpError(404, "Customer not found.");
  }
  return customer;
}

export async function createCustomer(ctx: TenantContext, input: CustomerInput) {
  const assignedUserId = await assigneeFor(ctx, input.assignedUserId);
  const requirement = normalizeRequirement(input.requirement);
  const prisma = getPrisma();
  return prisma.customer.create({
    data: {
      organizationId: ctx.organizationId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      kind: input.kind,
      notes: input.notes || null,
      assignedUserId,
      requirements: {
        create: {
          organizationId: ctx.organizationId,
          version: 1,
          active: true,
          intent: requirement.intent,
          propertyTypes: requirement.propertyTypes,
          minPriceInr: requirement.minPriceInr ?? null,
          maxPriceInr: requirement.maxPriceInr ?? null,
          minBedrooms: requirement.minBedrooms ?? null,
          maxBedrooms: requirement.maxBedrooms ?? null,
          minAreaSqft: requirement.minAreaSqft ?? null,
          cities: requirement.cities,
          localities: requirement.localities,
          amenities: requirement.amenities,
          notes: requirement.notes || null,
          createdByUserId: ctx.user.id,
        },
      },
    },
  });
}

export async function updateCustomer(ctx: TenantContext, id: string, input: CustomerPatch) {
  const existing = await getCustomer(ctx, id);
  const assignedUserId = await assigneeFor(ctx, input.assignedUserId ?? existing.assignedUserId);
  const prisma = getPrisma();
  return prisma.customer.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      kind: input.kind,
      notes: input.notes || null,
      assignedUserId,
    },
  });
}

export async function changeRequirement(ctx: TenantContext, customerId: string, input: RequirementChange) {
  const customer = await getCustomer(ctx, customerId);
  const requirement = normalizeRequirement(input);
  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const current = await tx.requirement.findFirst({
      where: { customerId: customer.id, organizationId: ctx.organizationId },
      orderBy: { version: "desc" },
    });
    await tx.requirement.updateMany({
      where: { customerId: customer.id, organizationId: ctx.organizationId, active: true },
      data: { active: false },
    });
    const created = await tx.requirement.create({
      data: {
        organizationId: ctx.organizationId,
        customerId: customer.id,
        version: (current?.version ?? 0) + 1,
        active: true,
        intent: requirement.intent,
        propertyTypes: requirement.propertyTypes,
        minPriceInr: requirement.minPriceInr ?? null,
        maxPriceInr: requirement.maxPriceInr ?? null,
        minBedrooms: requirement.minBedrooms ?? null,
        maxBedrooms: requirement.maxBedrooms ?? null,
        minAreaSqft: requirement.minAreaSqft ?? null,
        cities: requirement.cities,
        localities: requirement.localities,
        amenities: requirement.amenities,
        notes: requirement.notes,
        createdByUserId: ctx.user.id,
      },
    });
    await tx.followUp.create({
      data: {
        organizationId: ctx.organizationId,
        customerId: customer.id,
        requirementId: created.id,
        kind: "REQUIREMENT_CHANGE",
        notes: input.notes,
        completedAt: new Date(),
        createdByUserId: ctx.user.id,
      },
    });
    return created;
  });
}
