import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
import { ROLES, DESIGNATIONS, type Role, type Designation } from "@/lib/constants/roles";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  designation?: Designation;
  department?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "employee" },
    designation: { type: String, enum: DESIGNATIONS },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User: Model<IUser> = models.User ?? model<IUser>("User", UserSchema);
