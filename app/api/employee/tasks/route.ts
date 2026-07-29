import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { Task } from "@/models";
import { employeeTaskSchema } from "@/lib/validations/task";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole("employee");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const body = await req.json();
    const parsed = employeeTaskSchema.parse(body);

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
  } catch (error) {
    return handleApiError(error);
  }
}
