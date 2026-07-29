import { z } from "zod";
import { PROJECT_STATUSES } from "@/lib/constants/task";

export const projectSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  description: z.string().trim().max(1000).optional(),
  manager: z.string().min(1, { error: "Select a manager." }).optional(),
  department: z.string().min(1, { error: "Select a department." }).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
