"use client";

import { useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { createProjectSchema } from "@/lib/validations/project";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project";
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";

interface ProjectForEdit {
  _id: string;
  name: string;
  description?: string;
}

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectForEdit | null;
}

export function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const isEdit = !!project;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  });

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  useEffect(() => {
    if (project) {
      reset({ name: project.name, description: project.description ?? "" });
    } else {
      reset({ name: "", description: "" });
    }
  }, [project, reset]);

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      if (isEdit) {
        const payload: UpdateProjectInput = {};
        if (data.name !== project.name) payload.name = data.name;
        if (data.description !== (project.description ?? "")) payload.description = data.description;
        await updateProject.mutateAsync({ id: project._id, data: payload });
        toast.success("Project updated successfully.");
      } else {
        await createProject.mutateAsync(data);
        toast.success("Project created successfully.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the project details." : "Fill in the details to create a new project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="project-name">Name</Label>
            <Input id="project-name" placeholder="Project name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="project-desc">Description (optional)</Label>
            <Input id="project-desc" placeholder="Brief description" {...register("description")} aria-invalid={!!errors.description} />
            {errors.description && <p className="text-destructive text-xs">{errors.description.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
