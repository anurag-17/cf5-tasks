"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useAdminSchedule } from "@/hooks/use-admin-schedule";
import { useEmployees } from "@/hooks/use-manager";
import { useProjects } from "@/hooks/use-projects";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
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

export function AdminScheduleClient() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  const { data: employeesData } = useEmployees();
  const employees = employeesData?.data ?? [];

  const { data: projectsData } = useProjects({ limit: 100, archived: "false" });
  const projects = (projectsData?.data?.projects ?? []) as Array<{ _id: string; name: string }>;

  const { data, isLoading } = useAdminSchedule({
    date: selectedDate,
    employee: employeeFilter || undefined,
    project: projectFilter || undefined,
  });

  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Employee Schedule</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-muted-foreground size-4" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-input rounded-lg border px-2 py-1 text-sm"
          />
        </div>
        <Select value={employeeFilter} onValueChange={(v) => setEmployeeFilter(v ?? "")}>
          <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
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

      {/* Schedule Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">No employees found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-background z-10 min-w-[140px]">Employee</TableHead>
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
                  <TableCell className="sticky left-0 bg-background z-10 font-medium">
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
                          <p className="text-xs font-medium truncate max-w-[110px] mx-auto" title={task.title}>
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
      )}
    </div>
  );
}
