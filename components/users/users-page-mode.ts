/** Shared Users screen mode — same components for Admin and Manager. */
export type UsersPageMode = "admin" | "manager";

export type CreatableAuthRole = "employee" | "project_manager";

export const USERS_PAGE_ALLOWED_ROLES: Record<UsersPageMode, readonly CreatableAuthRole[]> = {
  admin: ["employee", "project_manager"],
  manager: ["employee"],
};

export function defaultCreatableRole(mode: UsersPageMode): CreatableAuthRole {
  return "employee";
}

export function showAuthRoleFilter(mode: UsersPageMode): boolean {
  return mode === "admin";
}
