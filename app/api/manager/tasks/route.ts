import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { isPastUtcDay, toUtcDayStart } from "@/lib/dates";
import { toObjectId } from "@/lib/mongoose-helpers";
import { Task } from "@/models";
import {
  normalizeOptionalProjectName,
  parseManagerTaskWriteBody,
} from "@/lib/validations/task";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiPermission("assignTasks");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const body = await req.json();
    const parsed = parseManagerTaskWriteBody(body, "create");
    const dayStart = toUtcDayStart(parsed.data.date);

    // Past dates are read-only for new tasks (linked + team assign).
    if (isPastUtcDay(dayStart)) {
      return NextResponse.json(
        { success: false, error: "Cannot add tasks on a past date." },
        { status: 400 },
      );
    }

    const existing = await Task.findOne({
      assignedTo: parsed.data.assignedTo,
      date: dayStart,
      startTime: parsed.data.startTime,
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This time slot is already occupied for the employee." },
        { status: 409 },
      );
    }

    if (parsed.kind === "linked") {
      const task = await Task.create({
        project: toObjectId(parsed.data.project),
        title: parsed.data.title,
        description: parsed.data.description,
        date: dayStart,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        assignedTo: toObjectId(parsed.data.assignedTo),
        assignedBy: user.id,
      });
      return NextResponse.json({ success: true, data: task }, { status: 201 });
    }

    const projectName = normalizeOptionalProjectName(parsed.data.projectName);
    const task = await Task.create({
      ...(projectName ? { projectName } : {}),
      title: parsed.data.title,
      description: parsed.data.description,
      date: dayStart,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      assignedTo: toObjectId(parsed.data.assignedTo),
      assignedBy: user.id,
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
