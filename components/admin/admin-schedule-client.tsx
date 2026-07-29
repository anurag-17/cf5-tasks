"use client";

import { useMemo, useState } from "react";
import {
  CalendarIcon,
  UsersIcon,
  BriefcaseIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  UtensilsIcon,
} from "lucide-react";
import { useAdminSchedule } from "@/hooks/use-admin-schedule";
import { useEmployees } from "@/hooks/use-manager";
import { useProjects } from "@/hooks/use-projects";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import { todayDateInputValue } from "@/lib/dates";
import { formatDate } from "@/lib/format";
import { projectChipClass, projectDotClass } from "@/lib/project-colors";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const ALL_DISPLAY_SLOTS = [
  ...TIME_SLOTS.slice(0, 4),
  { start: LUNCH_START_TIME, end: LUNCH_END_TIME },
  ...TIME_SLOTS.slice(4),
];

const BOOKABLE_SLOT_COUNT = TIME_SLOTS.length;

type SlotTask = {
  title: string;
  description: string;
  project: string;
  assignedBy: string;
  endTime: string;
};

type ScheduleRow = {
  _id: string;
  name: string;
  slots: Record<string, SlotTask>;
};

type SelectedTask = {
  task: SlotTask;
  employeeName: string;
  slotStart: string;
};

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
        "truncate text-left font-medium transition-colors hover:text-primary hover:underline",
        className,
      )}
      aria-label={`View ${name}'s daily schedule`}
    >
      {name}
    </button>
  );
}

