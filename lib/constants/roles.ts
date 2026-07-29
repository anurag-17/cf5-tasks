// Per requirement.txt "User Roles": Admin, Project Manager, Employee.
export const ROLES = ["admin", "project_manager", "employee"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  employee: "Employee",
};
