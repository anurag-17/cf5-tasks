"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { CircleCheckIcon, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import {
  changePasswordFormSchema,
  type ChangePasswordFormInput,
} from "@/lib/validations/auth";
import { fetchJSON } from "@/lib/api/fetch-json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AUTO_SIGN_OUT_SECONDS = 60;

function PasswordField({
  id,
  label,
  autoComplete,
  error,
  registration,
}: {
  id: string;
  label: string;
  autoComplete: string;
  error?: string;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className="pr-10"
          {...registration}
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 z-10 flex w-10 items-center justify-center rounded-r-lg transition-colors outline-none"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon className="size-4 shrink-0" /> : <EyeIcon className="size-4 shrink-0" />}
        </button>
      </div>
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [success, setSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(AUTO_SIGN_OUT_SECONDS);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleSignInAgain = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  useEffect(() => {
    if (!open) {
      setSuccess(false);
      setSecondsLeft(AUTO_SIGN_OUT_SECONDS);
      return;
    }

    reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }, [open, reset]);

  useEffect(() => {
    if (!open || !success) return;

    if (secondsLeft <= 0) {
      void handleSignInAgain();
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [open, success, secondsLeft, handleSignInAgain]);

  const onSubmit = async (values: ChangePasswordFormInput) => {
    try {
      await fetchJSON("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      setSuccess(true);
      setSecondsLeft(AUTO_SIGN_OUT_SECONDS);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password.");
    }
  };

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(nextOpen, details) => {
        if (success) {
          details.cancel();
          return;
        }

        if (!nextOpen && details.reason !== "close-press") {
          details.cancel();
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={!success}>
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CircleCheckIcon className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                Password updated
              </DialogTitle>
              <DialogDescription>
                Your password has been changed. Save it somewhere safe, then sign in again with
                your new password.
              </DialogDescription>
            </DialogHeader>

            <p className="text-muted-foreground text-sm">
              Signing out automatically in{" "}
              <span className="text-foreground font-medium tabular-nums">{secondsLeft}s</span>…
            </p>

            <DialogFooter>
              <Button type="button" className="w-full sm:w-auto" onClick={() => void handleSignInAgain()}>
                Sign in again
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Change password</DialogTitle>
              <DialogDescription>
                Enter your current password, then choose a new one. After updating, you will need
                to sign in again with your new password.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
              <PasswordField
                id="change-current-password"
                label="Current password"
                autoComplete="current-password"
                error={errors.currentPassword?.message}
                registration={register("currentPassword")}
              />
              <PasswordField
                id="change-new-password"
                label="New password"
                autoComplete="new-password"
                error={errors.newPassword?.message}
                registration={register("newPassword")}
              />
              <PasswordField
                id="change-confirm-password"
                label="Confirm new password"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                registration={register("confirmPassword")}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isSubmitting ? "Updating…" : "Update password"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
