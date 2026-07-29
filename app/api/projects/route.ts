import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Project } from "@/models";
import { createProjectSchema, projectsQuerySchema } from "@/lib/validations/project";

export async function GET(req: NextRequest) {
  const user = await requireRole(["admin", "project_manager"]);
  await connectDB();

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const query = projectsQuerySchema.parse(params);

  const filter: Record<string, unknown> = {};

  if (query.archived === "true") filter.isArchived = true;
  else if (query.archived === "false") filter.isArchived = false;

  if (query.search) {
    filter.name = { $regex: query.search, $options: "i" };
  }

  // Project managers only see their own projects; admin sees all
  if (user.role === "project_manager") {
    filter.createdBy = user.id;
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: { projects, total, page: query.page, totalPages: Math.ceil(total / query.limit) },
  });
}

export async function POST(req: NextRequest) {
  const user = await requireRole(["admin", "project_manager"]);
  await connectDB();

  const body = await req.json();
  const parsed = createProjectSchema.parse(body);

  const existing = await Project.findOne({ name: { $regex: `^${parsed.name}$`, $options: "i" } });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "A project with this name already exists." },
      { status: 409 },
    );
  }

  const project = await Project.create({ ...parsed, createdBy: user.id });
  return NextResponse.json({ success: true, data: project }, { status: 201 });
}
