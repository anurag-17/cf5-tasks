import { z } from "zod";
import { TASK_START_TIMES, TASK_END_TIMES, TIME_SLOTS } from "@/lib/constants/office-hours";
import {
  TASK_DESCRIPTION_MIN_WORDS,
  TASK_DESCRIPTION_MAX_WORDS,
  TASK_STATUSES,
} from "@/lib/constants/task";
import { countWords } from "@/lib/word-count";
import { isPastUtcDay, toUtcDayStart } from "@/lib/dates";

const titleSchema = z.string().trim().min(3, { error: "Title must be at least 3 characters." });

const descriptionSchema = z
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
  );

const slotPairRefine = <T extends { startTime: string; endTime: string }>(data: T) =>
  TIME_SLOTS.some((slot) => slot.start === data.startTime && slot.end === data.endTime);

export const taskSchema = z
  .object({
    project: z.string().min(1, { error: "Select a project." }),
    title: titleSchema,
    description: descriptionSchema,
    date: z.coerce.date(),
    startTime: z.enum(TASK_START_TIMES),
    endTime: z.enum(TASK_END_TIMES),
    assignedTo: z.string().min(1, { error: "Select an employee." }),
  })
  .refine(slotPairRefine, { error: "Select a valid hourly slot.", path: ["endTime"] });

export type TaskInput = z.infer<typeof taskSchema>;

/** Admin/PM Team Tasks assign — optional free-text project; no Project ref. */
export const teamAssignTaskSchema = z
  .object({
    projectName: z
      .string()
      .trim()
      .max(150, { error: "Project name must be at most 150 characters." })
      .optional(),
    title: titleSchema,
    description: descriptionSchema,
    date: z.coerce.date(),
    startTime: z.enum(TASK_START_TIMES),
    endTime: z.enum(TASK_END_TIMES),
    assignedTo: z.string().min(1, { error: "Select an employee." }),
  })
  .refine(slotPairRefine, { error: "Select a valid hourly slot.", path: ["endTime"] })
  .refine((data) => !isPastUtcDay(toUtcDayStart(data.date)), {
    error: "Cannot add tasks on a past date.",
    path: ["date"],
  });

export type TeamAssignTaskInput = z.infer<typeof teamAssignTaskSchema>;

/** Team Tasks edit — same fields as create, but past dates allowed (read/edit existing). */
export const teamAssignTaskUpdateSchema = z
  .object({
    projectName: z
      .string()
      .trim()
      .max(150, { error: "Project name must be at most 150 characters." })
      .optional(),
    title: titleSchema,
    description: descriptionSchema,
    date: z.coerce.date(),
    startTime: z.enum(TASK_START_TIMES),
    endTime: z.enum(TASK_END_TIMES),
    assignedTo: z.string().min(1, { error: "Select an employee." }),
    status: z.enum(TASK_STATUSES).optional(),
  })
  .refine(slotPairRefine, { error: "Select a valid hourly slot.", path: ["endTime"] });

export type TeamAssignTaskUpdateInput = z.infer<typeof teamAssignTaskUpdateSchema>;

/**
 * Manager write body: linked Project id (schedule Free+ dialog) vs Team Tasks free-text.
 * Presence of a non-empty `project` string selects the linked-project schema.
 */
export function parseManagerTaskWriteBody(
  body: unknown,
  mode: "create" | "update",
):
  | { kind: "linked"; data: TaskInput }
  | { kind: "team"; data: TeamAssignTaskInput | TeamAssignTaskUpdateInput } {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : ({} as Record<string, unknown>);
  const projectId = typeof record.project === "string" ? record.project.trim() : "";

  if (projectId) {
    return { kind: "linked", data: taskSchema.parse(body) };
  }

  if (mode === "create") {
    return { kind: "team", data: teamAssignTaskSchema.parse(body) };
  }

  return { kind: "team", data: teamAssignTaskUpdateSchema.parse(body) };
}

export function normalizeOptionalProjectName(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const employeeTaskSchema = z
  .object({
    project: z.string().min(1, { error: "Select a project." }),
    title: titleSchema,
    description: descriptionSchema,
    date: z.coerce.date(),
    startTime: z.enum(TASK_START_TIMES),
    endTime: z.enum(TASK_END_TIMES),
    // Empty / omitted = self-logged task (no PM). Otherwise a project_manager user id.
    assignedBy: z.string().optional(),
  })
  .refine(slotPairRefine, { error: "Select a valid hourly slot.", path: ["endTime"] });

export type EmployeeTaskInput = z.infer<typeof employeeTaskSchema>;

export const updateEmployeeTaskSchema = z
  .object({
    project: z.string().min(1, { error: "Select a project." }).optional(),
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
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
