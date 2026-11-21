import "server-only";
import type { Prisma } from "@prisma/client";
import { isManager } from "../access";
import { getPrisma } from "../db";
import { HttpError } from "../http";
import type { followUpInput } from "../schemas";
import type { TenantContext } from "../tenant";
import type { z } from "zod";

type FollowUpInput = z.infer<typeof followUpInput>;

function visibleCustomer(ctx: TenantContext): Prisma.CustomerWhereInput {
  if (isManager(ctx.role)) return { organizationId: ctx.organizationId };
  return { organizationId: ctx.organizationId, assignedUserId: ctx.user.id };
}

export async function listFollowUps(ctx: TenantContext) {
  const prisma = getPrisma();
  return prisma.followUp.findMany({
    where: { organizationId: ctx.organizationId, customer: visibleCustomer(ctx) },
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
}

export async function createFollowUp(ctx: TenantContext, input: FollowUpInput) {
  const prisma = getPrisma();
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, ...visibleCustomer(ctx) },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found.");
  if (input.enquiryId) {
    const enquiry = await prisma.enquiry.findFirst({
      where: { id: input.enquiryId, organizationId: ctx.organizationId, customerId: customer.id },
      select: { id: true },
    });
    if (!enquiry) throw new HttpError(404, "Enquiry not found.");
  }
  return prisma.followUp.create({
    data: {
      organizationId: ctx.organizationId,
      customerId: customer.id,
      enquiryId: input.enquiryId ?? null,
      kind: input.kind,
      notes: input.notes,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      createdByUserId: ctx.user.id,
    },
  });
}

export async function setFollowUpCompleted(ctx: TenantContext, id: string, completed: boolean) {
  const prisma = getPrisma();
  const existing = await prisma.followUp.findFirst({
    where: { id, organizationId: ctx.organizationId, customer: visibleCustomer(ctx) },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Follow-up not found.");
  return prisma.followUp.update({
    where: { id: existing.id },
    data: { completedAt: completed ? new Date() : null },
  });
}
