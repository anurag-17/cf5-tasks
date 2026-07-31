import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { escapeRegex } from "@/lib/escape-regex";
import {
  canAssignAuthRole,
  employeeOnlyForbiddenResponse,
  isEmployeeOnlyUserManager,
} from "@/lib/user-management-scope";
import { User } from "@/models";
import { createUserSchema, usersQuerySchema, normalizeEmployeeRole } from "@/lib/validations/user";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = usersQuerySchema.parse(params);
    const employeeOnly = isEmployeeOnlyUserManager(auth.user.role);

    const filter: Record<string, unknown> = {};
    if (employeeOnly) {
      // Managers only see employees, regardless of ?role=.
      filter.role = "employee";
    } else if (query.role !== "all") {
      filter.role = query.role;
    }

    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: "i" };
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: { users, total, page: query.page, totalPages: Math.ceil(total / query.limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const body = await req.json();
    const parsed = createUserSchema.parse(body);

    if (!canAssignAuthRole(auth.user.role, parsed.role)) {
      return employeeOnlyForbiddenResponse(
        "You can only create employee accounts.",
      );
    }

    const existing = await User.findOne({ email: parsed.email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A user with this email already exists." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 10);
    const employeeRole =
      parsed.role === "employee" ? normalizeEmployeeRole(parsed.employeeRole) : undefined;

    const user = await User.create({
      name: parsed.name,
      email: parsed.email,
      password: hashedPassword,
      role: parsed.role,
      ...(employeeRole ? { employeeRole } : {}),
    });

    const safeUser = { ...(user.toObject() as unknown as Record<string, unknown>) };
    delete safeUser.password;
    return NextResponse.json({ success: true, data: safeUser }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
