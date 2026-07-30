"use client";

import { ChevronDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/lib/constants/task";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  pending:
    "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  in_progress:
    "border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
  completed:
    "border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
};

export function TaskStatusBadge({
  status,
  editable = false,
  disabled = false,
  isPending = false,
  onStatusChange,
}: {
  status: TaskStatus;
  editable?: boolean;
  disabled?: boolean;
  isPending?: boolean;
  onStatusChange?: (status: TaskStatus) => void;
}) {
  const label = TASK_STATUS_LABELS[status];
  const className = cn(STATUS_BADGE_CLASS[status], editable && !disabled && "cursor-pointer pr-1.5");

  if (!editable || disabled) {
    return <Badge className={className}>{label}</Badge>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        render={
          <button
            type="button"
            className={cn(
              "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-0.5 overflow-hidden rounded-4xl border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
              className,
            )}
            aria-label={`Change status (current: ${label})`}
          />
        }
      >
        {label}
        <ChevronDownIcon className="size-3 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(value) => {
            if (!value || value === status) return;
            onStatusChange?.(value as TaskStatus);
          }}
        >
          {TASK_STATUSES.map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {TASK_STATUS_LABELS[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
