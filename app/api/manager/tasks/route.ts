import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireManagerApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { toUtcDayStart } from "@/lib/dates";
import { Task } from "@/models";
import { taskSchema } from "@/lib/validations/task";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireManagerApi();
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const body = await req.json();
    const parsed = taskSchema.parse(body);

    const dayStart = toUtcDayStart(parsed.date);

    const existing = await Task.findOne({
      assignedTo: parsed.assignedTo,
      date: dayStart,
      startTime: parsed.startTime,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This time slot is already occupied for the employee." },
        { status: 409 },
      );
    }

    const task = await Task.create({
      ...parsed,
      date: dayStart,
      assignedBy: user.id,
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
