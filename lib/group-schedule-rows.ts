import {
  EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_LABELS,
  isEmployeeRole,
  type EmployeeRole,
} from "@/lib/constants/employee-roles";

export const UNGROUPED_SCHEDULE_KEY = "ungrouped" as const;

export type ScheduleGroupKey = EmployeeRole | typeof UNGROUPED_SCHEDULE_KEY;

export type ScheduleGroupSection<T extends { name: string; employeeRole?: string | null }> = {
  key: ScheduleGroupKey;
  label: string;
  rows: T[];
};

export function scheduleGroupKey(employeeRole: string | null | undefined): ScheduleGroupKey {
  return isEmployeeRole(employeeRole) ? employeeRole : UNGROUPED_SCHEDULE_KEY;
}

export function scheduleGroupLabel(key: ScheduleGroupKey): string {
  if (key === UNGROUPED_SCHEDULE_KEY) return "Ungrouped";
  return EMPLOYEE_ROLE_LABELS[key];
}

/**
 * Group schedule rows by employeeRole using EMPLOYEE_ROLES order; Ungrouped last.
 * Empty groups are omitted. Within a group, rows are sorted by name.
 */
export function groupScheduleRows<T extends { name: string; employeeRole?: string | null }>(
  rows: T[],
): ScheduleGroupSection<T>[] {
  const buckets = new Map<ScheduleGroupKey, T[]>();

  for (const row of rows) {
    const key = scheduleGroupKey(row.employeeRole);
    const list = buckets.get(key);
    if (list) list.push(row);
    else buckets.set(key, [row]);
  }

  const order: ScheduleGroupKey[] = [...EMPLOYEE_ROLES, UNGROUPED_SCHEDULE_KEY];
  const sections: ScheduleGroupSection<T>[] = [];

  for (const key of order) {
    const list = buckets.get(key);
    if (!list?.length) continue;
    sections.push({
      key,
      label: scheduleGroupLabel(key),
      rows: [...list].sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return sections;
}
