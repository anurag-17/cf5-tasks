"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJSON } from "@/lib/api/fetch-json";
import type { SchedulePageMode } from "@/components/schedule/schedule-page-mode";

export interface TeamScheduleSlot {
  title: string;
  description: string;
  project: string;
  projectId: string;
  assignedBy: string;
  endTime: string;
  status: string;
  isReviewed: boolean;
}

export interface TeamScheduleRow {
  _id: string;
  name: string;
  /** Present after Phase 1 grouping; optional for backward compatibility. */
  employeeRole?: string | null;
  slots: Record<string, TeamScheduleSlot>;
}

interface Params {
  date: string;
  employee?: string;
  project?: string;
  /** Specialty filter; `ungrouped` = no employeeRole. */
  employeeRole?: string;
}

export function useTeamSchedule(mode: SchedulePageMode, params: Params) {
  const searchParams = new URLSearchParams({ date: params.date });
  if (params.employee) searchParams.set("employee", params.employee);
  if (params.project) searchParams.set("project", params.project);
  if (params.employeeRole && params.employeeRole !== "all") {
    searchParams.set("employeeRole", params.employeeRole);
  }

  const queryKey = mode === "admin" ? "admin-schedule" : "manager-schedule";
  const path = mode === "admin" ? "/api/admin/schedule" : "/api/manager/schedule";

  return useQuery({
    queryKey: [queryKey, params],
    queryFn: () =>
      fetchJSON<{ success: boolean; data: TeamScheduleRow[] }>(
        `${path}?${searchParams.toString()}`,
      ),
  });
}
