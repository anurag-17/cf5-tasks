import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IProject extends Document {
  name: string;
  description?: string;
  isArchived: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    // Shown as the "Project" column throughout (task rows, Admin's
    // employee-wise schedule table) and used for "Filter by project" — kept
    // unique so the same name can't be created twice and silently split a
    // team's tasks across two records.
    name: { type: String, required: true, unique: true, trim: true, maxlength: 150 },

    // Optional context for the project; requirement.txt puts no validation
    // rule on this (unlike Task's description), so it stays optional.
    description: { type: String, trim: true, maxlength: 1000 },

    isArchived: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// PM's "my projects" / attribution lookups.
ProjectSchema.index({ createdBy: 1 });

export const Project: Model<IProject> = models.Project ?? model<IProject>("Project", ProjectSchema);
