import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { User } from "@/models";

export async function GET() {
  const auth = await requireApiRole("project_manager");
  if (!auth.ok) return auth.response;
  await connectDB();

  const employees = await User.find({ role: "employee", isActive: true })
    .select("name email")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ success: true, data: employees });
}
