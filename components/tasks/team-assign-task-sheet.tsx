"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { useAssignTask, useEditAssignedTask } from "@/hooks/use-manager";
import { TIME_SLOTS, TASK_START_TIMES, TASK_END_TIMES } from "@/lib/constants/office-hours";
import {
  TASK_DESCRIPTION_MAX_WORDS,
  TASK_DESCRIPTION_MIN_WORDS,
} from "@/lib/constants/task";
import { isPastDateInputValue, todayDateInputValue } from "@/lib/dates";
import { formatTime12h } from "@/lib/format";
import { countWords } from "@/lib/word-count";
import {
  teamAssignTaskSchema,
  teamAssignTaskUpdateSchema,
  type TeamAssignTaskInput,
  type TeamAssignTaskUpdateInput,
} from "@/lib/validations/task";
import type { EmployeeSlotTask } from "@/components/tasks/employee-slot-row";
import { taskProjectLabel } from "@/components/tasks/employee-slot-row";
import {
  DurationHoursPicker,
  durationAssignButtonLabel,
  getDurationAssignPlan,
} from "@/components/tasks/duration-hours-picker";

/** Form-level schema: date as YYYY-MM-DD for `<input type="date">`. */
const teamAssignFormSchema = z
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
    assignedTo: z.string().min(1),
  })
  .refine(
    (data) => TIME_SLOTS.some((slot) => slot.start === data.startTime && slot.end === data.endTime),
    { error: "Select a valid hourly slot.", path: ["endTime"] },
  );

type FormValues = z.input<typeof teamAssignFormSchema>;

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

export function TeamAssignTaskSheet({
  open,
  onOpenChange,
  employee,
  assignedByName,
  date,
  slotStart,
  slotEnd,
  task,
  copyFrom,
  occupiedStarts = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: { _id: string; name: string; email?: string };
  assignedByName: string;
  date: string;
  slotStart?: string;
  slotEnd?: string;
  task?: EmployeeSlotTask | null;
  copyFrom?: { projectName?: string; title: string; description: string } | null;
  occupiedStarts?: string[];
}) {
  const isEdit = !!task;
  const [durationHours, setDurationHours] = useState(1);
  const assignTask = useAssignTask();
  const editTask = useEditAssignedTask();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(teamAssignFormSchema),
    defaultValues: {
      projectName: "",
      title: "",
      description: "",
      date,
      startTime: "09:30",
      endTime: "10:30",
      assignedTo: employee._id,
    },
  });

  useEffect(() => {
    if (!open) return;
    setDurationHours(1);

    if (task) {
      reset({
        projectName: taskProjectLabel(task) === "—" ? "" : taskProjectLabel(task),
        title: task.title,
        description: task.description,
        date: toYyyyMmDd(task.date),
        startTime: task.startTime as FormValues["startTime"],
        endTime: task.endTime as FormValues["endTime"],
        assignedTo: employee._id,
      });
      return;
    }

    reset({
      projectName: copyFrom?.projectName ?? "",
      title: copyFrom?.title ?? "",
      description: copyFrom?.description ?? "",
      date,
      startTime: (slotStart ?? "09:30") as FormValues["startTime"],
      endTime: (slotEnd ?? "10:30") as FormValues["endTime"],
      assignedTo: employee._id,
    });
  }, [open, task, copyFrom, date, slotStart, slotEnd, employee._id, reset]);

  const description = watch("description") ?? "";
  const wordCount = countWords(description);
  const startTime = watch("startTime");
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
            ? "Task assigned."
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
    <Sheet
      open={open}
      disablePointerDismissal
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen && details.reason !== "close-press") {
          details.cancel();
          return;
        }
        onOpenChange(nextOpen);
      }}
    >
        <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[60vw]">
        <SheetHeader className="border-b px-4 py-4 pr-12">
          <SheetTitle>{isEdit ? "Edit Task" : "Assign Task"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this assigned task."
              : "Assign a task to this employee. Assigned by is locked to you."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="grid gap-1.5">
              <Label>Employee</Label>
              <Input
                value={
                  employee.email ? `${employee.name} (${employee.email})` : employee.name
                }
                readOnly
                disabled
                aria-label="Employee (locked)"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>Assigned By</Label>
              <Input
                value={assignedByName}
                readOnly
                disabled
                aria-label="Assigned by (locked)"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="team-project-name">Project name</Label>
              <Input
                id="team-project-name"
                placeholder="Optional"
                {...register("projectName")}
                aria-invalid={!!errors.projectName}
              />
              {errors.projectName ? (
                <p className="text-destructive text-xs">{errors.projectName.message}</p>
              ) : (
                <p className="text-muted-foreground text-xs">Optional — free text, not a project list.</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="team-title">Title</Label>
              <Input
                id="team-title"
                placeholder="Task title"
                {...register("title")}
                aria-invalid={!!errors.title}
              />
              {errors.title ? (
                <p className="text-destructive text-xs">{errors.title.message}</p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="team-desc">Description</Label>
              <Textarea
                id="team-desc"
                placeholder={`Describe the task (${TASK_DESCRIPTION_MIN_WORDS}–${TASK_DESCRIPTION_MAX_WORDS} words)…`}
                className="min-h-32"
                {...register("description")}
                aria-invalid={!!errors.description}
              />
              <div className="flex justify-between gap-2">
                {errors.description ? (
                  <p className="text-destructive text-xs">{errors.description.message}</p>
                ) : (
                  <span />
                )}
                <p
                  className={`ml-auto text-xs ${
                    wordCount < TASK_DESCRIPTION_MIN_WORDS ||
                    wordCount > TASK_DESCRIPTION_MAX_WORDS
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {wordCount} / {TASK_DESCRIPTION_MIN_WORDS}–{TASK_DESCRIPTION_MAX_WORDS} words
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="team-date">Date</Label>
                <Input
                  id="team-date"
                  type="date"
                  min={isEdit ? undefined : todayDateInputValue()}
                  {...register("date")}
                  aria-invalid={!!errors.date}
                />
                {errors.date ? (
                  <p className="text-destructive text-xs">{errors.date.message}</p>
                ) : null}
              </div>

              <div className="grid gap-1.5">
                <Label>Time slot</Label>
                <Select
                  value={startTime ?? null}
                  onValueChange={(v) => handleSlotChange(v ?? "")}
                >
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
                {errors.endTime ? (
                  <p className="text-destructive text-xs">{errors.endTime.message}</p>
                ) : null}
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
          </div>

          <div className="bg-card flex justify-end gap-2 border-t px-4 py-3">
            <Button type="submit" disabled={assignDisabled}>
              {isSubmitting
                ? "Saving…"
                : isEdit
                  ? "Update"
                  : durationAssignButtonLabel(durationHours, durationPlan?.canAssign ?? true)}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
