"use client";

import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useDeleteUser } from "@/hooks/use-users";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { _id: string; name: string } | null;
}

export function DeleteUserDialog({ open, onOpenChange, user }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser();

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteUser.mutateAsync(user._id);
      toast.success(`${user.name} has been deleted.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete User"
      description={
        <>
          Are you sure you want to permanently delete <strong>{user?.name}</strong>? This action
          cannot be undone.
        </>
      }
      isPending={deleteUser.isPending}
      onConfirm={handleDelete}
    />
  );
}
