"use client";

import { useState } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, CalendarIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { useSchedule, useDeleteTask } from "@/hooks/use-employee-tasks";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import { todayDateInputValue } from "@/lib/dates";
import { getNextFreeSlot } from "@/lib/slot-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { TaskFormDialog } from "./task-form-dialog";

export function SchedulePageClient() {
  const [selectedDate, setSelectedDate] = useState(todayDateInputValue);

  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<{
    _id: string;
    project: { _id: string; name: string };
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    assignedBy?: { _id: string; name: string };
  } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [copyFrom, setCopyFrom] = useState<{
    project: { _id: string; name: string };
    title: string;
    description: string;
    assignedBy?: { _id: string; name: string };
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; title: string } | null>(null);

  const deleteTask = useDeleteTask();
  const { data, isLoading } = useSchedule(selectedDate);
  const tasks = data?.data ?? [];

  const allSlots = [
    ...TIME_SLOTS.slice(0, 4),
    { start: LUNCH_START_TIME, end: LUNCH_END_TIME, isLunch: true },
    ...TIME_SLOTS.slice(4),
  ];

  const getTaskForSlot = (start: string) => tasks.find((t) => t.startTime === start);

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

  const openCreateForSlot = (slot: { start: string; end: string }) => {
    setEditTask(null);
    setCopyFrom(null);
    setSelectedSlot(slot);
    setFormOpen(true);
  };

  const openEdit = (task: NonNullable<ReturnType<typeof getTaskForSlot>>) => {
    setEditTask(task);
    setCopyFrom(null);
    setSelectedSlot(null);
    setFormOpen(true);
  };

  const openCopyToNextSlot = (task: NonNullable<ReturnType<typeof getTaskForSlot>>) => {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">My Tasks</h1>
        <div className="flex items-center gap-2">
          <CalendarIcon className="text-muted-foreground size-4" aria-hidden />
          <label htmlFor="employee-schedule-date" className="sr-only">
            Select date
          </label>
          <input
            id="employee-schedule-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-input w-full rounded-lg border px-2 py-1 text-sm sm:w-auto"
            aria-label="Select date"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
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
                className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3 ${
                  isLunch
                    ? "bg-muted/50 border-dashed"
                    : task
                      ? "bg-card"
                      : "bg-muted/20"
                }`}
              >
                <div className="shrink-0 text-sm font-medium sm:w-28">
                  {slot.start} – {slot.end}
                </div>

                {isLunch ? (
                  <div className="text-muted-foreground flex-1 text-sm italic">
                    🍽️ Lunch Break
                  </div>
                ) : task ? (
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        <Badge variant="secondary" className="shrink-0">
                          {task.project.name}
                        </Badge>
                        {task.isReviewed && (
                          <Badge variant="default" className="shrink-0">
                            Reviewed
                          </Badge>
                        )}
                      </div>
                      {task.assignedBy && (
                        <p className="text-muted-foreground text-xs">
                          Assigned by: {task.assignedBy.name}
                        </p>
                      )}
                    </div>
                    {!task.isReviewed && (
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openCopyToNextSlot(task)}
                          aria-label={`Copy ${task.title} to next slot`}
                          title="Copy to next slot"
                        >
                          <CopyIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => openEdit(task)}
                          aria-label={`Edit ${task.title}`}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setDeleteTarget({ _id: task._id, title: task.title })}
                          aria-label={`Delete ${task.title}`}
                          disabled={deleteTask.isPending}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <span className="text-muted-foreground text-sm">Free</span>
                    <Button variant="outline" size="sm" onClick={() => openCreateForSlot(slot)}>
                      <PlusIcon data-icon="inline-start" />
                      Add Task
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <TaskFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        task={editTask}
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
