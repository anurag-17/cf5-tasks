"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSchedule, useUpdateTask } from "@/hooks/use-employee-tasks";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import {
  TASK_STATUS_LABELS,
  normalizeTaskStatus,
  type TaskStatus,
} from "@/lib/constants/task";
import { todayDateInputValue } from "@/lib/dates";
import { getFirstFreeSlot } from "@/lib/slot-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskFormDialog } from "./task-form-dialog";
import { EmployeeTasksHeader } from "./employee-tasks-header";
import { EmployeeTasksStats } from "./employee-tasks-stats";
import { EmployeeSlotRow, type EmployeeSlotTask } from "./employee-slot-row";

const ALL_SLOTS = [
  ...TIME_SLOTS.slice(0, 4),
  { start: LUNCH_START_TIME, end: LUNCH_END_TIME, isLunch: true as const },
  ...TIME_SLOTS.slice(4),
];

export function SchedulePageClient() {
  const [selectedDate, setSelectedDate] = useState(todayDateInputValue);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const updateTask = useUpdateTask();
  const { data, isLoading } = useSchedule(selectedDate);
  const tasks = data?.data ?? [];

  const getTaskForSlot = (start: string) => tasks.find((t) => t.startTime === start);

  const pendingCount = tasks.filter((t) => normalizeTaskStatus(t.status) === "pending").length;
  const inProgressCount = tasks.filter(
    (t) => normalizeTaskStatus(t.status) === "in_progress",
  ).length;
  const completedCount = tasks.filter((t) => normalizeTaskStatus(t.status) === "completed").length;
  const firstFreeSlot = getFirstFreeSlot(tasks.map((t) => t.startTime));

  const handleStatusChange = async (task: EmployeeSlotTask, status: TaskStatus) => {
    setStatusUpdatingId(task._id);
    try {
      await updateTask.mutateAsync({ id: task._id, data: { status } });
      toast.success(`Status updated to ${TASK_STATUS_LABELS[status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openCreateForSlot = (slot: { start: string; end: string }) => {
    setSelectedSlot(slot);
    setFormOpen(true);
  };

  const openAddFirstFree = () => {
    if (!firstFreeSlot) {
      toast.error("No free slot available for this day.");
      return;
    }
    openCreateForSlot(firstFreeSlot);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setSelectedSlot(null);
    }
  };

  return (
    <div className="space-y-6">
      <EmployeeTasksHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onAddTask={openAddFirstFree}
        addDisabled={isLoading || !firstFreeSlot}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <EmployeeTasksStats
          total={tasks.length}
          completed={completedCount}
          pending={pendingCount}
          inProgress={inProgressCount}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {ALL_SLOTS.map((slot) => {
            const isLunch = "isLunch" in slot && slot.isLunch;
            const task = !isLunch ? getTaskForSlot(slot.start) : undefined;

            return (
              <EmployeeSlotRow
                key={slot.start}
                start={slot.start}
                end={slot.end}
                isLunch={isLunch}
                task={task}
                statusUpdating={task ? statusUpdatingId === task._id : false}
                onAdd={() => openCreateForSlot(slot)}
                hideAdd
                onStatusChange={task ? (status) => handleStatusChange(task, status) : undefined}
              />
            );
          })}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        task={null}
        date={selectedDate}
        slotStart={selectedSlot?.start}
        slotEnd={selectedSlot?.end}
      />
    </div>
  );
}
