import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { resolveDateParam } from "@/lib/dates";
import { buildScheduleRows, parseEmployeeRoleFilter } from "@/lib/schedule-rows";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiRole("admin");
    if (!auth.ok) return auth.response;
    await connectDB();

    const dateParam = req.nextUrl.searchParams.get("date");
    const employeeFilter = req.nextUrl.searchParams.get("employee");
    const projectFilter = req.nextUrl.searchParams.get("project");
    const employeeRoleFilter = parseEmployeeRoleFilter(
      req.nextUrl.searchParams.get("employeeRole"),
    );

    const dayStart = resolveDateParam(dateParam);
    const rows = await buildScheduleRows({
      dayStart,
      employeeFilter,
      projectFilter,
      employeeRoleFilter,
    });

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return handleApiError(error);
  }
}
