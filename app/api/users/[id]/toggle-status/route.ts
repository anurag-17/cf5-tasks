import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { User } from "@/models";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Params) {
  await requireRole("admin");
  await connectDB();

  const { id } = await params;
  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
  }

  user.isActive = !user.isActive;
  await user.save();

  return NextResponse.json({ success: true, data: { id, isActive: user.isActive } });
}
