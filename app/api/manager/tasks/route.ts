import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { isPastUtcDay, toUtcDayStart } from "@/lib/dates";
import { toObjectId } from "@/lib/mongoose-helpers";
import { planDurationAssign } from "@/lib/slot-utils";
import { Task } from "@/models";
import {
  normalizeOptionalProjectName,
  parseManagerTaskWriteBody,
} from "@/lib/validations/task";

function formatSlotRange(start: string, end: string) {
  return `${start}–${end}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiPermission("assignTasks");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const body = await req.json();
    const parsed = parseManagerTaskWriteBody(body, "create");
    const dayStart = toUtcDayStart(parsed.data.date);
    const durationHours =
      "durationHours" in parsed.data && typeof parsed.data.durationHours === "number"
        ? parsed.data.durationHours
        : 1;

    // Past dates are read-only for new tasks (linked + team assign).
    if (isPastUtcDay(dayStart)) {
      return NextResponse.json(
        { success: false, error: "Cannot add tasks on a past date." },
        { status: 400 },
      );
    }

    const occupiedDocs = await Task.find({
      assignedTo: parsed.data.assignedTo,
      date: dayStart,
    })
      .select("startTime")
      .lean();
    const occupiedStarts = occupiedDocs.map((doc) => doc.startTime);

    const plan = planDurationAssign(parsed.data.startTime, durationHours, occupiedStarts);

    if (!plan.canAssign) {
      if (plan.insufficientRemaining) {
        return NextResponse.json(
          {
            success: false,
            error: `Only ${plan.planned.length} free slot(s) remain from this start. Choose fewer hours or an earlier start.`,
            conflicts: [],
            planned: plan.planned,
            insufficientRemaining: true,
          },
          { status: 400 },
        );
      }

      const conflictLabels = plan.conflicts.map((slot) =>
        formatSlotRange(slot.start, slot.end),
      );
      return NextResponse.json(
        {
          success: false,
          error:
            conflictLabels.length === 1
              ? `This time slot is already occupied for the employee (${conflictLabels[0]}).`
              : `These time slots are already occupied for the employee: ${conflictLabels.join(", ")}.`,
          conflicts: plan.conflicts,
          planned: plan.planned,
          insufficientRemaining: false,
        },
        { status: 409 },
      );
    }

    const assignedToId = toObjectId(parsed.data.assignedTo);
    const assignedById = user.id;
    const base = {
      title: parsed.data.title,
      description: parsed.data.description,
      date: dayStart,
      assignedTo: assignedToId,
      assignedBy: assignedById,
    };

    const docs =
      parsed.kind === "linked"
        ? plan.planned.map((slot) => ({
            ...base,
            project: toObjectId(parsed.data.project),
            startTime: slot.start,
            endTime: slot.end,
          }))
        : (() => {
            const projectName = normalizeOptionalProjectName(parsed.data.projectName);
            return plan.planned.map((slot) => ({
              ...base,
              ...(projectName ? { projectName } : {}),
              startTime: slot.start,
              endTime: slot.end,
            }));
          })();

    const tasks = await Task.insertMany(docs, { ordered: true });
    return NextResponse.json({ success: true, data: tasks }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
