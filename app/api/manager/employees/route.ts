import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiAccess } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { isManagerial } from "@/lib/permissions";
import { User } from "@/models";

export async function GET() {
  try {
    const auth = await requireApiAccess(isManagerial);
    if (!auth.ok) return auth.response;
    await connectDB();

    const employees = await User.find({ role: "employee", isActive: true })
      .select("name email")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    return handleApiError(error);
  }
}
