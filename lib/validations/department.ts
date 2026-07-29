import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  head: z.string().min(1, { error: "Select a department head." }).optional(),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
