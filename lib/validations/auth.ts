import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "Enter a valid office email address." }),
  password: z.string().min(1, { error: "Password is required." }),
});

export type LoginInput = z.infer<typeof loginSchema>;

const newPasswordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." });

/** API body — current + new only (confirm is UI-only). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Current password is required." }),
    newPassword: newPasswordSchema,
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    error: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Form schema — includes confirmPassword for typo protection. */
export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "Current password is required." }),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, { error: "Confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    error: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;
