"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { EmployeeTaskInput, UpdateEmployeeTaskInput } from "@/lib/validations/task";
import type { TaskStatus } from "@/lib/constants/task";
import { fetchJSON } from "@/lib/api/fetch-json";

export function useSchedule(date: string) {
  return useQuery({
    queryKey: ["schedule", date],
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
      }>(`/api/employee/schedule?date=${date}`),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeTaskInput) =>
      fetchJSON("/api/employee/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeTaskInput }) =>
      fetchJSON(`/api/employee/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/employee/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }),
  });
}
