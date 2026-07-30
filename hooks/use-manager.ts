"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskStatus } from "@/lib/constants/task";
import type { TaskInput } from "@/lib/validations/task";
import { fetchJSON } from "@/lib/api/fetch-json";

export interface ManagerScheduleSlot {
  title: string;
  description: string;
  project: string;
  projectId: string;
  assignedBy: string;
  endTime: string;
  status: string;
  isReviewed: boolean;
}

export interface ManagerScheduleRow {
  _id: string;
  name: string;
  slots: Record<string, ManagerScheduleSlot>;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["manager-employees"],
    queryFn: () =>
      fetchJSON<{ success: boolean; data: Array<{ _id: string; name: string; email: string }> }>(
        "/api/manager/employees",
      ),
  });
}

export function useManagerSchedule(params: {
  date: string;
  employee?: string;
  project?: string;
}) {
  const searchParams = new URLSearchParams({ date: params.date });
  if (params.employee) searchParams.set("employee", params.employee);
  if (params.project) searchParams.set("project", params.project);

  return useQuery({
    queryKey: ["manager-schedule", params],
    queryFn: () =>
      fetchJSON<{ success: boolean; data: ManagerScheduleRow[] }>(
        `/api/manager/schedule?${searchParams.toString()}`,
      ),
  });
}

export function useEmployeeSchedule(employeeId: string, date: string) {
  return useQuery({
    queryKey: ["employee-schedule", employeeId, date],
    queryFn: () =>
      fetchJSON<{
        success: boolean;
        data: Array<{
          _id: string;
          project: { _id: string; name: string };
          title: string;
          description: string;
          date: string;
          startTime: string;
          endTime: string;
          assignedBy?: { _id: string; name: string };
          status?: TaskStatus;
          isReviewed: boolean;
        }>;
      }>(`/api/manager/employees/${employeeId}/schedule?date=${date}`),
    enabled: !!employeeId,
  });
}

export function useProjectTasks(projectId: string, page: number, date?: string) {
  const params = new URLSearchParams({ project: projectId, page: String(page) });
  if (date) params.set("date", date);

  return useQuery({
    queryKey: ["project-tasks", projectId, page, date],
    queryFn: () =>
      fetchJSON<{
        success: boolean;
        data: {
          tasks: Array<{
            _id: string;
            project: { _id: string; name: string };
            title: string;
            description: string;
            date: string;
            startTime: string;
            endTime: string;
            assignedTo: { _id: string; name: string; email: string };
            assignedBy?: { _id: string; name: string };
            status?: TaskStatus;
            isReviewed: boolean;
          }>;
          total: number;
          page: number;
          totalPages: number;
        };
      }>(`/api/manager/project-tasks?${params.toString()}`),
    enabled: !!projectId,
  });
}

export function useAssignTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskInput) =>
      fetchJSON("/api/manager/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-schedule"] });
      qc.invalidateQueries({ queryKey: ["manager-schedule"] });
      qc.invalidateQueries({ queryKey: ["admin-schedule"] });
      qc.invalidateQueries({ queryKey: ["project-tasks"] });
    },
  });
}

export function useEditAssignedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskInput }) =>
      fetchJSON(`/api/manager/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-schedule"] });
      qc.invalidateQueries({ queryKey: ["manager-schedule"] });
      qc.invalidateQueries({ queryKey: ["admin-schedule"] });
      qc.invalidateQueries({ queryKey: ["project-tasks"] });
    },
  });
}

export function useDeleteAssignedTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/manager/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-schedule"] });
      qc.invalidateQueries({ queryKey: ["manager-schedule"] });
      qc.invalidateQueries({ queryKey: ["admin-schedule"] });
      qc.invalidateQueries({ queryKey: ["project-tasks"] });
    },
  });
}
