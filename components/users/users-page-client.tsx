"use client";

import { useState, useRef, useCallback } from "react";
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useUsers, useToggleUserStatus } from "@/hooks/use-users";
import { ROLE_LABELS, type Role } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

const LIMIT = 10;

export function UsersPageClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<{ _id: string; name: string; email: string; role: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; name: string } | null>(null);

  const toggleStatus = useToggleUserStatus();

  // Debounce search input without mutating local variables after render.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeout = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  const { data, isLoading } = useUsers({
    page,
    limit: LIMIT,
    search: debouncedSearch,
    role: roleFilter,
  });

  const users = data?.data?.users ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

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

  const openEdit = (user: { _id: string; name: string; email: string; role: string }) => {
    setEditUser(user);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">User Management</h1>
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name or email…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debounceTimeout(e.target.value);
            }}
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="project_manager">{ROLE_LABELS.project_manager}</SelectItem>
            <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">No users found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u._id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{ROLE_LABELS[u.role as Role] ?? u.role}</Badge>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="cursor-pointer"
                    onClick={() => handleToggleStatus(u._id, u.name)}
                    disabled={toggleStatus.isPending}
                  >
                    <Badge variant={u.isActive ? "default" : "destructive"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
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
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editUser} />
      <DeleteUserDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} user={deleteTarget} />
    </div>
  );
}
