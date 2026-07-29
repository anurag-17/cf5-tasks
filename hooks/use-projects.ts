"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project";
import { fetchJSON } from "@/lib/api/fetch-json";

export interface ProjectData {
  _id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdBy: { _id: string; name: string; email: string } | null;
  createdAt: string;
}

interface ProjectsListResponse {
  success: boolean;
  data: {
    projects: ProjectData[];
    total: number;
    page: number;
    totalPages: number;
  };
}

interface ProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  archived?: string;
}

export function useProjects(params: ProjectsParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.archived) searchParams.set("archived", params.archived);

  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => fetchJSON<ProjectsListResponse>(`/api/projects?${searchParams.toString()}`),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      fetchJSON("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectInput }) =>
      fetchJSON(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useToggleArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/projects/${id}/archive`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}
