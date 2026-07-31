"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";
import { taskCreateSchema, taskSchema } from "@/lib/validations/task";
import type { TaskInput } from "@/lib/validations/task";
import { useAssignTask, useEditAssignedTask, useEmployees } from "@/hooks/use-manager";
import { useProjects } from "@/hooks/use-projects";
import { TIME_SLOTS } from "@/lib/constants/office-hours";
import { countWords } from "@/lib/word-count";
import { TASK_DESCRIPTION_MIN_WORDS, TASK_DESCRIPTION_MAX_WORDS } from "@/lib/constants/task";
import { formatTime12h } from "@/lib/format";
import {
  DurationHoursPicker,
  durationAssignButtonLabel,
  getDurationAssignPlan,
} from "@/components/tasks/duration-hours-picker";

interface TaskForEdit {
  _id: string;
  project: { _id: string; name: string };
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedTo: { _id: string; name: string };
}

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskForEdit | null;
  employeeId?: string;
  date?: string;
  slotStart?: string;
  slotEnd?: string;
  /** Other occupied start times for this employee/day (client-side duration preview). */
  occupiedStarts?: string[];
  copyFrom?: {
    project: { _id: string; name: string };
    title: string;
    description: string;
  } | null;
}

export function AssignTaskDialog({
  open,
  onOpenChange,
  task,
  employeeId,
  date,
  slotStart,
  slotEnd,
  occupiedStarts = [],
  copyFrom,
}: AssignTaskDialogProps) {
  const isEdit = !!task;
  const lockContext = !isEdit && !!employeeId && !!slotStart;
  const [durationHours, setDurationHours] = useState(1);

  const { data: employeesData } = useEmployees();
  const { data: projectsData } = useProjects({ limit: 100, archived: "false" });
  const employees = employeesData?.data ?? [];
  const projects = (projectsData?.data?.projects ?? []) as Array<{ _id: string; name: string }>;

  type TaskFormValues = z.input<typeof taskSchema>;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
  });

  const assignTask = useAssignTask();
  const editTask = useEditAssignedTask();

  useEffect(() => {
    if (!open) return;
    setDurationHours(1);

    if (task) {
      reset({
        project: task.project._id,
        title: task.title,
        description: task.description,
        date: new Date(task.date),
        startTime: task.startTime as TaskInput["startTime"],
        endTime: task.endTime as TaskInput["endTime"],
        assignedTo: task.assignedTo._id,
      });
    } else {
      reset({
        project: copyFrom?.project._id ?? "",
        title: copyFrom?.title ?? "",
        description: copyFrom?.description ?? "",
        date: date ? new Date(date) : new Date(),
        startTime: (slotStart ?? "09:30") as TaskInput["startTime"],
        endTime: (slotEnd ?? "10:30") as TaskInput["endTime"],
        assignedTo: employeeId ?? "",
      });
    }
  }, [open, task, date, slotStart, slotEnd, employeeId, copyFrom, reset]);

  const description = watch("description") ?? "";
  const wordCount = countWords(description);
  const startTime = watch("startTime");
  const assignedTo = watch("assignedTo");
  const lockedEmployee = employees.find((e) => e._id === assignedTo);
  const lockedSlot = TIME_SLOTS.find((s) => s.start === startTime);
  const durationPlan = getDurationAssignPlan(startTime, durationHours, occupiedStarts);

  const handleSlotChange = (start: string) => {
    const slot = TIME_SLOTS.find((s) => s.start === start);
    if (slot) {
      setValue("startTime", slot.start as TaskInput["startTime"]);
      setValue("endTime", slot.end as TaskInput["endTime"]);
    }
  };

  const onSubmit = async (values: TaskFormValues) => {
    try {
      if (isEdit) {
        const data = taskSchema.parse(values);
        await editTask.mutateAsync({ id: task._id, data });
        toast.success("Task updated.");
      } else {
        if (durationPlan && !durationPlan.canAssign) {
          toast.error(
            durationPlan.insufficientRemaining
              ? "Not enough slots remain from this start."
              : "Selected duration overlaps an occupied slot.",
          );
          return;
        }
        const data = taskCreateSchema.parse({ ...values, durationHours });
        await assignTask.mutateAsync(data);
        toast.success(
          durationHours === 1
            ? "Task assigned successfully."
            : `Assigned ${durationHours} hours successfully.`,
        );
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const assignDisabled =
    isSubmitting || (!isEdit && !!durationPlan && !durationPlan.canAssign);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Assigned Task" : "Assign Task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this assigned task." : "Assign a task to an employee."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Employee</Label>
            {lockContext ? (
              <Input
                value={lockedEmployee ? `${lockedEmployee.name} (${lockedEmployee.email})` : ""}
                readOnly
                disabled
                aria-label="Employee (locked)"
              />
            ) : (
              <Select
                value={assignedTo || null}
                onValueChange={(v) => setValue("assignedTo", v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee">
                    {employees.find((e) => e._id === assignedTo)?.name ?? null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.name} ({e.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.assignedTo && (
              <p className="text-destructive text-xs">{errors.assignedTo.message}</p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Select
              value={watch("project") || null}
              onValueChange={(v) => setValue("project", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project">
                  {projects.find((p) => p._id === watch("project"))?.name ?? null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p._id} value={String(p._id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project && <p className="text-destructive text-xs">{errors.project.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="assign-title">Title</Label>
            <Input
              id="assign-title"
              placeholder="Task title"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="assign-desc">Description</Label>
            <Textarea
              id="assign-desc"
              placeholder={`Describe the task (${TASK_DESCRIPTION_MIN_WORDS}–${TASK_DESCRIPTION_MAX_WORDS} words)…`}
              className="min-h-32"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            <div className="flex justify-between">
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description.message}</p>
              )}
              <p
                className={`ml-auto text-xs ${wordCount < TASK_DESCRIPTION_MIN_WORDS || wordCount > TASK_DESCRIPTION_MAX_WORDS ? "text-destructive" : "text-muted-foreground"}`}
              >
                {wordCount} / {TASK_DESCRIPTION_MIN_WORDS}–{TASK_DESCRIPTION_MAX_WORDS} words
              </p>
            </div>
          </div>

          <div className={lockContext ? "grid gap-1.5" : "grid grid-cols-2 gap-3"}>
            {!lockContext ? (
              <div className="grid gap-1.5">
                <Label htmlFor="assign-date">Date</Label>
                <Input
                  id="assign-date"
                  type="date"
                  {...register("date", { valueAsDate: true })}
                  aria-invalid={!!errors.date}
                />
                {errors.date && <p className="text-destructive text-xs">{errors.date.message}</p>}
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label>Time Slot</Label>
              {lockContext ? (
                <Input
                  value={
                    lockedSlot
                      ? `${formatTime12h(lockedSlot.start)} – ${formatTime12h(lockedSlot.end)}`
                      : ""
                  }
                  readOnly
                  disabled
                  aria-label="Time slot (locked)"
                />
              ) : (
                <Select value={startTime ?? null} onValueChange={(v) => handleSlotChange(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select slot">
                      {TIME_SLOTS.find((s) => s.start === startTime)
                        ? `${startTime} – ${TIME_SLOTS.find((s) => s.start === startTime)?.end}`
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.start} value={slot.start}>
                        {slot.start} – {slot.end}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.endTime && <p className="text-destructive text-xs">{errors.endTime.message}</p>}
            </div>
          </div>

          {!isEdit ? (
            <DurationHoursPicker
              startTime={startTime}
              durationHours={durationHours}
              onChange={setDurationHours}
              occupiedStarts={occupiedStarts}
            />
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={assignDisabled}>
              {isSubmitting
                ? "Saving…"
                : isEdit
                  ? "Update"
                  : durationAssignButtonLabel(durationHours, durationPlan?.canAssign ?? true)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
