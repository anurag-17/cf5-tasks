"use client";

import { useState, useEffect } from "react";
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useToggleUserStatus } from "@/hooks/use-users";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { ROLE_LABELS, type Role } from "@/lib/constants/roles";
import { employeeRoleLabel } from "@/lib/constants/employee-roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UserFormDialog } from "./user-form-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { showAuthRoleFilter, type UsersPageMode } from "./users-page-mode";

const LIMIT = 20;

export function UsersPageClient({ mode = "admin" }: { mode?: UsersPageMode }) {
  const showRoleFilter = showAuthRoleFilter(mode);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState(mode === "manager" ? "employee" : "all");
  const { search, setSearch, debouncedSearch } = useDebouncedSearch();

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<{
    _id: string;
    name: string;
    email: string;
    role: string;
    employeeRole?: string | null;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; name: string } | null>(null);

  const toggleStatus = useToggleUserStatus();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    if (mode === "manager") setRoleFilter("employee");
  }, [mode]);

  const { data, isLoading } = useUsers({
    page,
    limit: LIMIT,
    search: debouncedSearch,
    role: mode === "manager" ? "employee" : roleFilter,
  });

  const users = data?.data?.users ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const startIndex = (page - 1) * LIMIT;

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      await toggleStatus.mutateAsync(id);
      toast.success(`${name} status updated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle status.");
    }
  };

  const openCreate = () => {
    setEditUser(null);
    setFormOpen(true);
  };

  const openEdit = (user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    employeeRole?: string | null;
  }) => {
    setEditUser(user);
    setFormOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search by name or email…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users by name or email"
            />
          </div>
          {showRoleFilter ? (
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Filter by role">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="project_manager">{ROLE_LABELS.project_manager}</SelectItem>
                <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          {mode === "manager" ? "Add Employee" : "Add User"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          {mode === "manager" ? "No employees found." : "No users found."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-11 w-16 px-4 text-xs font-semibold tracking-wide uppercase">
                  S.No
                </TableHead>
                <TableHead className="h-11 px-4 text-xs font-semibold tracking-wide uppercase">
                  Name
                </TableHead>
                <TableHead className="h-11 px-4 text-xs font-semibold tracking-wide uppercase">
                  Email
                </TableHead>
                {mode === "admin" ? (
                  <TableHead className="h-11 px-4 text-xs font-semibold tracking-wide uppercase">
                    Role
                  </TableHead>
                ) : null}
                <TableHead className="h-11 px-4 text-xs font-semibold tracking-wide uppercase">
                  Employee role
                </TableHead>
                <TableHead className="h-11 px-4 text-xs font-semibold tracking-wide uppercase">
                  Status
                </TableHead>
                <TableHead className="h-11 px-4 text-right text-xs font-semibold tracking-wide uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, index) => (
                <TableRow key={u._id}>
                  <TableCell className="px-4 py-2.5 text-muted-foreground tabular-nums">
                    {startIndex + index + 1}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 font-medium">{u.name}</TableCell>
                  <TableCell className="px-4 py-2.5 text-muted-foreground">{u.email}</TableCell>
                  {mode === "admin" ? (
                    <TableCell className="px-4 py-2.5">
                      <Badge variant="secondary">{ROLE_LABELS[u.role as Role] ?? u.role}</Badge>
                    </TableCell>
                  ) : null}
                  <TableCell className="px-4 py-2.5 text-muted-foreground">
                    {u.role === "employee" ? employeeRoleLabel(u.employeeRole) : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-2.5">
                    <button
                      type="button"
                      className="cursor-pointer"
                      onClick={() => handleToggleStatus(u._id, u.name)}
                      disabled={toggleStatus.isPending}
                      aria-label={`Toggle status for ${u.name}`}
                    >
                      <Badge variant={u.isActive ? "default" : "destructive"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(u)}
                        aria-label={`Edit ${u.name}`}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteTarget(u)}
                        aria-label={`Delete ${u.name}`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editUser} mode={mode} />
      <DeleteUserDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        user={deleteTarget}
      />
    </div>
  );
}
