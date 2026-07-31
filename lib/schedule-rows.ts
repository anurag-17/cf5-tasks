import { EMPLOYEE_ROLES, isEmployeeRole } from "@/lib/constants/employee-roles";
import { populatedId, populatedName } from "@/lib/mongoose-helpers";
import { normalizeTaskStatus } from "@/lib/constants/task";
import { Task, User } from "@/models";
import type { Types } from "mongoose";

export type ScheduleSlotPayload = {
  title: string;
  description: string;
  project: string;
  projectId: string;
  assignedBy: string;
  endTime: string;
  status: string;
  isReviewed: boolean;
};

export type ScheduleRowPayload = {
  _id: string;
  name: string;
  employeeRole: string | null;
  slots: Record<string, ScheduleSlotPayload>;
};

/** Parse `?employeeRole=` — a known specialty, `ungrouped`, or null (no filter). */
export function parseEmployeeRoleFilter(raw: string | null): string | null {
  if (!raw || raw === "all") return null;
  if (raw === "ungrouped") return "ungrouped";
  if (isEmployeeRole(raw)) return raw;
  return null;
}

function employeeRoleQuery(filter: string | null): Record<string, unknown> {
  if (!filter) return {};
  if (filter === "ungrouped") {
    return {
      $or: [
        { employeeRole: { $exists: false } },
        { employeeRole: null },
        { employeeRole: "" },
      ],
    };
  }
  return { employeeRole: filter };
}

type LeanEmployee = {
  _id: Types.ObjectId;
  name: string;
  employeeRole?: string | null;
};

/**
 * Build schedule grid rows for active employees on a UTC day.
 * Shared by Admin and Manager schedule APIs.
 */
export async function buildScheduleRows(options: {
  dayStart: Date;
  employeeFilter?: string | null;
  projectFilter?: string | null;
  employeeRoleFilter?: string | null;
}): Promise<ScheduleRowPayload[]> {
  const { dayStart, employeeFilter, projectFilter, employeeRoleFilter } = options;

  const taskFilter: Record<string, unknown> = { date: dayStart };
  if (employeeFilter) taskFilter.assignedTo = employeeFilter;
  if (projectFilter) taskFilter.project = projectFilter;

  const employeeQuery: Record<string, unknown> = {
    role: "employee",
    isActive: true,
    ...employeeRoleQuery(employeeRoleFilter ?? null),
  };
  if (employeeFilter) employeeQuery._id = employeeFilter;

  const [employees, tasks] = await Promise.all([
    User.find(employeeQuery).select("name employeeRole").sort({ name: 1 }).lean<LeanEmployee[]>(),
    Task.find(taskFilter).populate("project", "name").populate("assignedBy", "name").lean(),
  ]);

  const taskMap: Record<string, Record<string, ScheduleSlotPayload>> = {};
  for (const t of tasks) {
    const empId = t.assignedTo.toString();
    if (!taskMap[empId]) taskMap[empId] = {};
    taskMap[empId][t.startTime] = {
      title: t.title,
      description: t.description,
      project: populatedName(t.project, "") || t.projectName || "—",
      projectId: populatedId(t.project),
      assignedBy: populatedName(t.assignedBy, "Self"),
      endTime: t.endTime,
      status: normalizeTaskStatus(t.status),
      isReviewed: Boolean(t.isReviewed),
    };
  }

  return employees.map((emp) => ({
    _id: emp._id.toString(),
    name: emp.name,
    employeeRole: isEmployeeRole(emp.employeeRole) ? emp.employeeRole : null,
    slots: taskMap[emp._id.toString()] ?? {},
  }));
}

/** Stable list for clients / docs — specialty order used in Phase 2 grouping. */
export const SCHEDULE_EMPLOYEE_ROLE_ORDER = EMPLOYEE_ROLES;
