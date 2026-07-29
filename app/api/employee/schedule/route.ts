import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Task } from "@/models";

export async function GET(req: NextRequest) {
  const user = await requireRole(["admin", "project_manager", "employee"]);
  await connectDB();

  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const tasks = await Task.find({ assignedTo: user.id, date: dayStart })
    .populate("project", "name")
    .populate("assignedBy", "name")
    .sort({ startTime: 1 })
    .lean();

  return NextResponse.json({ success: true, data: tasks });
}
