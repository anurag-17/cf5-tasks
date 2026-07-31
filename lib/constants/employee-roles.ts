/** Job specialty for employees — separate from auth `role` (admin / PM / employee). */
export const EMPLOYEE_ROLES = [
  "wordpress_developer",
  "shopify_developer",
  "designer",
  "seo_executive",
  "content_writer",
  "hr",
  "bde",
  "react_developer",
  "nodejs_developer",
] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

/** Display order for schedule grouping later; also used in selects. */
export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  wordpress_developer: "Wordpress Developer",
  shopify_developer: "Shopify Developer",
  designer: "Designer",
  seo_executive: "Seo Executive",
  content_writer: "Content Writer",
  hr: "HR",
  bde: "BDE",
  react_developer: "React Developer",
  nodejs_developer: "Nodejs Developer",
};

export function isEmployeeRole(value: unknown): value is EmployeeRole {
  return typeof value === "string" && (EMPLOYEE_ROLES as readonly string[]).includes(value);
}

export function employeeRoleLabel(value: unknown): string {
  return isEmployeeRole(value) ? EMPLOYEE_ROLE_LABELS[value] : "—";
}
