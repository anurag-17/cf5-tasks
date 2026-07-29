import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  head?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    head: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Department: Model<IDepartment> =
  models.Department ?? model<IDepartment>("Department", DepartmentSchema);
