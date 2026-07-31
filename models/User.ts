import { Schema, model, models, type Document, type Model } from "mongoose";
import { ROLES, type Role } from "@/lib/constants/roles";
import { EMPLOYEE_ROLES, type EmployeeRole } from "@/lib/constants/employee-roles";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  /** Job specialty (Shopify, SEO, …). Used for schedule grouping; not auth. */
  employeeRole?: EmployeeRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    // Display name shown across the app (task lists, dashboard table rows).
    name: { type: String, required: true, trim: true },

    // Doubles as the login identity ("Login using Office Email"). Lowercased
    // + trimmed so "Amit@Co.com" and "amit@co.com " can't register as two
    // accounts. `unique: true` builds a unique index — the DB is the final
    // guard against duplicate accounts, not just app-level checks.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },

    // Bcrypt hash, never a plaintext password. `select: false` means normal
    // `User.find()`/`findOne()` queries omit it by default — callers must
    // explicitly `.select("+password")` (as auth.ts does during login), so a
    // stray `res.json(user)` elsewhere in the app can't leak the hash.
    password: { type: String, required: true, select: false, minlength: 8 },

    // Drives role-based access (Admin / Project Manager / Employee). Defaults
    // to the least-privileged role so a user can never end up over-privileged
    // by omission.
    role: { type: String, enum: ROLES, required: true, default: "employee" },

    // Job specialty for employees (schedule grouping / filters). Optional;
    // not used for auth. Cleared when role is not employee.
    employeeRole: { type: String, enum: EMPLOYEE_ROLES, required: false },

    // Lets Admin disable a login ("Manage all users") without deleting the
    // account — Tasks/Projects created by or assigned to this user keep a
    // valid reference either way, which a hard delete would break.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  (models.User as Model<IUser> | undefined) ?? model<IUser>("User", UserSchema);

// Hot-reload / long-lived Next server can keep a cached User model compiled
// before `employeeRole` existed — strict mode would strip the field on save.
if (!User.schema.path("employeeRole")) {
  User.schema.add({
    employeeRole: { type: String, enum: EMPLOYEE_ROLES, required: false },
  });
}
