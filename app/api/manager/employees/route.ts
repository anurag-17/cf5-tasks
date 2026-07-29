import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { User } from "@/models";

export async function GET() {
  await requireRole(["admin", "project_manager"]);
  await connectDB();

  const employees = await User.find({ role: "employee", isActive: true })
    .select("name email")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ success: true, data: employees });
}
