import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireManagerApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { resolveDateParam } from "@/lib/dates";
import { Task } from "@/models";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireManagerApi();
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id: employeeId } = await params;
    const dateParam = req.nextUrl.searchParams.get("date");
    const dayStart = resolveDateParam(dateParam);

    const tasks = await Task.find({ assignedTo: employeeId, date: dayStart })
      .populate("project", "name")
      .populate("assignedBy", "name")
      .sort({ startTime: 1 })
      .lean();

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return handleApiError(error);
  }
}
