/** Shared team schedule — Admin and Manager use the same UI. */
export type SchedulePageMode = "admin" | "manager";

export function scheduleTeamTasksPath(
  mode: SchedulePageMode,
  employeeId: string,
  date: string,
): string {
  const base = mode === "admin" ? "/admin/team-tasks" : "/manager/team-tasks";
  return `${base}?employee=${employeeId}&date=${date}`;
}

export function schedulePageCopy(mode: SchedulePageMode): {
  title: string;
  description: string;
  dateInputId: string;
} {
  if (mode === "admin") {
    return {
      title: "Employee Schedule",
      description: "View and manage team schedules and availability.",
      dateInputId: "admin-schedule-date",
    };
  }
  return {
    title: "Employee Schedule",
    description: "Track team schedules and availability.",
    dateInputId: "manager-team-schedule-date",
  };
}
