"use client";

import { useState } from "react";
import { format } from "date-fns";
import { PlusIcon, PencilIcon, Trash2Icon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useSchedule, useDeleteTask } from "@/hooks/use-employee-tasks";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskFormDialog } from "./task-form-dialog";

export function SchedulePageClient() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);

  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<{
    _id: string;
    project: { _id: string; name: string };
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const deleteTask = useDeleteTask();
  const { data, isLoading } = useSchedule(selectedDate);
  const tasks = data?.data ?? [];

  const allSlots = [
    ...TIME_SLOTS.slice(0, 4),
    { start: LUNCH_START_TIME, end: LUNCH_END_TIME, isLunch: true },
    ...TIME_SLOTS.slice(4),
  ];

  const getTaskForSlot = (start: string) => tasks.find((t) => t.startTime === start);

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success("Task deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task.");
    }
  };

  const openCreateForSlot = (slot: { start: string; end: string }) => {
    setEditTask(null);
    setSelectedSlot(slot);
    setFormOpen(true);
  };

  const openEdit = (task: NonNullable<ReturnType<typeof getTaskForSlot>>) => {
    setEditTask(task);
    setSelectedSlot(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Today&apos;s Schedule</h1>
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
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  isLunch
                    ? "bg-muted/50 border-dashed"
                    : task
                      ? "bg-card"
                      : "bg-muted/20"
                }`}
              >
                <div className="w-28 shrink-0 text-sm font-medium">
                  {slot.start} – {slot.end}
                </div>

                {isLunch ? (
                  <div className="text-muted-foreground flex-1 text-sm italic">
                    🍽️ Lunch Break
                  </div>
                ) : task ? (
                  <div className="flex flex-1 items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{task.title}</span>
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
                          onClick={() => openEdit(task)}
                          aria-label="Edit task"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleDelete(task._id)}
                          aria-label="Delete task"
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateForSlot(slot)}
                    >
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
        onOpenChange={setFormOpen}
        task={editTask}
        date={selectedDate}
        slotStart={selectedSlot?.start}
        slotEnd={selectedSlot?.end}
      />
    </div>
  );
}
