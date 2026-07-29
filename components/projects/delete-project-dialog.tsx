"use client";

import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useDeleteProject } from "@/hooks/use-projects";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { _id: string; name: string } | null;
}

export function DeleteProjectDialog({ open, onOpenChange, project }: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    if (!project) return;
    try {
      await deleteProject.mutateAsync(project._id);
      toast.success(`"${project.name}" has been deleted.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project.");
    }
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Project"
      description={
        <>
          Are you sure you want to permanently delete <strong>{project?.name}</strong>? Projects
          with tasks must be archived instead.
        </>
      }
      isPending={deleteProject.isPending}
      onConfirm={handleDelete}
    />
  );
}
