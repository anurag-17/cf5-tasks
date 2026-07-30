"use client";

import { useMemo, useState } from "react";
import { CopyPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { useAssignTask } from "@/hooks/use-manager";
import { getNextFreeSlot } from "@/lib/constants/office-hours";
import { formatTime12h } from "@/lib/format";
import type { TaskInput } from "@/lib/validations/task";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { normalizeTaskStatus } from "@/lib/constants/task";

export type ScheduleTaskSelection = {
  title: string;
  description: string;
  project: string;
  projectId: string;
  assignedBy: string;
  endTime: string;
  employeeId: string;
  employeeName: string;
  slotStart: string;
  date: string;
  occupiedStarts: string[];
  status?: string;
  isReviewed?: boolean;
};

export function ScheduleTaskDetailDialog({
  selection,
  onSelectionChange,
}: {
  selection: ScheduleTaskSelection | null;
  onSelectionChange: (next: ScheduleTaskSelection | null) => void;
}) {
  const assignTask = useAssignTask();
  const [copying, setCopying] = useState(false);

  const nextFree = useMemo(() => {
    if (!selection) return null;
    return getNextFreeSlot(selection.slotStart, selection.occupiedStarts);
  }, [selection]);

  const handleCopy = async () => {
    if (!selection || !nextFree) return;

    setCopying(true);
    try {
      const slotPayload = {
        title: selection.title,
        description: selection.description,
        date: new Date(selection.date),
        startTime: nextFree.start as TaskInput["startTime"],
        endTime: nextFree.end as TaskInput["endTime"],
        assignedTo: selection.employeeId,
      };

      // Linked Project ref vs free-text projectName (Team Tasks assign).
      const data = selection.projectId
        ? { ...slotPayload, project: selection.projectId }
        : {
            ...slotPayload,
            projectName:
              selection.project && selection.project !== "—"
                ? selection.project
                : undefined,
          };

      await assignTask.mutateAsync(data);
      toast.success(
        `Copied to ${formatTime12h(nextFree.start)}–${formatTime12h(nextFree.end)}.`,
      );
      onSelectionChange({
        ...selection,
        slotStart: nextFree.start,
        endTime: nextFree.end,
        occupiedStarts: [...selection.occupiedStarts, nextFree.start],
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to copy task.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <Dialog open={!!selection} onOpenChange={(open) => !open && onSelectionChange(null)}>
      <DialogContent className="max-h-[70vh] overflow-hidden sm:max-w-md">
        {selection ? (
          <>
            <DialogHeader>
              <DialogTitle>{selection.title}</DialogTitle>
              <DialogDescription>
                {selection.employeeName} · {formatTime12h(selection.slotStart)}–
                {formatTime12h(selection.endTime)}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{selection.project}</Badge>
                <TaskStatusBadge status={normalizeTaskStatus(selection.status)} />
                {selection.isReviewed ? <Badge>Reviewed</Badge> : null}
                <span className="text-muted-foreground text-xs">
                  Assigned by: {selection.assignedBy}
                </span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-medium tracking-wide uppercase">Description</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selection.description}
                </p>
              </div>
            </div>
            {nextFree ? (
              <DialogFooter className="border-t pt-4 sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={copying || assignTask.isPending}
                  onClick={handleCopy}
                >
                  <CopyPlusIcon data-icon="inline-start" />
                  {copying
                    ? "Copying…"
                    : `Copy to next hour (${formatTime12h(nextFree.start)}–${formatTime12h(nextFree.end)})`}
                </Button>
              </DialogFooter>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
