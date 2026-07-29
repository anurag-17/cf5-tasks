import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Task, User } from "@/models";

export async function GET(req: NextRequest) {
  await requireRole("admin");
  await connectDB();

  const dateParam = req.nextUrl.searchParams.get("date");
  const employeeFilter = req.nextUrl.searchParams.get("employee");
  const projectFilter = req.nextUrl.searchParams.get("project");

  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Build task filter
  const taskFilter: Record<string, unknown> = { date: dayStart };
  if (employeeFilter) taskFilter.assignedTo = employeeFilter;
  if (projectFilter) taskFilter.project = projectFilter;

  // Fetch employees and tasks in parallel
  const employeeQuery: Record<string, unknown> = { role: "employee", isActive: true };
  if (employeeFilter) employeeQuery._id = employeeFilter;

  const [employees, tasks] = await Promise.all([
    User.find(employeeQuery).select("name email").sort({ name: 1 }).lean(),
    Task.find(taskFilter)
      .populate("project", "name")
      .populate("assignedBy", "name")
      .lean(),
  ]);

  // Group tasks by employee → startTime for O(1) lookup
  const taskMap: Record<string, Record<string, { title: string; project: string; assignedBy: string }>> = {};
  for (const t of tasks) {
    const empId = t.assignedTo.toString();
    if (!taskMap[empId]) taskMap[empId] = {};
    taskMap[empId][t.startTime] = {
      title: t.title,
      project: (t.project as { name: string })?.name ?? "—",
      assignedBy: (t.assignedBy as { name: string })?.name ?? "Self",
    };
  }

  // Build grid rows
  const rows = employees.map((emp) => ({
    _id: emp._id.toString(),
    name: emp.name,
    email: emp.email,
    slots: taskMap[emp._id.toString()] ?? {},
  }));

  return NextResponse.json({ success: true, data: rows });
}
