import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireManagerApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { toUtcDayStart } from "@/lib/dates";
import { toObjectId } from "@/lib/mongoose-helpers";
import { Task } from "@/models";
import { taskSchema } from "@/lib/validations/task";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManagerApi();
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const { id } = await params;
    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    if (task.assignedBy?.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only edit tasks you assigned." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = taskSchema.parse(body);

    const dayStart = toUtcDayStart(parsed.date);

    if (
      parsed.startTime !== task.startTime ||
      parsed.assignedTo !== task.assignedTo.toString() ||
      dayStart.getTime() !== task.date.getTime()
    ) {
      const conflict = await Task.findOne({
        assignedTo: parsed.assignedTo,
        date: dayStart,
        startTime: parsed.startTime,
        _id: { $ne: id },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: "This time slot is already occupied for the employee." },
          { status: 409 },
        );
      }
    }

    task.project = toObjectId(parsed.project);
    task.title = parsed.title;
    task.description = parsed.description;
    task.date = dayStart;
    task.startTime = parsed.startTime;
    task.endTime = parsed.endTime;
    task.assignedTo = toObjectId(parsed.assignedTo);

    await task.save();
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManagerApi();
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const { id } = await params;
    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    if (task.assignedBy?.toString() !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only cancel tasks you assigned." },
        { status: 403 },
      );
    }

    if (task.isReviewed) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel a reviewed task." },
        { status: 403 },
      );
    }

    await task.deleteOne();
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return handleApiError(error);
  }
}
