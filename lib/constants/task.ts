// Description Validation: minimum 200 words, maximum 1000 words.
export const TASK_DESCRIPTION_MIN_WORDS = 200;
export const TASK_DESCRIPTION_MAX_WORDS = 1000;

/** Employee work progress — separate from Admin/PM `isReviewed` lock. */
export const TASK_STATUSES = ["pending", "in_progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export const DEFAULT_TASK_STATUS: TaskStatus = "pending";

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

/** Normalize missing/legacy documents to pending. */
export function normalizeTaskStatus(value: unknown): TaskStatus {
  return isTaskStatus(value) ? value : DEFAULT_TASK_STATUS;
}

