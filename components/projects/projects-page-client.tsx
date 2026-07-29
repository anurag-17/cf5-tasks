"use client";

import { useState, useRef, useCallback } from "react";
import { PlusIcon, SearchIcon, PencilIcon, Trash2Icon, ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { toast } from "sonner";
import { useProjects, useToggleArchiveProject } from "@/hooks/use-projects";
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
import { ProjectFormDialog } from "./project-form-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";

interface ProjectRow {
  _id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdBy: { _id: string; name: string; email: string } | null;
  createdAt: string;
}

const LIMIT = 10;

export function ProjectsPageClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [archivedFilter, setArchivedFilter] = useState("false");

  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<{ _id: string; name: string; description?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; name: string } | null>(null);

  const toggleArchive = useToggleArchiveProject();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimeout = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  const { data, isLoading } = useProjects({
    page,
    limit: LIMIT,
    search: debouncedSearch,
    archived: archivedFilter,
  });

  const projects = (data?.data?.projects ?? []) as ProjectRow[];
  const totalPages = data?.data?.totalPages ?? 1;

  const handleToggleArchive = async (id: string, name: string) => {
    try {
      await toggleArchive.mutateAsync(id);
      toast.success(`"${name}" archive status updated.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update archive status.");
    }
  };

  const openCreate = () => {
    setEditProject(null);
    setFormOpen(true);
  };

  const openEdit = (p: ProjectRow) => {
    setEditProject({ _id: p._id, name: p.name, description: p.description });
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Project Management</h1>
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          New Project
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search projects…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debounceTimeout(e.target.value);
            }}
          />
        </div>
        <Select value={archivedFilter} onValueChange={(v) => { setArchivedFilter(v ?? "false"); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Active</SelectItem>
            <SelectItem value="true">Archived</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">No projects found.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p._id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{p.description || "—"}</TableCell>
                <TableCell>{p.createdBy?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={p.isArchived ? "secondary" : "default"}>
                    {p.isArchived ? "Archived" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => openEdit(p)}
                      aria-label={`Edit ${p.name}`}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleToggleArchive(p._id, p.name)}
                      aria-label={p.isArchived ? `Unarchive ${p.name}` : `Archive ${p.name}`}
                      disabled={toggleArchive.isPending}
                    >
                      {p.isArchived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setDeleteTarget(p)}
                      aria-label={`Delete ${p.name}`}
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

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editProject} />
      <DeleteProjectDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} project={deleteTarget} />
    </div>
  );
}
