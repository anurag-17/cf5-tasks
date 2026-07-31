import { z } from "zod";
import { TASK_START_TIMES, TASK_END_TIMES, TIME_SLOTS } from "@/lib/constants/office-hours";
import {
  TASK_DESCRIPTION_MIN_WORDS,
  TASK_DESCRIPTION_MAX_WORDS,
  TASK_STATUSES,
} from "@/lib/constants/task";
import { MAX_DURATION_HOURS } from "@/lib/slot-utils";
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

/** Create-only: how many consecutive 1-hour slots to fill (omit / undefined → 1). */
export const durationHoursSchema = z.coerce
  .number({ error: "Duration must be a number." })
  .int({ error: "Duration must be a whole number of hours." })
  .min(1, { error: "Duration must be at least 1 hour." })
  .max(MAX_DURATION_HOURS, {
    error: `Duration cannot exceed ${MAX_DURATION_HOURS} hours.`,
  })
  .optional();

const linkedTaskFields = z.object({
  project: z.string().min(1, { error: "Select a project." }),
  title: titleSchema,
  description: descriptionSchema,
  date: z.coerce.date(),
  startTime: z.enum(TASK_START_TIMES),
  endTime: z.enum(TASK_END_TIMES),
  assignedTo: z.string().min(1, { error: "Select an employee." }),
});

/** Linked-project edit / single-slot shape (no duration). */
export const taskSchema = linkedTaskFields.refine(slotPairRefine, {
  error: "Select a valid hourly slot.",
  path: ["endTime"],
});

export type TaskInput = z.infer<typeof taskSchema>;

/** Linked-project create — optional multi-hour duration. */
export const taskCreateSchema = linkedTaskFields
  .extend({ durationHours: durationHoursSchema })
  .refine(slotPairRefine, { error: "Select a valid hourly slot.", path: ["endTime"] });

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

const teamAssignFields = z.object({
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
});

/** Admin/PM Team Tasks assign — optional free-text project; no Project ref. */
export const teamAssignTaskSchema = teamAssignFields
  .extend({ durationHours: durationHoursSchema })
  .refine(slotPairRefine, { error: "Select a valid hourly slot.", path: ["endTime"] })
  .refine((data) => !isPastUtcDay(toUtcDayStart(data.date)), {
    error: "Cannot add tasks on a past date.",
    path: ["date"],
  });

export type TeamAssignTaskInput = z.infer<typeof teamAssignTaskSchema>;

/** Team Tasks edit — same fields as create, but past dates allowed (read/edit existing). */
export const teamAssignTaskUpdateSchema = teamAssignFields
  .extend({ status: z.enum(TASK_STATUSES).optional() })
  .refine(slotPairRefine, { error: "Select a valid hourly slot.", path: ["endTime"] });

export type TeamAssignTaskUpdateInput = z.infer<typeof teamAssignTaskUpdateSchema>;

/**
 * Manager write body: linked Project id (schedule Free+ dialog) vs Team Tasks free-text.
 * Presence of a non-empty `project` string selects the linked-project schema.
 * Create mode accepts optional `durationHours` (multi-slot); update does not.
 */
export function parseManagerTaskWriteBody(
  body: unknown,
  mode: "create" | "update",
):
  | { kind: "linked"; data: TaskCreateInput | TaskInput }
  | { kind: "team"; data: TeamAssignTaskInput | TeamAssignTaskUpdateInput } {
  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : ({} as Record<string, unknown>);
  const projectId = typeof record.project === "string" ? record.project.trim() : "";

  if (projectId) {
    if (mode === "create") {
      return { kind: "linked", data: taskCreateSchema.parse(body) };
    }
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
