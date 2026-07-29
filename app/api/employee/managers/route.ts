import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { User } from "@/models";

/** Active project managers for the employee task "Assigned By" dropdown. */
export async function GET() {
  try {
    const auth = await requireApiRole("employee");
    if (!auth.ok) return auth.response;
    await connectDB();

    const managers = await User.find({ role: "project_manager", isActive: true })
      .select("name email")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: managers });
  } catch (error) {
    return handleApiError(error);
  }
}
