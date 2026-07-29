"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { useAdminSchedule } from "@/hooks/use-admin-schedule";
import { useEmployees } from "@/hooks/use-manager";
import { useProjects } from "@/hooks/use-projects";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import { todayDateInputValue } from "@/lib/dates";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Badge } from "@/components/ui/badge";

const ALL_DISPLAY_SLOTS = [
  ...TIME_SLOTS.slice(0, 4),
  { start: LUNCH_START_TIME, end: LUNCH_END_TIME },
  ...TIME_SLOTS.slice(4),
];

type ScheduleRow = {
  _id: string;
  name: string;
  email: string;
  slots: Record<string, { title: string; project: string; assignedBy: string }>;
};

export function AdminScheduleClient() {
  const [selectedDate, setSelectedDate] = useState(todayDateInputValue);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employee Schedule</h1>
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
            className="border-input w-full rounded-lg border px-2 py-1 text-sm sm:w-auto"
            aria-label="Select date"
          />
        </div>
        <Select value={employeeFilter} onValueChange={(v) => setEmployeeFilter(v ?? "")}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by employee">
            <SelectValue placeholder="All Employees" />
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
        <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v ?? "")}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filter by project">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">No employees found.</div>
      ) : (
        <>
          {/* Mobile: stacked employee cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <div key={row._id} className="rounded-lg border p-3">
                <p className="mb-2 font-medium">{row.name}</p>
                <div className="space-y-2">
                  {ALL_DISPLAY_SLOTS.map((slot) => {
                    const isLunch = slot.start === LUNCH_START_TIME;
                    const task = row.slots[slot.start];

                    return (
                      <div
                        key={slot.start}
                        className="flex items-start justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                      >
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {slot.start}–{slot.end}
                        </span>
                        {isLunch ? (
                          <span className="text-muted-foreground text-xs italic">Lunch</span>
                        ) : task ? (
                          <div className="min-w-0 text-right">
                            <p className="truncate text-sm font-medium">{task.title}</p>
                            <Badge variant="secondary" className="mt-0.5 text-[10px]">
                              {task.project}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">Free</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: wide grid table */}
          <div className="hidden overflow-x-auto rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-background sticky left-0 z-10 min-w-[140px]">
                    Employee
                  </TableHead>
                  {ALL_DISPLAY_SLOTS.map((slot) => (
                    <TableHead key={slot.start} className="min-w-[120px] text-center text-xs">
                      {slot.start}–{slot.end}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell className="bg-background sticky left-0 z-10 font-medium">
                      {row.name}
                    </TableCell>
                    {ALL_DISPLAY_SLOTS.map((slot) => {
                      const isLunch = slot.start === LUNCH_START_TIME;
                      const task = row.slots[slot.start];

                      if (isLunch) {
                        return (
                          <TableCell key={slot.start} className="text-center">
                            <span className="text-muted-foreground text-xs italic">Lunch</span>
                          </TableCell>
                        );
                      }

                      if (!task) {
                        return (
                          <TableCell key={slot.start} className="text-center">
                            <span className="text-muted-foreground text-xs">Free</span>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={slot.start} className="text-center">
                          <div className="space-y-0.5">
                            <p
                              className="mx-auto max-w-[110px] truncate text-xs font-medium"
                              title={task.title}
                            >
                              {task.title}
                            </p>
                            <Badge variant="secondary" className="text-[10px]">
                              {task.project}
                            </Badge>
                            <p className="text-muted-foreground text-[10px]">{task.assignedBy}</p>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
