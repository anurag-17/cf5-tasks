import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { User } from "@/models";
import { updateUserSchema } from "@/lib/validations/user";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id } = await params;
    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.parse(body);

    const updates: Record<string, unknown> = {};
    if (parsed.name) updates.name = parsed.name;
    if (parsed.email) updates.email = parsed.email.toLowerCase();
    if (parsed.role) updates.role = parsed.role;
    if (parsed.password) updates.password = await bcrypt.hash(parsed.password, 10);

    if (parsed.email) {
      const existing = await User.findOne({ email: parsed.email.toLowerCase(), _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "A user with this email already exists." },
          { status: 409 },
        );
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageUsers");
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id } = await params;
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin account." },
          { status: 409 },
        );
      }
    }

    await user.deleteOne();
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return handleApiError(error);
  }
}
