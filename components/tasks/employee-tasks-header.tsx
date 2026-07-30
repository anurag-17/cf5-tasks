"use client";

import type { ReactNode } from "react";
import { CalendarIcon, PlusIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

function formatDisplayDate(yyyyMmDd: string) {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  if (!year || !month || !day) return yyyyMmDd;
  return format(new Date(year, month - 1, day), "EEEE, d MMMM yyyy");
}

export function EmployeeTasksHeader({
  title = "My Tasks",
  selectedDate,
  onDateChange,
  onAddTask,
  addDisabled,
  dateInputId = "employee-schedule-date",
  extra,
}: {
  title?: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onAddTask: () => void;
  addDisabled?: boolean;
  dateInputId?: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        {title ? <h1 className="text-2xl font-semibold tracking-tight">{title}</h1> : null}
        {extra}
        <label
          htmlFor={dateInputId}
          className="border-input bg-card hover:bg-muted/40 focus-within:ring-ring relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-sm shadow-xs focus-within:ring-2"
        >
          <CalendarIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="text-foreground">{formatDisplayDate(selectedDate)}</span>
          <input
            id={dateInputId}
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Select date"
          />
        </label>
      </div>

      {/* Hidden for employees — keep markup so it can be re-enabled later */}
      <Button
        size="lg"
        onClick={onAddTask}
        disabled={addDisabled}
        className="hidden shrink-0 self-start"
      >
        <PlusIcon data-icon="inline-start" />
        Add Task
      </Button>
    </div>
  );
}
