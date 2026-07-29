import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_DESCRIPTION_MAX_WORDS } from "@/lib/constants/task";

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Use 24-hour HH:mm format." });

const wordCount = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

export const taskSchema = z.object({
  title: z.string().trim().min(3, { error: "Title must be at least 3 characters." }),
  project: z.string().min(1, { error: "Select a project." }),
  description: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => wordCount(value) <= TASK_DESCRIPTION_MAX_WORDS, {
      error: `Description must be ${TASK_DESCRIPTION_MAX_WORDS} words or fewer.`,
    })
    .optional(),
  date: z.coerce.date(),
  startTime: timeString,
  endTime: timeString,
  estimatedHours: z.coerce.number().positive({ error: "Must be greater than 0." }),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES).optional(),
  assignedTo: z.string().min(1, { error: "Select an employee." }),
});

export type TaskInput = z.infer<typeof taskSchema>;
