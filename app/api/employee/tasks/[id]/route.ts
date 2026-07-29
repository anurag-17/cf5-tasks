import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Task } from "@/models";
import { updateEmployeeTaskSchema } from "@/lib/validations/task";
import { LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireRole(["admin", "project_manager", "employee"]);
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
    const newDate = parsed.date
      ? new Date(parsed.date.getFullYear(), parsed.date.getMonth(), parsed.date.getDate())
      : task.date;

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
    task.date = new Date(
      parsed.date.getFullYear(),
      parsed.date.getMonth(),
      parsed.date.getDate(),
    );
  }
  if (parsed.project) task.project = parsed.project as unknown as typeof task.project;
  if (parsed.title) task.title = parsed.title;
  if (parsed.description) task.description = parsed.description;
  if (parsed.startTime) task.startTime = parsed.startTime;
  if (parsed.endTime) task.endTime = parsed.endTime;

  await task.save();
  return NextResponse.json({ success: true, data: task });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await requireRole(["admin", "project_manager", "employee"]);
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
}
