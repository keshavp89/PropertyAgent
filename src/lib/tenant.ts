import "server-only";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { getPrisma } from "./db";
import { HttpError } from "./http";
import { auth } from "./auth/server";
import { isManager, normalizeRole, type DeskRole } from "./access";
import type { Membership } from "./desk-types";

export const ORG_COOKIE = "pa_org";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type { Membership };

export type TenantContext = {
  user: SessionUser;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: DeskRole;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type MembershipRow = {
  banned: boolean | null;
  organizationId: string | null;
  role: string | null;
  name: string | null;
  slug: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user?.id || !UUID.test(user.id)) return null;
  return {
    id: user.id,
    name: user.name ?? "Agent",
    email: user.email ?? "",
  };
}

async function loadMemberships(userId: string) {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<MembershipRow[]>(Prisma.sql`
    SELECT u.banned AS banned,
           m."organizationId"::text AS "organizationId",
           m.role AS role,
           o.name AS name,
           o.slug AS slug
    FROM neon_auth."user" u
    LEFT JOIN neon_auth.member m ON m."userId" = u.id
    LEFT JOIN neon_auth.organization o ON o.id = m."organizationId"
    WHERE u.id = ${userId}::uuid
  `);
  return rows;
}

export async function listMemberships(user: SessionUser): Promise<Membership[]> {
  const rows = await loadMemberships(user.id);
  if (rows.length === 0) throw new HttpError(401, "Sign in again to continue.");
  if (rows.some((row) => row.banned)) throw new HttpError(403, "This account is not allowed to sign in.");
  return rows.flatMap((row) => {
    if (!row.organizationId || !row.role || !row.name || !row.slug) return [];
    return [
      {
        organizationId: row.organizationId,
        role: normalizeRole(row.role),
        name: row.name,
        slug: row.slug,
      },
    ];
  });
}

export async function readActiveOrganizationId() {
  const jar = await cookies();
  const value = jar.get(ORG_COOKIE)?.value;
  return value && UUID.test(value) ? value : null;
}

export async function resolveTenant(user: SessionUser) {
  const memberships = await listMemberships(user);
  const active = await readActiveOrganizationId();
  const selected = memberships.find((membership) => membership.organizationId === active);
  const membership = selected ?? (memberships.length === 1 ? memberships[0] : null);
  return { memberships, membership };
}

export function toContext(user: SessionUser, membership: Membership): TenantContext {
  return {
    user,
    organizationId: membership.organizationId,
    organizationName: membership.name,
    organizationSlug: membership.slug,
    role: membership.role,
  };
}

export async function requireApiTenant(): Promise<TenantContext> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "Sign in to continue.");
  const { memberships, membership } = await resolveTenant(user);
  if (!membership) {
    if (memberships.length === 0) throw new HttpError(409, "Create a brokerage before continuing.");
    throw new HttpError(409, "Choose a brokerage before continuing.");
  }
  return toContext(user, membership);
}

export async function userIsMember(organizationId: string, userId: string) {
  if (!UUID.test(userId) || !UUID.test(organizationId)) return false;
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ ok: number }>>(Prisma.sql`
    SELECT 1 AS ok
    FROM neon_auth.member
    WHERE "organizationId" = ${organizationId}::uuid
      AND "userId" = ${userId}::uuid
    LIMIT 1
  `);
  return rows.length > 0;
}

export function managerOnly(ctx: TenantContext) {
  if (!isManager(ctx.role)) throw new HttpError(403, "Only a brokerage owner or admin can do that.");
}

export const orgCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};
