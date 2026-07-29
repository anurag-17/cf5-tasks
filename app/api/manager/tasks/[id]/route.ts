import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Task } from "@/models";
import { taskSchema } from "@/lib/validations/task";
import { LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await requireRole(["admin", "project_manager"]);
  await connectDB();

  const { id } = await params;
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
  }

  if (task.assignedBy?.toString() !== user.id && user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "You can only edit tasks you assigned." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = taskSchema.parse(body);

  if (parsed.startTime === LUNCH_START_TIME || parsed.endTime === LUNCH_END_TIME) {
    return NextResponse.json(
      { success: false, error: "Cannot assign a task during the lunch break." },
      { status: 400 },
    );
  }

  const dayStart = new Date(
    parsed.date.getFullYear(),
    parsed.date.getMonth(),
    parsed.date.getDate(),
  );

  if (parsed.startTime !== task.startTime || parsed.assignedTo !== task.assignedTo.toString() || dayStart.getTime() !== task.date.getTime()) {
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

  task.project = parsed.project as unknown as typeof task.project;
  task.title = parsed.title;
  task.description = parsed.description;
  task.date = dayStart;
  task.startTime = parsed.startTime;
  task.endTime = parsed.endTime;
  task.assignedTo = parsed.assignedTo as unknown as typeof task.assignedTo;

  await task.save();
  return NextResponse.json({ success: true, data: task });
}
