import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { User } from "@/models";
import { createUserSchema, usersQuerySchema } from "@/lib/validations/user";

export async function GET(req: NextRequest) {
  await requireRole("admin");
  await connectDB();

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const query = usersQuerySchema.parse(params);

  const filter: Record<string, unknown> = {};
  if (query.role !== "all") filter.role = query.role;
  if (query.search) {
    const regex = { $regex: query.search, $options: "i" };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: { users, total, page: query.page, totalPages: Math.ceil(total / query.limit) },
  });
}

export async function POST(req: NextRequest) {
  await requireRole("admin");
  await connectDB();

  const body = await req.json();
  const parsed = createUserSchema.parse(body);

  const existing = await User.findOne({ email: parsed.email.toLowerCase() });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A user with this email already exists." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsed.password, 10);
  const user = await User.create({ ...parsed, password: hashedPassword });

  const { password: _, ...safeUser } = user.toObject();
  return NextResponse.json({ success: true, data: safeUser }, { status: 201 });
}
