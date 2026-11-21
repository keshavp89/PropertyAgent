import "server-only";
import { isManager } from "../access";
import { getPrisma } from "../db";
import type { TenantContext } from "../tenant";

export async function dashboard(ctx: TenantContext) {
  const prisma = getPrisma();
  const customerWhere = isManager(ctx.role)
    ? { organizationId: ctx.organizationId }
    : { organizationId: ctx.organizationId, assignedUserId: ctx.user.id };
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [available, underOffer, openEnquiries, dueFollowUps, recentEnquiries] = await Promise.all([
    prisma.property.count({ where: { organizationId: ctx.organizationId, status: "AVAILABLE" } }),
    prisma.property.count({ where: { organizationId: ctx.organizationId, status: "UNDER_OFFER" } }),
    prisma.enquiry.count({
      where: { organizationId: ctx.organizationId, status: { notIn: ["WON", "LOST"] }, customer: customerWhere },
    }),
    prisma.followUp.findMany({
      where: {
        organizationId: ctx.organizationId,
        completedAt: null,
        dueAt: { lte: weekAhead },
        customer: customerWhere,
      },
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    prisma.enquiry.findMany({
      where: { organizationId: ctx.organizationId, customer: customerWhere },
      include: { customer: { select: { id: true, name: true } }, property: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  return { available, underOffer, openEnquiries, dueFollowUps, recentEnquiries };
}
