"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, UtensilsIcon } from "lucide-react";
import { useAdminSchedule } from "@/hooks/use-admin-schedule";
import { useEmployees } from "@/hooks/use-manager";
import { useProjects } from "@/hooks/use-projects";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import { todayDateInputValue } from "@/lib/dates";
import { formatTime12h } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssignTaskDialog } from "@/components/manager/assign-task-dialog";
import { FreeSlotAssign } from "@/components/schedule/free-slot-assign";
import {
  ScheduleTaskDetailDialog,
  type ScheduleTaskSelection,
} from "@/components/schedule/schedule-task-detail-dialog";
import { normalizeTaskStatus } from "@/lib/constants/task";

const ALL_DISPLAY_SLOTS = [
  ...TIME_SLOTS.slice(0, 4),
  { start: LUNCH_START_TIME, end: LUNCH_END_TIME },
  ...TIME_SLOTS.slice(4),
];

type SlotTask = {
  title: string;
  description: string;
  project: string;
  projectId: string;
  assignedBy: string;
  endTime: string;
  status: string;
  isReviewed: boolean;
};

type ScheduleRow = {
  _id: string;
  name: string;
  slots: Record<string, SlotTask>;
};

function StatusDot({ status }: { status: string }) {
  const normalized = normalizeTaskStatus(status);
  const tone =
    normalized === "completed"
      ? "bg-emerald-500"
      : normalized === "in_progress"
        ? "bg-sky-500"
        : "bg-amber-500";

  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", tone)}
      aria-label={`Status: ${normalized.replace("_", " ")}`}
      title={`Status: ${normalized.replace("_", " ")}`}
    />
  );
}

function toTaskSelection(
  row: ScheduleRow,
  task: SlotTask,
  slotStart: string,
  date: string,
): ScheduleTaskSelection {
  return {
    title: task.title,
    description: task.description,
    project: task.project,
    projectId: task.projectId,
    assignedBy: task.assignedBy,
    endTime: task.endTime,
    employeeId: row._id,
    employeeName: row.name,
    slotStart,
    date,
    occupiedStarts: Object.keys(row.slots),
    status: task.status,
    isReviewed: task.isReviewed,
  };
}

function EmployeeNameButton({
  name,
  onClick,
  className,
}: {
  name: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hover:text-primary truncate text-left font-medium transition-colors hover:underline",
        className,
      )}
      aria-label={`Manage ${name}'s tasks`}
    >
      {name}
    </button>
  );
}

function TaskChip({ task, onClick }: { task: SlotTask; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-[140px] cursor-pointer space-y-1 text-left transition-colors hover:underline"
      title={`${task.project} · Assigned by ${task.assignedBy}`}
      aria-label={`View task for project: ${task.project}`}
    >
      <p className="text-primary truncate text-sm leading-snug font-semibold">{task.project}</p>
      <p className="text-muted-foreground truncate text-xs">{task.assignedBy}</p>
      <StatusDot status={task.status} />
    </button>
  );
}

