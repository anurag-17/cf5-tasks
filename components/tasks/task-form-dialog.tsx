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
import { employeeTaskSchema } from "@/lib/validations/task";
import type { EmployeeTaskInput } from "@/lib/validations/task";
import { useCreateTask, useUpdateTask } from "@/hooks/use-employee-tasks";
import { TIME_SLOTS } from "@/lib/constants/office-hours";
import { countWords } from "@/lib/word-count";
import { TASK_DESCRIPTION_MIN_WORDS, TASK_DESCRIPTION_MAX_WORDS } from "@/lib/constants/task";
import { z } from "zod";

const SELF_ASSIGNED = "__self__";

interface TaskForEdit {
  _id: string;
  project: { _id: string; name: string };
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedBy?: { _id: string; name: string };
}

interface Project {
  _id: string;
  name: string;
}

interface Manager {
  _id: string;
  name: string;
  email: string;
}

interface TaskCopySource {
  project: { _id: string; name: string };
  title: string;
  description: string;
  assignedBy?: { _id: string; name: string };
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskForEdit | null;
  copyFrom?: TaskCopySource | null;
  date: string;
  slotStart?: string;
  slotEnd?: string;
}

type TaskFormValues = z.input<typeof employeeTaskSchema>;

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  copyFrom,
  date,
  slotStart,
  slotEnd,
}: TaskFormDialogProps) {
  const isEdit = !!task;
  const isCopy = !!copyFrom && !isEdit;
  const [projects, setProjects] = useState<Project[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(employeeTaskSchema),
  });

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/projects?limit=100&archived=false").then((r) => r.json()),
      fetch("/api/employee/managers").then((r) => r.json()),
    ])
      .then(([projectsRes, managersRes]) => {
        if (projectsRes.success) {
          setProjects(
            (projectsRes.data.projects as Project[]).map((p) => ({
              _id: String(p._id),
              name: p.name,
            })),
          );
        }
        if (managersRes.success) {
          setManagers(
            (managersRes.data as Manager[]).map((m) => ({
              _id: String(m._id),
              name: m.name,
              email: m.email,
            })),
          );
        }
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (task) {
      reset({
        project: String(task.project._id),
        title: task.title,
        description: task.description,
        date: new Date(task.date),
        startTime: task.startTime as EmployeeTaskInput["startTime"],
        endTime: task.endTime as EmployeeTaskInput["endTime"],
        assignedBy: task.assignedBy?._id ? String(task.assignedBy._id) : undefined,
      });
    } else if (copyFrom) {
      reset({
        project: String(copyFrom.project._id),
        title: copyFrom.title,
        description: copyFrom.description,
        date: new Date(date),
        startTime: (slotStart ?? "09:30") as EmployeeTaskInput["startTime"],
        endTime: (slotEnd ?? "10:30") as EmployeeTaskInput["endTime"],
        assignedBy: copyFrom.assignedBy?._id ? String(copyFrom.assignedBy._id) : undefined,
      });
    } else {
      reset({
        project: "",
        title: "",
        description: "",
        date: new Date(date),
        startTime: (slotStart ?? "09:30") as EmployeeTaskInput["startTime"],
        endTime: (slotEnd ?? "10:30") as EmployeeTaskInput["endTime"],
        assignedBy: undefined,
      });
    }
  }, [task, copyFrom, date, slotStart, slotEnd, reset]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      const data = employeeTaskSchema.parse(values);
      const payload = {
        ...data,
        assignedBy: data.assignedBy || undefined,
      };
      if (isEdit) {
        await updateTask.mutateAsync({
          id: task._id,
          data: { ...payload, assignedBy: payload.assignedBy ?? "" },
        });
        toast.success("Task updated successfully.");
      } else {
        await createTask.mutateAsync(payload);
        toast.success("Task created successfully.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const description = watch("description") ?? "";
  const wordCount = countWords(description);
  const startTime = watch("startTime");
  const projectId = watch("project") ?? "";
  const assignedById = watch("assignedBy") ?? "";

  const projectLabel = projects.find((p) => p._id === projectId)?.name;
  const managerLabel = managers.find((m) => m._id === assignedById)?.name;
  const slotLabel = TIME_SLOTS.find((s) => s.start === startTime);

  const handleSlotChange = (start: string) => {
    const slot = TIME_SLOTS.find((s) => s.start === start);
    if (slot) {
      setValue("startTime", slot.start as EmployeeTaskInput["startTime"]);
      setValue("endTime", slot.end as EmployeeTaskInput["endTime"]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Task" : isCopy ? "Copy Task to Next Slot" : "Add Task"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your task details."
              : isCopy
                ? `Same details copied to ${slotStart ?? ""}–${slotEnd ?? ""}. Review and save.`
                : "Fill in your task for this time slot."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Select
              value={projectId || null}
              onValueChange={(v) => setValue("project", v ?? "", { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project">
                  {projectLabel ?? null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project && <p className="text-destructive text-xs">{errors.project.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label>Assigned By (Project Manager)</Label>
            <Select
              value={assignedById || SELF_ASSIGNED}
              onValueChange={(v) =>
                setValue("assignedBy", !v || v === SELF_ASSIGNED ? undefined : v, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Self (optional)">
                  {assignedById ? (managerLabel ?? null) : "Self"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SELF_ASSIGNED}>Self</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Optional — pick the PM if this work was assigned by them.
            </p>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              placeholder="Task title (main point)"
              {...register("title")}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Describe your work in detail (200–400 words)…"
              className="min-h-32"
              {...register("description")}
              aria-invalid={!!errors.description}
            />
            <div className="flex justify-between">
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description.message}</p>
              )}
              <p
                className={`text-xs ml-auto ${
                  wordCount < TASK_DESCRIPTION_MIN_WORDS || wordCount > TASK_DESCRIPTION_MAX_WORDS
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {wordCount} / {TASK_DESCRIPTION_MIN_WORDS}–{TASK_DESCRIPTION_MAX_WORDS} words
              </p>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Time Slot</Label>
            <Select value={startTime ?? null} onValueChange={(v) => handleSlotChange(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time slot">
                  {slotLabel ? `${slotLabel.start} – ${slotLabel.end}` : null}
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
            {errors.endTime && <p className="text-destructive text-xs">{errors.endTime.message}</p>}
          </div>

          <input type="hidden" {...register("date", { valueAsDate: true })} />

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Update" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
