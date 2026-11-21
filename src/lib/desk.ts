import "server-only";
import { redirect } from "next/navigation";
import { HttpError } from "./http";
import { getSessionUser, resolveTenant, toContext, type Membership, type SessionUser, type TenantContext } from "./tenant";

export type DeskState = {
  user: SessionUser;
  memberships: Membership[];
  ctx: TenantContext | null;
};

export async function loadDesk(): Promise<DeskState> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/sign-in");
  try {
    const { memberships, membership } = await resolveTenant(user);
    return {
      user,
      memberships,
      ctx: membership ? toContext(user, membership) : null,
    };
  } catch (error) {
    if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
      redirect("/auth/sign-in");
    }
    throw error;
  }
}