export function AdminScheduleClient() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(todayDateInputValue);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<ScheduleTaskSelection | null>(null);
  const [assignTarget, setAssignTarget] = useState<{
    employeeId: string;
    slotStart: string;
    slotEnd: string;
  } | null>(null);

  const { data: employeesData } = useEmployees();
  const employees = employeesData?.data ?? [];

  const { data: projectsData } = useProjects({ limit: 100, archived: "false" });
  const projects = projectsData?.data?.projects ?? [];

  const { data, isLoading } = useAdminSchedule({
    date: selectedDate,
    employee: employeeFilter || undefined,
    project: projectFilter || undefined,
  });

  const rows = (data?.data ?? []) as ScheduleRow[];

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Employee Schedule</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View and manage team schedules and availability.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-muted-foreground size-4" aria-hidden />
            <label htmlFor="admin-schedule-date" className="sr-only">
              Select date
            </label>
            <input
              id="admin-schedule-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-input bg-card w-full rounded-lg border px-2.5 py-1.5 text-sm sm:w-auto"
              aria-label="Select date"
            />
          </div>
          <Select value={employeeFilter || null} onValueChange={(v) => setEmployeeFilter(v ?? "")}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by employee">
              <SelectValue placeholder="All Employees">
                {employeeFilter
                  ? (employees.find((e) => e._id === employeeFilter)?.name ?? null)
                  : "All Employees"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e._id} value={e._id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectFilter || null} onValueChange={(v) => setProjectFilter(v ?? "")}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by project">
              <SelectValue placeholder="All Projects">
                {projectFilter
                  ? (projects.find((p) => p._id === projectFilter)?.name ?? null)
                  : "All Projects"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p._id} value={String(p._id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">No employees found.</div>
        ) : (
          <>
            {/* Mobile: stacked employee cards */}
            <div className="space-y-3 md:hidden">
              {rows.map((row) => (
                <Card key={row._id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="truncate text-sm">
                      <EmployeeNameButton
                        name={row.name}
                        onClick={() =>
                          router.push(
                            `/admin/team-tasks?employee=${row._id}&date=${selectedDate}`,
                          )
                        }
                        className="text-sm"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ALL_DISPLAY_SLOTS.map((slot) => {
                      const isLunch = slot.start === LUNCH_START_TIME;
                      const task = row.slots[slot.start];

                      return (
                        <div
                          key={slot.start}
                          className="flex items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                        >
                          <span className="text-muted-foreground shrink-0 text-xs">
                            {formatTime12h(slot.start)}–{formatTime12h(slot.end)}
                          </span>
                          {isLunch ? (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs italic">
                              <UtensilsIcon className="size-3" aria-hidden />
                              Lunch
                            </span>
                          ) : task ? (
                            <TaskChip
                              task={task}
                              onClick={() =>
                                setSelectedTask(toTaskSelection(row, task, slot.start, selectedDate))
                              }
                            />
                          ) : (
                            <FreeSlotAssign
                              onAssign={() =>
                                setAssignTarget({
                                  employeeId: row._id,
                                  slotStart: slot.start,
                                  slotEnd: slot.end,
                                })
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop grid */}
            <div className="bg-card hidden h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-xl border shadow-sm md:flex">
              <div className="min-h-0 w-full max-w-full flex-1 overflow-auto">
                <table className="h-full w-full min-w-[1320px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="bg-muted sticky top-0 left-0 z-[5] min-w-[180px] px-3 py-4 text-left text-sm font-semibold tracking-wide uppercase shadow-[1px_0_0_0_var(--border)]">
                        Employee
                      </th>
                      {ALL_DISPLAY_SLOTS.map((slot) => {
                        const isLunch = slot.start === LUNCH_START_TIME;
                        return (
                          <th
                            key={slot.start}
                            className={cn(
                              "bg-muted sticky top-0 z-[3] min-w-[140px] border-l px-2 py-4 text-center text-xs font-medium",
                              isLunch && "text-muted-foreground",
                            )}
                          >
                            {formatTime12h(slot.start).replace(" AM", "").replace(" PM", "")}–
                            {formatTime12h(slot.end).replace(" AM", "").replace(" PM", "")}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => {
                      const isEvenRow = rowIndex % 2 === 1;
                      return (
                        <tr
                          key={row._id}
                          className={cn(
                            "group/row hover:bg-muted/30 border-b transition-colors last:border-0",
                            isEvenRow && "bg-muted/30",
                          )}
                        >
                          <td
                            className={cn(
                              "sticky left-0 z-[2] px-3 py-4 shadow-[1px_0_0_0_var(--border)] group-hover/row:bg-muted",
                              isEvenRow ? "bg-muted" : "bg-card",
                            )}
                          >
                            <EmployeeNameButton
                              name={row.name}
                              onClick={() =>
                          router.push(
                            `/admin/team-tasks?employee=${row._id}&date=${selectedDate}`,
                          )
                        }
                            />
                          </td>
                          {ALL_DISPLAY_SLOTS.map((slot) => {
                            const isLunch = slot.start === LUNCH_START_TIME;
                            const task = row.slots[slot.start];

                            if (isLunch) {
                              return (
                                <td
                                  key={slot.start}
                                  className="bg-muted/30 border-l  px-1 py-4 text-center"
                                >
                                  <span className="text-muted-foreground inline-flex items-center justify-center">
                                    <UtensilsIcon
                                      className="size-3.5 opacity-70"
                                      aria-label="Lunch"
                                    />
                                  </span>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={slot.start}
                                className="min-w-[140px] border-l px-3 py-4 text-left align-middle"
                              >
                                {task ? (
                                  <TaskChip
                                    task={task}
                                    onClick={() =>
                                      setSelectedTask(
                                        toTaskSelection(row, task, slot.start, selectedDate),
                                      )
                                    }
                                  />
                                ) : (
                                  <FreeSlotAssign
                                    onAssign={() =>
                                      setAssignTarget({
                                        employeeId: row._id,
                                        slotStart: slot.start,
                                        slotEnd: slot.end,
                                      })
                                    }
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    <tr aria-hidden className="h-full">
                      <td className="bg-card sticky left-0 z-[2] shadow-[1px_0_0_0_var(--border)]" />
                      {ALL_DISPLAY_SLOTS.map((slot) => (
                        <td key={slot.start} className="border-l" />
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <AssignTaskDialog
        open={!!assignTarget}
        onOpenChange={(open) => !open && setAssignTarget(null)}
        employeeId={assignTarget?.employeeId}
        date={selectedDate}
        slotStart={assignTarget?.slotStart}
        slotEnd={assignTarget?.slotEnd}
      />

      <ScheduleTaskDetailDialog selection={selectedTask} onSelectionChange={setSelectedTask} />
    </div>
  );
}
