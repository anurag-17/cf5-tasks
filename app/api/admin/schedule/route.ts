import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { resolveDateParam } from "@/lib/dates";
import { populatedId, populatedName } from "@/lib/mongoose-helpers";
import { normalizeTaskStatus } from "@/lib/constants/task";
import { Task, User } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiRole("admin");
    if (!auth.ok) return auth.response;
    await connectDB();

    const dateParam = req.nextUrl.searchParams.get("date");
    const employeeFilter = req.nextUrl.searchParams.get("employee");
    const projectFilter = req.nextUrl.searchParams.get("project");

    const dayStart = resolveDateParam(dateParam);

    const taskFilter: Record<string, unknown> = { date: dayStart };
    if (employeeFilter) taskFilter.assignedTo = employeeFilter;
    if (projectFilter) taskFilter.project = projectFilter;

    const employeeQuery: Record<string, unknown> = { role: "employee", isActive: true };
    if (employeeFilter) employeeQuery._id = employeeFilter;

    const [employees, tasks] = await Promise.all([
      User.find(employeeQuery).select("name").sort({ name: 1 }).lean(),
      Task.find(taskFilter)
        .populate("project", "name")
        .populate("assignedBy", "name")
        .lean(),
    ]);

    const taskMap: Record<
      string,
      Record<
        string,
        {
          title: string;
          description: string;
          project: string;
          projectId: string;
          assignedBy: string;
          endTime: string;
          status: string;
          isReviewed: boolean;
        }
      >
    > = {};
    for (const t of tasks) {
      const empId = t.assignedTo.toString();
      if (!taskMap[empId]) taskMap[empId] = {};
      taskMap[empId][t.startTime] = {
        title: t.title,
        description: t.description,
        project: populatedName(t.project, "") || t.projectName || "—",
        projectId: populatedId(t.project),
        assignedBy: populatedName(t.assignedBy, "Self"),
        endTime: t.endTime,
        status: normalizeTaskStatus(t.status),
        isReviewed: Boolean(t.isReviewed),
      };
    }

    const rows = employees.map((emp) => ({
      _id: emp._id.toString(),
      name: emp.name,
      slots: taskMap[emp._id.toString()] ?? {},
    }));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return handleApiError(error);
  }
}
