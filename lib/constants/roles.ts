export const ROLES = ["admin", "project_manager", "team_lead", "employee"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  team_lead: "Team Lead",
  employee: "Employee",
};

// Job title, distinct from `role` — mainly relevant for the "employee" role.
export const DESIGNATIONS = [
  "Developer",
  "Designer",
  "SEO",
  "Content Writer",
  "HR",
  "BDE",
  "QA",
] as const;
export type Designation = (typeof DESIGNATIONS)[number];
