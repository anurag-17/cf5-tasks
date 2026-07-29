import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { Task } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiRole("employee");
    if (!auth.ok) return auth.response;
    const user = auth.user;
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
  } catch (error) {
    return handleApiError(error);
  }
}
