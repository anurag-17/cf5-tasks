import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import { TASK_START_TIMES, TASK_END_TIMES, TIME_SLOTS } from "@/lib/constants/office-hours";
import { TASK_DESCRIPTION_MIN_WORDS, TASK_DESCRIPTION_MAX_WORDS } from "@/lib/constants/task";
import { countWords } from "@/lib/word-count";

export interface ITask extends Document {
  project: Types.ObjectId;
  title: string;
  description: string;
  date: Date;
  startTime: string; // "HH:mm", one of TASK_START_TIMES
  endTime: string; // "HH:mm", one of TASK_END_TIMES
  assignedTo: Types.ObjectId;
  assignedBy?: Types.ObjectId;
  isReviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    // "Project Name" — stored as a reference (not a copied string) so
    // renaming a project doesn't require rewriting every task, and so Admin
    // can "Filter by project" with an indexed lookup instead of a text scan.
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },

    // "Task Title (Main Point)" — the short label shown in the Admin
    // dashboard's per-slot cell (e.g. "Login API").
    title: { type: String, required: true, trim: true, maxlength: 150 },

    // "Description" — free text, required, validated to the 200–400 word
    // window from requirement.txt. Mongoose's built-in minlength/maxlength
    // count *characters*, not words, so this needs a custom `validate`
    // instead; it shares `countWords` with the Zod form schema so both
    // layers agree on what "a word" is.
    description: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value: string) => {
          const words = countWords(value);
          return words >= TASK_DESCRIPTION_MIN_WORDS && words <= TASK_DESCRIPTION_MAX_WORDS;
        },
        message: `Description must be between ${TASK_DESCRIPTION_MIN_WORDS} and ${TASK_DESCRIPTION_MAX_WORDS} words.`,
      },
    },

    // "Date" the task is logged against. The app layer should always store
    // this normalized to midnight (UTC) — the compound index below relies on
    // same-day tasks sharing one exact Date value, and a time-of-day
    // component would silently break that.
    date: { type: Date, required: true },

    // "Start Time" / "End Time" — restricted to the fixed hourly slot
    // boundaries from requirement.txt's "Time Slots" list (lunch excluded).
    // This is what turns "tasks can only be added during office working
    // hours, on the hour" from a UI convention into a schema-enforced rule.
    startTime: { type: String, required: true, enum: TASK_START_TIMES },
    endTime: { type: String, required: true, enum: TASK_END_TIMES },

    // The employee this task belongs to. Not named as its own bullet under
    // "Task Details" in requirement.txt, but required by everything around
    // it — the Admin dashboard's "Employee" column, "employee-wise task
    // schedules", and "Assign tasks to employees" all assume a task has
    // exactly one owning employee.
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // "Assigned By (Project Manager)" — set to the PM's id when a PM assigns
    // the task. Left unset when an employee adds their own task directly
    // ("Employees can: ... Add and manage their own daily tasks"), so it's
    // optional rather than required.
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },

    // Backs "Delete their own task (if not reviewed)" — once a PM/Admin has
    // reviewed a task, the employee can no longer delete it. A plain boolean
    // rather than a full status workflow, since requirement.txt doesn't ask
    // for one.
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Enforces "only one task can be added per time slot" for a given employee
// at the database level (not just app logic), and doubles as the primary
// index for "this employee's day" lookups.
TaskSchema.index({ assignedTo: 1, date: 1, startTime: 1 }, { unique: true });

// Admin dashboard: "Filter by date" and "Filter by project" (date-only
// filtering also uses this index via its leading field).
TaskSchema.index({ date: 1, project: 1 });

// Project Manager: "View assigned tasks" (tasks where assignedBy = this PM).
TaskSchema.index({ assignedBy: 1 });

// Mongoose 9's pre-hook typings dropped the legacy `next` callback in favor
// of return/throw — throwing here fails validation with this message.
TaskSchema.pre("validate", function () {
  const validPair = TIME_SLOTS.some(
    (slot) => slot.start === this.startTime && slot.end === this.endTime,
  );
  if (!validPair) {
    throw new Error("startTime/endTime must match one of the defined hourly slots.");
  }
});

export const Task: Model<ITask> = models.Task ?? model<ITask>("Task", TaskSchema);
