import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Task } from "@/models";
import { employeeTaskSchema } from "@/lib/validations/task";
import { LUNCH_START_TIME, LUNCH_END_TIME } from "@/lib/constants/office-hours";

export async function POST(req: NextRequest) {
  const user = await requireRole(["admin", "project_manager", "employee"]);
  await connectDB();

  const body = await req.json();
  const parsed = employeeTaskSchema.parse(body);

  if (parsed.startTime === LUNCH_START_TIME || parsed.endTime === LUNCH_END_TIME) {
    return NextResponse.json(
      { success: false, error: "Cannot create a task during the lunch break." },
      { status: 400 },
    );
  }

  const dayStart = new Date(
    parsed.date.getFullYear(),
    parsed.date.getMonth(),
    parsed.date.getDate(),
  );

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

  const task = await Task.create({
    ...parsed,
    date: dayStart,
    assignedTo: user.id,
  });

  return NextResponse.json({ success: true, data: task }, { status: 201 });
}
