import { z } from "zod";
import { ROLES, DESIGNATIONS } from "@/lib/constants/roles";

export const userSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  email: z.email({ error: "Enter a valid office email address." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  role: z.enum(ROLES),
  designation: z.enum(DESIGNATIONS).optional(),
  department: z.string().min(1, { error: "Select a department." }).optional(),
});

export type UserInput = z.infer<typeof userSchema>;
