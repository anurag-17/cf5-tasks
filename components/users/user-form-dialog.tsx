"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user";
import { useCreateUser, useUpdateUser } from "@/hooks/use-users";
import { ROLE_LABELS } from "@/lib/constants/roles";

interface UserForEdit {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserForEdit | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput | UpdateUserInput>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: { name: "", email: "", password: "", role: "employee" },
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (user) {
      reset({ name: user.name, email: user.email, role: user.role as "employee" | "project_manager", password: "" });
    } else {
      reset({ name: "", email: "", password: "", role: "employee" });
    }
    setShowPassword(false);
  }, [user, reset, open]);

  const onSubmit = async (data: CreateUserInput | UpdateUserInput) => {
    try {
      if (isEdit) {
        const payload: UpdateUserInput = { ...data };
        if (!payload.password) delete payload.password;
        await updateUser.mutateAsync({ id: user._id, data: payload });
        toast.success("User updated successfully.");
      } else {
        await createUser.mutateAsync(data as CreateUserInput);
        toast.success("User created successfully.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const roleValue = watch("role") ?? "employee";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the user's details below." : "Fill in the details to create a new user."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Full name" {...register("name")} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="user@company.com" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="password">Password{isEdit ? " (leave blank to keep)" : ""}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={isEdit ? "••••••••" : "Min 8 characters"}
                className="pr-10"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center rounded-r-lg transition-colors outline-none"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4 shrink-0" />
                ) : (
                  <EyeIcon className="size-4 shrink-0" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select
              value={roleValue}
              onValueChange={(val) => setValue("role", val as "employee" | "project_manager")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">{ROLE_LABELS.employee}</SelectItem>
                <SelectItem value="project_manager">{ROLE_LABELS.project_manager}</SelectItem>
              </SelectContent>
            </Select>
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
