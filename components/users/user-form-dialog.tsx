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
import {
  EMPLOYEE_ROLES,
  EMPLOYEE_ROLE_LABELS,
  type EmployeeRole,
} from "@/lib/constants/employee-roles";
import {
  USERS_PAGE_ALLOWED_ROLES,
  defaultCreatableRole,
  type CreatableAuthRole,
  type UsersPageMode,
} from "@/components/users/users-page-mode";

interface UserForEdit {
  _id: string;
  name: string;
  email: string;
  role: string;
  employeeRole?: string | null;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserForEdit | null;
  /** Admin can pick Employee + PM; Manager only Employee. */
  mode?: UsersPageMode;
}

type FormValues = CreateUserInput | UpdateUserInput;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  mode = "admin",
}: UserFormDialogProps) {
  const isEdit = !!user;
  const [showPassword, setShowPassword] = useState(false);
  const [employeeRole, setEmployeeRole] = useState<EmployeeRole | "">("");
  const allowedRoles = USERS_PAGE_ALLOWED_ROLES[mode];
  const roleSelectLocked = allowedRoles.length === 1;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // Create vs update schemas differ slightly; cast keeps RHF happy when swapping.
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema) as never,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: defaultCreatableRole(mode),
      employeeRole: "",
    },
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (user) {
      const role = (
        allowedRoles.includes(user.role as CreatableAuthRole)
          ? user.role
          : defaultCreatableRole(mode)
      ) as CreatableAuthRole;
      const nextEmployeeRole = (user.employeeRole as EmployeeRole | undefined) ?? "";
      setEmployeeRole(nextEmployeeRole);
      reset({
        name: user.name,
        email: user.email,
        role,
        password: "",
        employeeRole: nextEmployeeRole,
      });
    } else {
      setEmployeeRole("");
      reset({
        name: "",
        email: "",
        password: "",
        role: defaultCreatableRole(mode),
        employeeRole: "",
      });
    }
    setShowPassword(false);
  }, [user, reset, open, mode, allowedRoles]);

  const onSubmit = async (data: FormValues) => {
    try {
      const role = (data.role ?? defaultCreatableRole(mode)) as CreatableAuthRole;
      if (!allowedRoles.includes(role)) {
        toast.error(
          mode === "manager"
            ? "You can only create employee accounts."
            : "Invalid role selected.",
        );
        return;
      }

      // Controlled local state is the source of truth for specialty (avoids
      // RHF + custom Select sync issues that dropped employeeRole on create).
      const employeeRolePayload = (
        role === "employee" ? employeeRole : ""
      ) as CreateUserInput["employeeRole"];

      if (isEdit) {
        const payload: UpdateUserInput = {
          ...data,
          role,
          employeeRole: employeeRolePayload,
        };
        if (!payload.password) delete payload.password;
        await updateUser.mutateAsync({ id: user._id, data: payload });
        toast.success("User updated successfully.");
      } else {
        await createUser.mutateAsync({
          ...(data as CreateUserInput),
          role,
          employeeRole: employeeRolePayload,
        });
        toast.success("User created successfully.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const roleValue =
    (watch("role") as CreatableAuthRole | undefined) ?? defaultCreatableRole(mode);
  const showEmployeeRole = roleValue === "employee";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the user's details below."
              : mode === "manager"
                ? "Create an employee account for your team."
                : "Fill in the details to create a new user."}
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
            <Input
              id="email"
              type="email"
              placeholder="user@company.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
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
            {roleSelectLocked ? (
              <Input
                value={ROLE_LABELS[allowedRoles[0]!]}
                readOnly
                disabled
                aria-label="Role (locked)"
              />
            ) : (
              <Select
                value={roleValue}
                onValueChange={(val) => {
                  const next = (val ?? "employee") as CreatableAuthRole;
                  if (!allowedRoles.includes(next)) return;
                  setValue("role", next, { shouldValidate: true });
                  if (next !== "employee") {
                    setEmployeeRole("");
                    setValue("employeeRole", "", { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {allowedRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {showEmployeeRole ? (
            <div className="grid gap-1.5">
              <Label>Employee role</Label>
              <Select
                value={employeeRole || "__none__"}
                onValueChange={(val) => {
                  const next =
                    !val || val === "__none__" ? ("" as const) : (val as EmployeeRole);
                  setEmployeeRole(next);
                  setValue("employeeRole", next, {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {EMPLOYEE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {EMPLOYEE_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeRole ? (
                <p className="text-destructive text-xs">{errors.employeeRole.message}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Job specialty shown on the users table and schedule grouping.
                </p>
              )}
            </div>
          ) : null}

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
