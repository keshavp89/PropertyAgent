export type DeskRole = "owner" | "admin" | "member";

export function normalizeRole(role: string): DeskRole {
  if (role === "owner" || role === "admin") return role;
  return "member";
}

export function isManager(role: string) {
  const normalized = normalizeRole(role);
  return normalized === "owner" || normalized === "admin";
}

export function canEditProperty(role: string, userId: string, listedByUserId: string) {
  return isManager(role) || userId === listedByUserId;
}

export function canViewCustomer(role: string, userId: string, assignedUserId: string) {
  return isManager(role) || userId === assignedUserId;
}
