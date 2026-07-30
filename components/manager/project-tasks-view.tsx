"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useProjectTasks } from "@/hooks/use-manager";
import { useProjects } from "@/hooks/use-projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { normalizeTaskStatus } from "@/lib/constants/task";
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

export function ProjectTasksView() {
  const [selectedProject, setSelectedProject] = useState("");
  const [page, setPage] = useState(1);

  const { data: projectsData } = useProjects({ limit: 100, archived: "false" });
  const projects = projectsData?.data?.projects ?? [];

  const { data, isLoading } = useProjectTasks(selectedProject, page);
  const tasks = data?.data?.tasks ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select
          value={selectedProject}
          onValueChange={(v) => {
            setSelectedProject(v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-60" aria-label="Select project">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedProject ? (
        <div className="text-muted-foreground py-12 text-center">Select a project to view its tasks.</div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">No tasks found for this project.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell>{format(new Date(t.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      {t.startTime} – {t.endTime}
                    </TableCell>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{t.assignedTo?.name ?? "—"}</TableCell>
                    <TableCell>{t.assignedBy?.name ?? "Self"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TaskStatusBadge status={normalizeTaskStatus(t.status)} />
                        {t.isReviewed ? <Badge>Reviewed</Badge> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
