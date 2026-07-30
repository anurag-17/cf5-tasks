"use client";

import { useQuery } from "@tanstack/react-query";

interface SlotData {
  title: string;
  description: string;
  project: string;
  projectId: string;
  assignedBy: string;
  endTime: string;
}

export interface ScheduleRow {
  _id: string;
  name: string;
  slots: Record<string, SlotData>;
}

interface Params {
  date: string;
  employee?: string;
  project?: string;
}

export function useAdminSchedule(params: Params) {
  const searchParams = new URLSearchParams({ date: params.date });
  if (params.employee) searchParams.set("employee", params.employee);
  if (params.project) searchParams.set("project", params.project);

  return useQuery({
    queryKey: ["admin-schedule", params],
    queryFn: async () => {
      const res = await fetch(`/api/admin/schedule?${searchParams.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      return json as { success: boolean; data: ScheduleRow[] };
    },
  });
}
