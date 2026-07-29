import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";

export const userSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  email: z.email({ error: "Enter a valid office email address." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  role: z.enum(ROLES),
});

export type UserInput = z.infer<typeof userSchema>;

const CREATABLE_ROLES = ["project_manager", "employee"] as const;

export const createUserSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  email: z.email({ error: "Enter a valid office email address." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  role: z.enum(CREATABLE_ROLES, { error: "Role must be Project Manager or Employee." }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }).optional(),
  email: z.email({ error: "Enter a valid office email address." }).optional(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .optional()
    .or(z.literal("")),
  role: z.enum(CREATABLE_ROLES, { error: "Role must be Project Manager or Employee." }).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const usersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  role: z.enum(["all", ...ROLES]).optional().default("all"),
});
