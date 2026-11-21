import { NextResponse } from "next/server";
import { readBody } from "@/lib/api";
import { assertRateLimit, HttpError, withApi } from "@/lib/http";
import { organizationSelect } from "@/lib/schemas";
import { getSessionUser, ORG_COOKIE, orgCookieOptions, resolveTenant, toContext } from "@/lib/tenant";

export async function POST(request: Request) {
  return withApi(request, async () => {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to continue.");
    await assertRateLimit(user.id, "POST");
    const body = await readBody(request, organizationSelect);
    const { memberships } = await resolveTenant(user);
    const membership = memberships.find((item) => item.organizationId === body.organizationId);
    if (!membership) throw new HttpError(403, "You are not a member of that brokerage.");
    const response = NextResponse.json({ active: toContext(user, membership) });
    response.cookies.set(ORG_COOKIE, membership.organizationId, orgCookieOptions);
    return response;
  });
}

export async function DELETE(request: Request) {
  return withApi(request, async () => {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to continue.");
    await assertRateLimit(user.id, "DELETE");
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ORG_COOKIE, "", { ...orgCookieOptions, maxAge: 0 });
    return response;
  });
}
