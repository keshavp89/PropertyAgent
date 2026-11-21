import type { DeskRole } from "./access";

export type Membership = {
  organizationId: string;
  role: DeskRole;
  name: string;
  slug: string;
};
