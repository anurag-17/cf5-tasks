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

/**
 * Soft section tones for Admin/PM schedule group headers.
 * Distinct per role so teams scan quickly; works in light + dark.
 */
export const EMPLOYEE_ROLE_SECTION_TONES: Record<EmployeeRole, string> = {
  wordpress_developer:
    "bg-orange-100 text-orange-950 border-orange-200/80 dark:bg-orange-950/55 dark:text-orange-50 dark:border-orange-800/60",
  shopify_developer:
    "bg-emerald-100 text-emerald-950 border-emerald-200/80 dark:bg-emerald-950/55 dark:text-emerald-50 dark:border-emerald-800/60",
  designer:
    "bg-rose-100 text-rose-950 border-rose-200/80 dark:bg-rose-950/55 dark:text-rose-50 dark:border-rose-800/60",
  seo_executive:
    "bg-sky-100 text-sky-950 border-sky-200/80 dark:bg-sky-950/55 dark:text-sky-50 dark:border-sky-800/60",
  content_writer:
    "bg-amber-100 text-amber-950 border-amber-200/80 dark:bg-amber-950/55 dark:text-amber-50 dark:border-amber-800/60",
  hr: "bg-teal-100 text-teal-950 border-teal-200/80 dark:bg-teal-950/55 dark:text-teal-50 dark:border-teal-800/60",
  bde: "bg-indigo-100 text-indigo-950 border-indigo-200/80 dark:bg-indigo-950/55 dark:text-indigo-50 dark:border-indigo-800/60",
  react_developer:
    "bg-cyan-100 text-cyan-950 border-cyan-200/80 dark:bg-cyan-950/55 dark:text-cyan-50 dark:border-cyan-800/60",
  nodejs_developer:
    "bg-lime-100 text-lime-950 border-lime-200/80 dark:bg-lime-950/55 dark:text-lime-50 dark:border-lime-800/60",
};

export const UNGROUPED_SECTION_TONE =
  "bg-slate-100 text-slate-800 border-slate-200/80 dark:bg-slate-900/70 dark:text-slate-100 dark:border-slate-700/60";

export function employeeRoleSectionTone(roleKey: string): string {
  if (isEmployeeRole(roleKey)) return EMPLOYEE_ROLE_SECTION_TONES[roleKey];
  return UNGROUPED_SECTION_TONE;
}
