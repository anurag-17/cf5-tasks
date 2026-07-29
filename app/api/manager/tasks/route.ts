import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { Task } from "@/models";
import { taskSchema } from "@/lib/validations/task";

export async function POST(req: NextRequest) {
  const auth = await requireApiRole("project_manager");
  if (!auth.ok) return auth.response;
  const user = auth.user;
  await connectDB();

  const body = await req.json();
  const parsed = taskSchema.parse(body);

  const dayStart = new Date(
    parsed.date.getFullYear(),
    parsed.date.getMonth(),
    parsed.date.getDate(),
  );

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
}
