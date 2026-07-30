import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { toUtcDayStart } from "@/lib/dates";
import { toObjectId } from "@/lib/mongoose-helpers";
import { Task } from "@/models";
import { TASK_STATUSES } from "@/lib/constants/task";
import {
  normalizeOptionalProjectName,
  parseManagerTaskWriteBody,
} from "@/lib/validations/task";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("assignTasks");
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

    if (task.isReviewed) {
      return NextResponse.json(
        { success: false, error: "Cannot edit a reviewed task." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = parseManagerTaskWriteBody(body, "update");
    const dayStart = toUtcDayStart(parsed.data.date);

    if (
      parsed.data.startTime !== task.startTime ||
      parsed.data.assignedTo !== task.assignedTo.toString() ||
      dayStart.getTime() !== task.date.getTime()
    ) {
      const conflict = await Task.findOne({
        assignedTo: parsed.data.assignedTo,
        date: dayStart,
        startTime: parsed.data.startTime,
        _id: { $ne: id },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: "This time slot is already occupied for the employee." },
          { status: 409 },
        );
      }
    }

    task.title = parsed.data.title;
    task.description = parsed.data.description;
    task.date = dayStart;
    task.startTime = parsed.data.startTime;
    task.endTime = parsed.data.endTime;
    task.assignedTo = toObjectId(parsed.data.assignedTo);

    if (parsed.kind === "linked") {
      task.project = toObjectId(parsed.data.project);
      task.projectName = undefined;
    } else {
      task.project = undefined;
      task.projectName = normalizeOptionalProjectName(parsed.data.projectName);
      if (
        "status" in parsed.data &&
        typeof parsed.data.status === "string" &&
        (TASK_STATUSES as readonly string[]).includes(parsed.data.status)
      ) {
        task.status = parsed.data.status;
      }
    }

    // Linked-project edits may still send status (e.g. status-only updates via full payload).
    if (
      parsed.kind === "linked" &&
      typeof body.status === "string" &&
      (TASK_STATUSES as readonly string[]).includes(body.status)
    ) {
      task.status = body.status;
    }

    await task.save();
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("assignTasks");
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
