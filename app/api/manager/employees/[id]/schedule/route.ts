import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Task } from "@/models";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  await requireRole(["admin", "project_manager"]);
  await connectDB();

  const { id: employeeId } = await params;
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const tasks = await Task.find({ assignedTo: employeeId, date: dayStart })
    .populate("project", "name")
    .populate("assignedBy", "name")
    .sort({ startTime: 1 })
    .lean();

  return NextResponse.json({ success: true, data: tasks });
}
