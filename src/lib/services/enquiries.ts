import "server-only";
import type { EnquiryStatus, Prisma } from "@prisma/client";
import { isManager } from "../access";
import { getPrisma } from "../db";
import { HttpError } from "../http";
import type { enquiryInput } from "../schemas";
import type { TenantContext } from "../tenant";
import type { z } from "zod";

type EnquiryInput = z.infer<typeof enquiryInput>;

function visibleCustomer(ctx: TenantContext): Prisma.CustomerWhereInput {
  if (isManager(ctx.role)) return { organizationId: ctx.organizationId };
  return { organizationId: ctx.organizationId, assignedUserId: ctx.user.id };
}

export async function listEnquiries(ctx: TenantContext, status?: EnquiryStatus) {
  const prisma = getPrisma();
  return prisma.enquiry.findMany({
    where: {
      organizationId: ctx.organizationId,
      ...(status ? { status } : {}),
      customer: visibleCustomer(ctx),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      property: { select: { id: true, title: true, locality: true, city: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function createEnquiry(ctx: TenantContext, input: EnquiryInput) {
  const prisma = getPrisma();
  const customer = await prisma.customer.findFirst({
    where: { id: input.customerId, ...visibleCustomer(ctx) },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found.");
  if (input.propertyId) {
    const property = await prisma.property.findFirst({
      where: { id: input.propertyId, organizationId: ctx.organizationId },
      select: { id: true },
    });
    if (!property) throw new HttpError(404, "Property not found.");
  }
  return prisma.enquiry.create({
    data: {
      organizationId: ctx.organizationId,
      customerId: customer.id,
      propertyId: input.propertyId ?? null,
      source: input.source,
      message: input.message,
      status: input.status,
      createdByUserId: ctx.user.id,
    },
  });
}

export async function updateEnquiryStatus(ctx: TenantContext, id: string, status: EnquiryStatus) {
  const prisma = getPrisma();
  const existing = await prisma.enquiry.findFirst({
    where: { id, organizationId: ctx.organizationId, customer: visibleCustomer(ctx) },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Enquiry not found.");
  return prisma.enquiry.update({ where: { id: existing.id }, data: { status } });
}
