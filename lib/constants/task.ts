export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "approved",
  "rejected",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  approved: "Approved",
  rejected: "Rejected",
};

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TASK_DESCRIPTION_MAX_WORDS = 200;

export const PROJECT_STATUSES = ["active", "on_hold", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "task_assigned",
  "task_approved",
  "task_rejected",
  "general",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
