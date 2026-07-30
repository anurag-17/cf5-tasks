import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { resolveDateParam } from "@/lib/dates";
import { Task, User } from "@/models";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("assignTasks");
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id: employeeId } = await params;

    if (!Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: "Invalid employee." },
        { status: 400 },
      );
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "employee",
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found." },
        { status: 404 },
      );
    }

    const dateParam = req.nextUrl.searchParams.get("date");
    const dayStart = resolveDateParam(dateParam);

    const tasks = await Task.find({ assignedTo: employeeId, date: dayStart })
      .populate("project", "name")
      .populate("assignedBy", "name")
      .sort({ startTime: 1 })
      .lean();

    const data = tasks.map((t) => {
      const projectDoc =
        t.project && typeof t.project === "object" && "_id" in t.project
          ? {
              _id: String((t.project as { _id: unknown })._id),
              name: String((t.project as { name?: string }).name ?? ""),
            }
          : null;

      return {
        _id: String(t._id),
        project: projectDoc,
        projectName: t.projectName ?? "",
        title: t.title,
        description: t.description,
        date: t.date,
        startTime: t.startTime,
        endTime: t.endTime,
        assignedBy: t.assignedBy,
        status: t.status,
        isReviewed: Boolean(t.isReviewed),
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