function EmployeeScheduleDrawer({
  employee,
  date,
  open,
  onOpenChange,
  onTaskClick,
}: {
  employee: ScheduleRow | null;
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskClick: (task: SlotTask, slotStart: string) => void;
}) {
  const summary = useMemo(() => {
    if (!employee) return { busy: 0, free: 0 };

    let busy = 0;
    for (const slot of TIME_SLOTS) {
      if (employee.slots[slot.start]) busy += 1;
    }

    return { busy, free: BOOKABLE_SLOT_COUNT - busy };
  }, [employee]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        {employee ? (
          <>
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle>{employee.name}</SheetTitle>
              <SheetDescription>
                {formatDate(date)} · {summary.busy} tasks, {summary.free} free slots
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {ALL_DISPLAY_SLOTS.map((slot) => {
                const isLunch = slot.start === LUNCH_START_TIME;
                const task = employee.slots[slot.start];

                return (
                  <div
                    key={slot.start}
                    className={cn(
                      "rounded-lg border p-3",
                      isLunch
                        ? "bg-muted/50 border-dashed"
                        : task
                          ? "bg-card"
                          : "bg-muted/20",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {slot.start} – {slot.end}
                      </span>
                      {isLunch ? (
                        <Badge variant="outline" className="text-xs">
                          Lunch
                        </Badge>
                      ) : task ? (
                        <Badge variant="secondary" className="text-xs">
                          Busy
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Free
                        </Badge>
                      )}
                    </div>

                    {isLunch ? (
                      <p className="text-muted-foreground flex items-center gap-1.5 text-sm italic">
                        <UtensilsIcon className="size-3.5" aria-hidden />
                        Lunch break
                      </p>
                    ) : task ? (
                      <button
                        type="button"
                        onClick={() => onTaskClick(task, slot.start)}
                        className={cn(
                          "w-full rounded-md p-2.5 text-left ring-1 ring-inset transition-opacity hover:opacity-90",
                          projectChipClass(task.project),
                        )}
                      >
                        <p className="font-medium">{task.title}</p>
                        <p className="mt-1 text-xs opacity-80">{task.project}</p>
                        <p className="text-muted-foreground mt-2 text-xs">
                          Assigned by: {task.assignedBy}
                        </p>
                      </button>
                    ) : (
                      <p className="text-muted-foreground text-sm">No task scheduled</p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}


function TaskChip({ task, onClick }: { task: SlotTask; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "mx-auto w-full max-w-[140px] cursor-pointer rounded-md px-2 py-1.5 text-left ring-1 ring-inset transition-opacity hover:opacity-90",
        projectChipClass(task.project),
      )}
      title={`${task.title} · ${task.project}`}
      aria-label={`View task: ${task.title}`}
    >
      <p className="truncate text-sm font-semibold leading-snug">{task.title}</p>
    </button>
  );
}

function StatCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon: typeof UsersIcon;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
          <Icon className="size-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function AdminScheduleClient() {
  const [selectedDate, setSelectedDate] = useState(todayDateInputValue);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<ScheduleRow | null>(null);

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

  const stats = useMemo(() => {
    const totalEmployees = rows.length;
    let busy = 0;
    const projectNames = new Set<string>();

    for (const row of rows) {
      for (const slot of TIME_SLOTS) {
        const task = row.slots[slot.start];
        if (task) {
          busy += 1;
          projectNames.add(task.project);
        }
      }
    }

    const totalSlots = totalEmployees * BOOKABLE_SLOT_COUNT;
    const free = Math.max(totalSlots - busy, 0);
    const busyPct = totalSlots === 0 ? 0 : Math.round((busy / totalSlots) * 100);
    const freePct = totalSlots === 0 ? 0 : Math.round((free / totalSlots) * 100);

    return {
      totalEmployees,
      busy,
      free,
      busyPct,
      freePct,
      totalSlots,
      dayProjects: [...projectNames].sort((a, b) => a.localeCompare(b)),
      catalogProjects: projects.length,
    };
  }, [rows, projects.length]);

  return (
    <div className="min-w-0 space-y-6">
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
                      onClick={() => setSelectedEmployee(row)}
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
                          {slot.start}–{slot.end}
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
                              setSelectedTask({
                                task,
                                employeeName: row.name,
                                slotStart: slot.start,
                              })
                            }
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">Free</span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop grid */}
          <div className="bg-card hidden w-full max-w-full overflow-hidden rounded-xl border shadow-sm md:block">
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full min-w-[1320px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="bg-muted/40 sticky left-0 z-[2] min-w-[180px] px-3 py-3 text-left text-sm font-semibold tracking-wide uppercase shadow-[1px_0_0_0_var(--border)]">
                      Employee
                    </th>
                    {ALL_DISPLAY_SLOTS.map((slot) => {
                      const isLunch = slot.start === LUNCH_START_TIME;
                      return (
                        <th
                          key={slot.start}
                          className={cn(
                            "min-w-[140px] px-2 py-3 text-center text-xs font-medium",
                            isLunch && "bg-amber-50/80 text-amber-900/80 dark:bg-amber-950/30 dark:text-amber-100/80",
                          )}
                        >
                          {slot.start}–{slot.end}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._id} className="border-b last:border-0">
                      <td className="bg-card sticky left-0 z-[1] px-3 py-2.5 shadow-[1px_0_0_0_var(--border)]">
                        <EmployeeNameButton
                          name={row.name}
                          onClick={() => setSelectedEmployee(row)}
                        />
                      </td>
                      {ALL_DISPLAY_SLOTS.map((slot) => {
                        const isLunch = slot.start === LUNCH_START_TIME;
                        const task = row.slots[slot.start];

                        if (isLunch) {
                          return (
                            <td
                              key={slot.start}
                              className="bg-amber-50/50 px-1 py-2 text-center dark:bg-amber-950/20"
                            >
                              <span className="text-muted-foreground inline-flex items-center justify-center">
                                <UtensilsIcon className="size-3.5 opacity-70" aria-label="Lunch" />
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td key={slot.start} className="min-w-[140px] px-2 py-2.5 text-center align-middle">
                            {task ? (
                              <TaskChip
                                task={task}
                                onClick={() =>
                                  setSelectedTask({
                                    task,
                                    employeeName: row.name,
                                    slotStart: slot.start,
                                  })
                                }
                              />
                            ) : (
                              <span className="text-muted-foreground/70 text-sm">Free</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-muted/20 flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {stats.dayProjects.length === 0 ? (
                  <span className="text-muted-foreground text-xs">No projects on this day</span>
                ) : (
                  stats.dayProjects.map((name) => (
                    <span key={name} className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <span className={cn("size-2 rounded-full", projectDotClass(name))} aria-hidden />
                      {name}
                    </span>
                  ))
                )}
              </div>
              <p className="text-muted-foreground text-xs">All times are in IST (UTC +05:30)</p>
            </div>
          </div>
        </>
      )}

      <EmployeeScheduleDrawer
        employee={selectedEmployee}
        date={selectedDate}
        open={!!selectedEmployee}
        onOpenChange={(open) => !open && setSelectedEmployee(null)}
        onTaskClick={(task, slotStart) => {
          if (!selectedEmployee) return;
          setSelectedTask({
            task,
            employeeName: selectedEmployee.name,
            slotStart,
          });
        }}
      />

      <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-hidden">
          {selectedTask ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTask.task.title}</DialogTitle>
                <DialogDescription>
                  {selectedTask.employeeName} · {selectedTask.slotStart}–{selectedTask.task.endTime}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selectedTask.task.project}</Badge>
                  <span className="text-muted-foreground text-xs">
                    Assigned by: {selectedTask.task.assignedBy}
                  </span>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium tracking-wide uppercase">Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedTask.task.description}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
