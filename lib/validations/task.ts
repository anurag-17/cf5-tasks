import { z } from "zod";
import { TASK_START_TIMES, TASK_END_TIMES, TIME_SLOTS } from "@/lib/constants/office-hours";
import {
  TASK_DESCRIPTION_MIN_WORDS,
  TASK_DESCRIPTION_MAX_WORDS,
  TASK_STATUSES,
} from "@/lib/constants/task";
import { countWords } from "@/lib/word-count";

export const taskSchema = z
  .object({
    project: z.string().min(1, { error: "Select a project." }),
    title: z.string().trim().min(3, { error: "Title must be at least 3 characters." }),
    description: z
      .string()
      .trim()
      .refine(
        (value) => {
          const words = countWords(value);
          return words >= TASK_DESCRIPTION_MIN_WORDS && words <= TASK_DESCRIPTION_MAX_WORDS;
        },
        {
          error: `Description must be between ${TASK_DESCRIPTION_MIN_WORDS} and ${TASK_DESCRIPTION_MAX_WORDS} words.`,
        },
      ),
    date: z.coerce.date(),
    startTime: z.enum(TASK_START_TIMES),
    endTime: z.enum(TASK_END_TIMES),
    assignedTo: z.string().min(1, { error: "Select an employee." }),
  })
  .refine(
    (data) => TIME_SLOTS.some((slot) => slot.start === data.startTime && slot.end === data.endTime),
    { error: "Select a valid hourly slot.", path: ["endTime"] },
  );

export type TaskInput = z.infer<typeof taskSchema>;

export const employeeTaskSchema = z
  .object({
    project: z.string().min(1, { error: "Select a project." }),
    title: z.string().trim().min(3, { error: "Title must be at least 3 characters." }),
    description: z
      .string()
      .trim()
      .refine(
        (value) => {
          const words = countWords(value);
          return words >= TASK_DESCRIPTION_MIN_WORDS && words <= TASK_DESCRIPTION_MAX_WORDS;
        },
        {
          error: `Description must be between ${TASK_DESCRIPTION_MIN_WORDS} and ${TASK_DESCRIPTION_MAX_WORDS} words.`,
        },
      ),
    date: z.coerce.date(),
    startTime: z.enum(TASK_START_TIMES),
    endTime: z.enum(TASK_END_TIMES),
    // Empty / omitted = self-logged task (no PM). Otherwise a project_manager user id.
    assignedBy: z.string().optional(),
  })
  .refine(
    (data) => TIME_SLOTS.some((slot) => slot.start === data.startTime && slot.end === data.endTime),
    { error: "Select a valid hourly slot.", path: ["endTime"] },
  );

export type EmployeeTaskInput = z.infer<typeof employeeTaskSchema>;

export const updateEmployeeTaskSchema = z
  .object({
    project: z.string().min(1, { error: "Select a project." }).optional(),
    title: z.string().trim().min(3, { error: "Title must be at least 3 characters." }).optional(),
    description: z
      .string()
      .trim()
      .refine(
        (value) => {
          const words = countWords(value);
          return words >= TASK_DESCRIPTION_MIN_WORDS && words <= TASK_DESCRIPTION_MAX_WORDS;
        },
        {
          error: `Description must be between ${TASK_DESCRIPTION_MIN_WORDS} and ${TASK_DESCRIPTION_MAX_WORDS} words.`,
        },
      )
      .optional(),
    date: z.coerce.date().optional(),
    startTime: z.enum(TASK_START_TIMES).optional(),
    endTime: z.enum(TASK_END_TIMES).optional(),
    assignedBy: z.string().optional(),
    status: z.enum(TASK_STATUSES).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return TIME_SLOTS.some((slot) => slot.start === data.startTime && slot.end === data.endTime);
      }
      return true;
    },
    { error: "Select a valid hourly slot.", path: ["endTime"] },
  );

export type UpdateEmployeeTaskInput = z.infer<typeof updateEmployeeTaskSchema>;
