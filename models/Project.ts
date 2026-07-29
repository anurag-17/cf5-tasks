import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants/task";

export interface IProject extends Document {
  name: string;
  description?: string;
  manager?: Types.ObjectId;
  department?: Types.ObjectId;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    manager: { type: Schema.Types.ObjectId, ref: "User" },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    status: { type: String, enum: PROJECT_STATUSES, default: "active" },
  },
  { timestamps: true },
);

export const Project: Model<IProject> = models.Project ?? model<IProject>("Project", ProjectSchema);
