"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EmployeeTasksStats } from "@/components/tasks/employee-tasks-stats";
import {
  EmployeeSlotRow,
  taskProjectLabel,
  type EmployeeSlotTask,
} from "@/components/tasks/employee-slot-row";
import { TeamAssignTaskSheet } from "@/components/tasks/team-assign-task-sheet";
import type { TeamTasksEmployee } from "@/components/tasks/team-tasks-employee-list";
import {
  useDeleteAssignedTask,
  useEditAssignedTask,
  useEmployeeSchedule,
  type ManagerTaskUpdateInput,
} from "@/hooks/use-manager";
import { TIME_SLOTS, LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";
import {
  TASK_STATUS_LABELS,
  normalizeTaskStatus,
  type TaskStatus,
} from "@/lib/constants/task";
import { isPastDateInputValue } from "@/lib/dates";
import { getFirstFreeSlot, getNextFreeSlot } from "@/lib/slot-utils";
import type { TaskInput } from "@/lib/validations/task";

const ALL_SLOTS = [
  ...TIME_SLOTS.slice(0, 4),
  { start: LUNCH_START_TIME, end: LUNCH_END_TIME, isLunch: true as const },
  ...TIME_SLOTS.slice(4),
];

function formatDisplayDate(yyyyMmDd: string) {
  const [year, month, day] = yyyyMmDd.split("-").map(Number);
  if (!year || !month || !day) return yyyyMmDd;
  return format(new Date(year, month - 1, day), "EEEE, d MMMM yyyy");
}

function toManagerUpdateInput(
  task: EmployeeSlotTask,
  employeeId: string,
  status?: TaskStatus,
): ManagerTaskUpdateInput {
  if (task.project?._id) {
    return {
      project: task.project._id,
      title: task.title,
      description: task.description,
      date: new Date(task.date),
      startTime: task.startTime as TaskInput["startTime"],
      endTime: task.endTime as TaskInput["endTime"],
      assignedTo: employeeId,
      ...(status ? { status } : {}),
    };
  }

  return {
    projectName: task.projectName?.trim() || task.project?.name?.trim() || undefined,
    title: task.title,
    description: task.description,
    date: new Date(task.date),
    startTime: task.startTime as TaskInput["startTime"],
    endTime: task.endTime as TaskInput["endTime"],
    assignedTo: employeeId,
    ...(status ? { status } : {}),
  };
}

export function ManagedEmployeeTasksPanel({
  employee,
  selectedDate,
}: {
  employee: TeamTasksEmployee;
  selectedDate: string;
}) {
  const { data: session } = useSession();
  const assignedByName = session?.user?.name?.trim() || session?.user?.email || "You";

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<EmployeeSlotTask | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [copyFrom, setCopyFrom] = useState<{
    projectName?: string;
    title: string;
    description: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ _id: string; title: string } | null>(null);

  const { data, isLoading, isError, error, refetch } = useEmployeeSchedule(
    employee._id,
    selectedDate,
  );
  const tasks = (data?.data ?? []) as EmployeeSlotTask[];
  const deleteTask = useDeleteAssignedTask();
  const editAssignedTask = useEditAssignedTask();

  const dateIsPast = isPastDateInputValue(selectedDate);
  const getTaskForSlot = (start: string) => tasks.find((t) => t.startTime === start);

  const pendingCount = tasks.filter((t) => normalizeTaskStatus(t.status) === "pending").length;
  const inProgressCount = tasks.filter(
    (t) => normalizeTaskStatus(t.status) === "in_progress",
  ).length;
  const completedCount = tasks.filter((t) => normalizeTaskStatus(t.status) === "completed").length;
  const firstFreeSlot = getFirstFreeSlot(tasks.map((t) => t.startTime));
  const allSlotsFree = !isLoading && !isError && tasks.length === 0;

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
      await editAssignedTask.mutateAsync({
        id: task._id,
        data: toManagerUpdateInput(task, employee._id, status),
      });
      toast.success(`Status updated to ${TASK_STATUS_LABELS[status]}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const openCreateForSlot = (slot: { start: string; end: string }) => {
    if (dateIsPast) {
      toast.error("Cannot add tasks on a past date.");
      return;
    }
    setEditTask(null);
    setCopyFrom(null);
    setSelectedSlot(slot);
    setFormOpen(true);
  };

  const openAddFirstFree = () => {
    if (dateIsPast) {
      toast.error("Cannot add tasks on a past date.");
      return;
    }
    if (!firstFreeSlot) {
      toast.error("No free slot available for this day.");
      return;
    }
    openCreateForSlot(firstFreeSlot);
  };

  const openEdit = (task: EmployeeSlotTask) => {
    if (task.isReviewed) {
      toast.error("Reviewed tasks cannot be edited.");
      return;
    }
    setEditTask(task);
    setCopyFrom(null);
    setSelectedSlot(null);
    setFormOpen(true);
  };

  const openCopyToNextSlot = (task: EmployeeSlotTask) => {
    if (task.isReviewed) {
      toast.error("Reviewed tasks cannot be copied.");
      return;
    }
    if (dateIsPast) {
      toast.error("Cannot add tasks on a past date.");
      return;
    }
    const nextSlot = getNextFreeSlot(
      task.startTime,
      tasks.map((t) => t.startTime),
    );
    if (!nextSlot) {
      toast.error("No free slot available after this task.");
      return;
    }
    setEditTask(null);
    setCopyFrom({
      projectName: taskProjectLabel(task) === "—" ? "" : taskProjectLabel(task),
      title: task.title,
      description: task.description,
    });
    setSelectedSlot(nextSlot);
    setFormOpen(true);
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setCopyFrom(null);
      setSelectedSlot(null);
      setEditTask(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{employee.name}</h1>
            <p className="text-foreground text-xl font-medium tracking-tight">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
          <Button
            size="lg"
            onClick={openAddFirstFree}
            disabled={isLoading || dateIsPast || !firstFreeSlot}
            className="shrink-0 self-start"
          >
            <PlusIcon data-icon="inline-start" />
            Add Task
          </Button>
        </div>

        {dateIsPast ? (
          <p className="text-muted-foreground bg-muted/40 rounded-lg border border-dashed px-3 py-2 text-sm">
            Past day — view and edit existing tasks only. New tasks cannot be added.
          </p>
        ) : null}

        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-10 text-center">
            <p className="text-destructive text-sm">
              {error instanceof Error ? error.message : "Failed to load schedule."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        {!isError && allSlotsFree ? (
          <p className="text-muted-foreground text-sm">
            No tasks scheduled for this day
            {dateIsPast ? "." : " — use Add Task or a free slot to assign work."}
          </p>
        ) : null}

        {!isError && isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
            ))}
          </div>
        ) : !isError ? (
          <EmployeeTasksStats
            total={tasks.length}
            completed={completedCount}
            pending={pendingCount}
            inProgress={inProgressCount}
          />
        ) : null}

        {!isError && isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !isError ? (
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
                  onAdd={dateIsPast ? undefined : () => openCreateForSlot(slot)}
                  onEdit={
                    task && !task.isReviewed ? () => openEdit(task) : undefined
                  }
                  onCopy={
                    task && !task.isReviewed && !dateIsPast
                      ? () => openCopyToNextSlot(task)
                      : undefined
                  }
                  onDelete={
                    task && !task.isReviewed
                      ? () => setDeleteTarget({ _id: task._id, title: task.title })
                      : undefined
                  }
                  onStatusChange={
                    task && !task.isReviewed
                      ? (status) => handleStatusChange(task, status)
                      : undefined
                  }
                />
              );
            })}
          </div>
        ) : null}
      </div>

      <TeamAssignTaskSheet
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        employee={employee}
        assignedByName={assignedByName}
        date={selectedDate}
        slotStart={selectedSlot?.start}
        slotEnd={selectedSlot?.end}
        task={editTask}
        copyFrom={copyFrom}
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
