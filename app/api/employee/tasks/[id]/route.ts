import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { toUtcDayStart } from "@/lib/dates";
import { toObjectId } from "@/lib/mongoose-helpers";
import { Task, User } from "@/models";
import { updateEmployeeTaskSchema } from "@/lib/validations/task";
import { LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiRole("employee");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const { id } = await params;
    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    if (task.assignedTo.toString() !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
    }

    if (task.isReviewed) {
      return NextResponse.json(
        { success: false, error: "Cannot edit a reviewed task." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = updateEmployeeTaskSchema.parse(body);

    const newStart = parsed.startTime ?? task.startTime;
    const newEnd = parsed.endTime ?? task.endTime;

    if (newStart === LUNCH_START_TIME || newEnd === LUNCH_END_TIME) {
      return NextResponse.json(
        { success: false, error: "Cannot move task to the lunch break slot." },
        { status: 400 },
      );
    }

    if (parsed.startTime && parsed.startTime !== task.startTime) {
      const newDate = parsed.date ? toUtcDayStart(parsed.date) : task.date;

      const conflict = await Task.findOne({
        assignedTo: user.id,
        date: newDate,
        startTime: parsed.startTime,
        _id: { $ne: id },
      });

      if (conflict) {
        return NextResponse.json(
          { success: false, error: "This time slot is already occupied." },
          { status: 409 },
        );
      }
    }

    if (parsed.date) {
      task.date = toUtcDayStart(parsed.date);
    }
    if (parsed.project) task.project = toObjectId(parsed.project);
    if (parsed.title) task.title = parsed.title;
    if (parsed.description) task.description = parsed.description;
    if (parsed.startTime) task.startTime = parsed.startTime;
    if (parsed.endTime) task.endTime = parsed.endTime;
    if (parsed.status) task.status = parsed.status;

    if (parsed.assignedBy !== undefined) {
      if (!parsed.assignedBy) {
        task.assignedBy = undefined;
      } else {
        const manager = await User.findOne({
          _id: parsed.assignedBy,
          role: "project_manager",
          isActive: true,
        }).select("_id");
        if (!manager) {
          return NextResponse.json(
            { success: false, error: "Select a valid project manager." },
            { status: 400 },
          );
        }
        task.assignedBy = manager._id;
      }
    }

    await task.save();
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiRole("employee");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const { id } = await params;
    const task = await Task.findById(id);

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    }

    if (task.assignedTo.toString() !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
    }

    if (task.isReviewed) {
      return NextResponse.json(
        { success: false, error: "Cannot delete a reviewed task." },
        { status: 403 },
      );
    }

    await task.deleteOne();
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return handleApiError(error);
  }
}
