"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSchedule, useDeleteTask, useUpdateTask } from "@/hooks/use-employee-tasks";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import {
  TASK_STATUS_LABELS,
  normalizeTaskStatus,
  type TaskStatus,
} from "@/lib/constants/task";
import { todayDateInputValue } from "@/lib/dates";
import { getFirstFreeSlot, getNextFreeSlot } from "@/lib/slot-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
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
  const [editTask, setEditTask] = useState<EmployeeSlotTask | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [copyFrom, setCopyFrom] = useState<{
    project: { _id: string; name: string };
    title: string;
    description: string;
    assignedBy?: { _id: string; name: string };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; title: string } | null>(null);

  const deleteTask = useDeleteTask();
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask.mutateAsync(deleteTarget._id);
      toast.success("Task deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task.");
    }
  };

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
    setEditTask(null);
    setCopyFrom(null);
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

  const openEdit = (task: EmployeeSlotTask) => {
    if (!task.project) {
      toast.error("This task is missing a project and cannot be edited here.");
      return;
    }
    setEditTask(task);
    setCopyFrom(null);
    setSelectedSlot(null);
    setFormOpen(true);
  };

  const openCopyToNextSlot = (task: EmployeeSlotTask) => {
    if (!task.project) {
      toast.error("This task is missing a project and cannot be copied here.");
      return;
    }
    const occupiedStartTimes = tasks.map((t) => t.startTime);
    const nextSlot = getNextFreeSlot(task.startTime, occupiedStartTimes);
    if (!nextSlot) {
      toast.error("No free slot available after this task.");
      return;
    }
    setEditTask(null);
    setCopyFrom({
      project: task.project,
      title: task.title,
      description: task.description,
      assignedBy: task.assignedBy,
    });
    setSelectedSlot(nextSlot);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setCopyFrom(null);
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
                onEdit={task ? () => openEdit(task) : undefined}
                onCopy={task ? () => openCopyToNextSlot(task) : undefined}
                onDelete={
                  task ? () => setDeleteTarget({ _id: task._id, title: task.title }) : undefined
                }
                onStatusChange={task ? (status) => handleStatusChange(task, status) : undefined}
              />
            );
          })}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        task={
          editTask?.project
            ? {
                _id: editTask._id,
                project: editTask.project,
                title: editTask.title,
                description: editTask.description,
                date: editTask.date,
                startTime: editTask.startTime,
                endTime: editTask.endTime,
                assignedBy: editTask.assignedBy,
              }
            : null
        }
        copyFrom={copyFrom}
        date={selectedDate}
        slotStart={selectedSlot?.start}
        slotEnd={selectedSlot?.end}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Task"
        description={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This cannot be
            undone.
          </>
        }
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        isPending={deleteTask.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
