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

interface TaskForEdit {
  _id: string;
  project: { _id: string; name: string };
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface Project {
  _id: string;
  name: string;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskForEdit | null;
  date: string;
  slotStart?: string;
  slotEnd?: string;
}

export function TaskFormDialog({ open, onOpenChange, task, date, slotStart, slotEnd }: TaskFormDialogProps) {
  const isEdit = !!task;
  const [projects, setProjects] = useState<Project[]>([]);

  type TaskFormValues = z.input<typeof employeeTaskSchema>;
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
    if (open) {
      fetch("/api/projects?limit=100&archived=false")
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setProjects(res.data.projects);
        })
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (task) {
      reset({
        project: task.project._id,
        title: task.title,
        description: task.description,
        date: new Date(task.date),
        startTime: task.startTime as EmployeeTaskInput["startTime"],
        endTime: task.endTime as EmployeeTaskInput["endTime"],
      });
    } else {
      reset({
        project: "",
        title: "",
        description: "",
        date: new Date(date),
        startTime: (slotStart ?? "09:30") as EmployeeTaskInput["startTime"],
        endTime: (slotEnd ?? "10:30") as EmployeeTaskInput["endTime"],
      });
    }
  }, [task, date, slotStart, slotEnd, reset]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      const data = employeeTaskSchema.parse(values);
      if (isEdit) {
        await updateTask.mutateAsync({ id: task._id, data });
        toast.success("Task updated successfully.");
      } else {
        await createTask.mutateAsync(data);
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
          <DialogTitle>{isEdit ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update your task details." : "Fill in your task for this time slot."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Project</Label>
            <Select
              value={watch("project") ?? ""}
              onValueChange={(v) => setValue("project", v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select project" />
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
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" placeholder="Task title (main point)" {...register("title")} aria-invalid={!!errors.title} />
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
              {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
              <p className={`text-xs ml-auto ${wordCount < TASK_DESCRIPTION_MIN_WORDS || wordCount > TASK_DESCRIPTION_MAX_WORDS ? "text-destructive" : "text-muted-foreground"}`}>
                {wordCount} / {TASK_DESCRIPTION_MIN_WORDS}–{TASK_DESCRIPTION_MAX_WORDS} words
              </p>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Time Slot</Label>
            <Select value={startTime ?? ""} onValueChange={(v) => handleSlotChange(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => {
                  return (
                    <SelectItem key={slot.start} value={slot.start}>
                      {slot.start} – {slot.end}
                    </SelectItem>
                  );
                })}
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
