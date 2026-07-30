"use client";

import {
  CoffeeIcon,
  CopyIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { normalizeTaskStatus, type TaskStatus } from "@/lib/constants/task";
import { formatTime12h } from "@/lib/format";
import { cn } from "@/lib/utils";

export type EmployeeSlotTask = {
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
};

export function EmployeeSlotRow({
  start,
  end,
  isLunch,
  task,
  statusUpdating,
  onAdd,
  onEdit,
  onCopy,
  onDelete,
  onStatusChange,
}: {
  start: string;
  end: string;
  isLunch?: boolean;
  task?: EmployeeSlotTask;
  statusUpdating?: boolean;
  onAdd?: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-4">
      <div className="text-muted-foreground flex w-full shrink-0 items-center text-sm font-medium tabular-nums sm:w-40 sm:pt-4">
        {formatTime12h(start)} - {formatTime12h(end)}
      </div>

      {isLunch ? (
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-violet-200/70 bg-violet-50/80 px-4 py-3 text-sm text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300">
          <CoffeeIcon className="size-4 shrink-0" aria-hidden />
          <span className="font-medium">Lunch Break</span>
        </div>
      ) : task ? (
        <div className="bg-card ring-foreground/10 flex min-h-[88px] flex-1 items-center gap-3 rounded-xl px-4 py-3 shadow-xs ring-1">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="line-clamp-2 min-h-10 text-sm leading-5 font-medium">{task.title}</p>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="size-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
              <span className="truncate">{task.project.name}</span>
              {task.assignedBy ? (
                <span className="truncate">· {task.assignedBy.name}</span>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <TaskStatusBadge
              status={normalizeTaskStatus(task.status)}
              editable={!task.isReviewed}
              disabled={task.isReviewed}
              isPending={statusUpdating}
              onStatusChange={onStatusChange}
            />
            {task.isReviewed ? (
              <Badge variant="secondary" className="shrink-0">
                Reviewed
              </Badge>
            ) : null}
          </div>

          {!task.isReviewed ? (
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Copy ${task.title} to next free slot`}
                title="Copy to next free slot"
                onClick={onCopy}
                className="shrink-0"
              >
                <CopyIcon />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${task.title}`}
                      className="shrink-0"
                    />
                  }
                >
                  <MoreVerticalIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <PencilIcon />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onCopy}>
                    <CopyIcon />
                    Copy to next free slot
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <span className="size-7 shrink-0" aria-hidden />
          )}
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-1 flex-col items-start justify-center gap-1 rounded-xl border border-dashed px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
            "border-border/80 bg-muted/20",
          )}
        >
          <Button
            variant="link"
            size="sm"
            onClick={onAdd}
            className="text-primary h-auto px-0 py-0 font-medium"
          >
            <PlusIcon data-icon="inline-start" />
            Add Task
          </Button>
          <p className="text-muted-foreground text-sm">No task added for this slot</p>
        </div>
      )}
    </div>
  );
}
