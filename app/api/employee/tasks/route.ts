import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { toUtcDayStart } from "@/lib/dates";
import { Task, User } from "@/models";
import { employeeTaskSchema } from "@/lib/validations/task";

async function resolveAssignedBy(assignedBy?: string) {
  if (!assignedBy) return undefined;
  const manager = await User.findOne({
    _id: assignedBy,
    role: "project_manager",
    isActive: true,
  }).select("_id");
  if (!manager) {
    return { error: "Select a valid project manager." as const };
  }
  return { id: manager._id };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole("employee");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const body = await req.json();
    const parsed = employeeTaskSchema.parse(body);

    const dayStart = toUtcDayStart(parsed.date);

    const existing = await Task.findOne({
      assignedTo: user.id,
      date: dayStart,
      startTime: parsed.startTime,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This time slot is already occupied." },
        { status: 409 },
      );
    }

    const assignedByResult = await resolveAssignedBy(parsed.assignedBy);
    if (assignedByResult && "error" in assignedByResult) {
      return NextResponse.json(
        { success: false, error: assignedByResult.error },
        { status: 400 },
      );
    }

    const { assignedBy: _ignored, ...taskFields } = parsed;
    const task = await Task.create({
      ...taskFields,
      date: dayStart,
      assignedTo: user.id,
      ...(assignedByResult?.id ? { assignedBy: assignedByResult.id } : {}),
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
