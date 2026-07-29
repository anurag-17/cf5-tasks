import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";

export const userSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  email: z.email({ error: "Enter a valid office email address." }),
  password: z.string().min(8, { error: "Password must be at least 8 characters." }),
  role: z.enum(ROLES),
});

export type UserInput = z.infer<typeof userSchema>;
