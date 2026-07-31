import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import {
  canAssignAuthRole,
  canManageTargetUser,
  employeeOnlyForbiddenResponse,
} from "@/lib/user-management-scope";
import { User } from "@/models";
import { updateUserSchema, normalizeEmployeeRole } from "@/lib/validations/user";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id } = await params;
    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (!canManageTargetUser(auth.user.role, user.role)) {
      return employeeOnlyForbiddenResponse();
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id } = await params;
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (!canManageTargetUser(auth.user.role, existingUser.role)) {
      return employeeOnlyForbiddenResponse();
    }

    const body = await req.json();
    const parsed = updateUserSchema.parse(body);

    if (parsed.role && !canAssignAuthRole(auth.user.role, parsed.role)) {
      return employeeOnlyForbiddenResponse(
        "You can only assign the Employee role.",
      );
    }

    const updates: Record<string, unknown> = {};
    if (parsed.name) updates.name = parsed.name;
    if (parsed.email) updates.email = parsed.email.toLowerCase();
    if (parsed.role) updates.role = parsed.role;
    if (parsed.password) updates.password = await bcrypt.hash(parsed.password, 10);

    const effectiveRole = parsed.role ?? existingUser.role;
    const employeeRoleProvided = Object.prototype.hasOwnProperty.call(body, "employeeRole");
    const normalizedEmployeeRole = normalizeEmployeeRole(parsed.employeeRole);

    let shouldClearEmployeeRole = false;
    if (effectiveRole !== "employee") {
      // Non-employees never keep a specialty.
      shouldClearEmployeeRole = true;
    } else if (employeeRoleProvided) {
      if (normalizedEmployeeRole) {
        updates.employeeRole = normalizedEmployeeRole;
      } else {
        // Explicit "" / null from the form = clear.
        shouldClearEmployeeRole = true;
      }
    }
    // If employeeRole was omitted from the body, leave the existing value unchanged.

    if (parsed.email) {
      const existing = await User.findOne({ email: parsed.email.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists." },
          { status: 409 },
        );
      }
    }

    const updateQuery: Record<string, unknown> = { $set: updates };
    if (shouldClearEmployeeRole) {
      updateQuery.$unset = { employeeRole: 1 };
    }

    const user = await User.findByIdAndUpdate(id, updateQuery, {
      new: true,
      runValidators: true,
    }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id } = await params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (!canManageTargetUser(auth.user.role, user.role)) {
      return employeeOnlyForbiddenResponse();
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin account." },
          { status: 409 },
        );
      }
    }

    await user.deleteOne();
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return handleApiError(error);
  }
}
