"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";

interface UsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  success: boolean;
  data: { users: UserData[]; total: number; page: number; totalPages: number };
  error?: string;
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Something went wrong");
  return json;
}

export function useUsers(params: UsersParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.role && params.role !== "all") searchParams.set("role", params.role);

  return useQuery<UsersResponse>({
    queryKey: ["users", params],
    queryFn: () => fetchJSON(`/api/users?${searchParams.toString()}`),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      fetchJSON("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      fetchJSON(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJSON(`/api/users/${id}/toggle-status`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
