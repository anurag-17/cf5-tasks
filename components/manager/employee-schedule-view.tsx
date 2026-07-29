"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PlusIcon, PencilIcon, Trash2Icon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useEmployees, useEmployeeSchedule, useDeleteAssignedTask } from "@/hooks/use-manager";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AssignTaskDialog } from "./assign-task-dialog";

export function EmployeeScheduleView() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<{
    _id: string;
    project: { _id: string; name: string };
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    assignedTo: { _id: string; name: string };
  } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const { data: employeesData } = useEmployees();
  const employees = employeesData?.data ?? [];

  const deleteTask = useDeleteAssignedTask();
  const { data: scheduleData, isLoading } = useEmployeeSchedule(selectedEmployee, selectedDate);
  const tasks = scheduleData?.data ?? [];

  const allSlots = [
    ...TIME_SLOTS.slice(0, 4),
    { start: LUNCH_START_TIME, end: LUNCH_END_TIME, isLunch: true },
    ...TIME_SLOTS.slice(4),
  ];

  const getTaskForSlot = (start: string) => tasks.find((t) => t.startTime === start);

  const openAssignForSlot = (slot: { start: string; end: string }) => {
    setEditTask(null);
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  const openEditTask = (task: NonNullable<ReturnType<typeof getTaskForSlot>>) => {
    setEditTask({
      ...task,
      assignedTo: { _id: selectedEmployee, name: employees.find((e) => e._id === selectedEmployee)?.name ?? "" },
    });
    setSelectedSlot(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success("Task cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel task.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={selectedEmployee} onValueChange={(v) => setSelectedEmployee(v ?? "")}>
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e._id} value={e._id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-muted-foreground size-4" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-input rounded-lg border px-2 py-1 text-sm"
          />
        </div>
      </div>

      {!selectedEmployee ? (
        <div className="text-muted-foreground py-12 text-center">Select an employee to view their schedule.</div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
          {allSlots.map((slot) => {
            const isLunch = "isLunch" in slot && slot.isLunch;
            const task = !isLunch ? getTaskForSlot(slot.start) : undefined;

            return (
              <div
                key={slot.start}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  isLunch ? "bg-muted/50 border-dashed" : task ? "bg-card" : "bg-muted/20"
                }`}
              >
                <div className="w-28 shrink-0 text-sm font-medium">
                  {slot.start} – {slot.end}
                </div>

                {isLunch ? (
                  <div className="text-muted-foreground flex-1 text-sm italic">🍽️ Lunch Break</div>
                ) : task ? (
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{task.title}</span>
                        <Badge variant="secondary">{task.project.name}</Badge>
                        {task.isReviewed && <Badge>Reviewed</Badge>}
                      </div>
                      {task.assignedBy && (
                        <p className="text-muted-foreground text-xs">Assigned by: {task.assignedBy.name}</p>
                      )}
                    </div>
                    {!task.isReviewed && (
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => openEditTask(task)} aria-label="Edit task">
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(task._id)}
                          aria-label="Cancel task"
                          disabled={deleteTask.isPending}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-muted-foreground text-sm">Free</span>
                    <Button variant="outline" size="sm" onClick={() => openAssignForSlot(slot)}>
                      <PlusIcon data-icon="inline-start" />
                      Assign
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AssignTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editTask}
        employeeId={selectedEmployee}
        date={selectedDate}
        slotStart={selectedSlot?.start}
        slotEnd={selectedSlot?.end}
      />
    </div>
  );
}
