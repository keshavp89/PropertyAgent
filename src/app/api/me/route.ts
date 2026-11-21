import { json } from "@/lib/api";
import { assertRateLimit, HttpError, withApi } from "@/lib/http";
import { getSessionUser, resolveTenant, toContext } from "@/lib/tenant";

export async function GET(request: Request) {
  return withApi(request, async () => {
    const user = await getSessionUser();
    if (!user) throw new HttpError(401, "Sign in to continue.");
    await assertRateLimit(user.id, "GET");
    const { memberships, membership } = await resolveTenant(user);
    return json({
      user,
      memberships,
      active: membership ? toContext(user, membership) : null,
    });
  });
}
