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
import {
  teamAssignTaskSchema,
  teamAssignTaskUpdateSchema,
  type TeamAssignTaskInput,
  type TeamAssignTaskUpdateInput,
} from "@/lib/validations/task";
import { useAssignTask, useEditAssignedTask, useEmployees } from "@/hooks/use-manager";
import { TIME_SLOTS, TASK_START_TIMES, TASK_END_TIMES } from "@/lib/constants/office-hours";
import { countWords } from "@/lib/word-count";
import { TASK_DESCRIPTION_MIN_WORDS, TASK_DESCRIPTION_MAX_WORDS } from "@/lib/constants/task";
import { formatTime12h } from "@/lib/format";
import { isPastDateInputValue, todayDateInputValue } from "@/lib/dates";
import {
  DurationHoursPicker,
  durationAssignButtonLabel,
  getDurationAssignPlan,
} from "@/components/tasks/duration-hours-picker";

interface TaskForEdit {
  _id: string;
  project?: { _id: string; name: string } | null;
  projectName?: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedTo: { _id: string; name: string };
}

/** Form-level schema: date as YYYY-MM-DD for `<input type="date">`. */
const assignFormSchema = z
  .object({
    projectName: z.string().trim().max(150).optional(),
    title: z.string().trim().min(3, { error: "Title must be at least 3 characters." }),
    description: z
      .string()
      .trim()
      .refine(
        (value) => {
          const words = countWords(value);
          return words >= TASK_DESCRIPTION_MIN_WORDS && words <= TASK_DESCRIPTION_MAX_WORDS;
        },
        {
          error: `Description must be between ${TASK_DESCRIPTION_MIN_WORDS} and ${TASK_DESCRIPTION_MAX_WORDS} words.`,
        },
      ),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Select a valid date." }),
    startTime: z.enum(TASK_START_TIMES),
    endTime: z.enum(TASK_END_TIMES),
    assignedTo: z.string().min(1, { error: "Select an employee." }),
  })
  .refine(
    (data) => TIME_SLOTS.some((slot) => slot.start === data.startTime && slot.end === data.endTime),
    { error: "Select a valid hourly slot.", path: ["endTime"] },
  );

type FormValues = z.input<typeof assignFormSchema>;

function toYyyyMmDd(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return todayDateInputValue();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function editProjectName(task: TaskForEdit): string {
  return task.projectName?.trim() || task.project?.name?.trim() || "";
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
    projectName?: string;
    project?: { _id: string; name: string };
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
  const employees = employeesData?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(assignFormSchema),
    defaultValues: {
      projectName: "",
      title: "",
      description: "",
      date: date ?? todayDateInputValue(),
      startTime: "09:30",
      endTime: "10:30",
      assignedTo: employeeId ?? "",
    },
  });

  const assignTask = useAssignTask();
  const editTask = useEditAssignedTask();

  useEffect(() => {
    if (!open) return;
    setDurationHours(1);

    if (task) {
      reset({
        projectName: editProjectName(task),
        title: task.title,
        description: task.description,
        date: toYyyyMmDd(task.date),
        startTime: task.startTime as FormValues["startTime"],
        endTime: task.endTime as FormValues["endTime"],
        assignedTo: task.assignedTo._id,
      });
      return;
    }

    reset({
      projectName: copyFrom?.projectName?.trim() || copyFrom?.project?.name?.trim() || "",
      title: copyFrom?.title ?? "",
      description: copyFrom?.description ?? "",
      date: date ?? todayDateInputValue(),
      startTime: (slotStart ?? "09:30") as FormValues["startTime"],
      endTime: (slotEnd ?? "10:30") as FormValues["endTime"],
      assignedTo: employeeId ?? "",
    });
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
    if (!slot) return;
    setValue("startTime", slot.start as FormValues["startTime"], { shouldValidate: true });
    setValue("endTime", slot.end as FormValues["endTime"], { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (!isEdit && isPastDateInputValue(values.date)) {
        toast.error("Cannot add tasks on a past date.");
        return;
      }

      const payloadBase = {
        projectName: values.projectName?.trim() || undefined,
        title: values.title,
        description: values.description,
        date: new Date(values.date),
        startTime: values.startTime,
        endTime: values.endTime,
        assignedTo: values.assignedTo,
      };

      if (isEdit && task) {
        const parsed: TeamAssignTaskUpdateInput = teamAssignTaskUpdateSchema.parse(payloadBase);
        await editTask.mutateAsync({ id: task._id, data: parsed });
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
        const parsed: TeamAssignTaskInput = teamAssignTaskSchema.parse({
          ...payloadBase,
          durationHours,
        });
        await assignTask.mutateAsync(parsed);
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
                onValueChange={(v) => setValue("assignedTo", v ?? "", { shouldValidate: true })}
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
            <Label htmlFor="assign-project-name">Project name</Label>
            <Input
              id="assign-project-name"
              placeholder="Optional"
              {...register("projectName")}
              aria-invalid={!!errors.projectName}
            />
            {errors.projectName ? (
              <p className="text-destructive text-xs">{errors.projectName.message}</p>
            ) : (
              <p className="text-muted-foreground text-xs">Optional — free text, not required to save.</p>
            )}
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
                  min={isEdit ? undefined : todayDateInputValue()}
                  {...register("date")}
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
                        ? `${formatTime12h(startTime)} – ${formatTime12h(
                            TIME_SLOTS.find((s) => s.start === startTime)!.end,
                          )}`
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.start} value={slot.start}>
                        {formatTime12h(slot.start)} – {formatTime12h(slot.end)}
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
