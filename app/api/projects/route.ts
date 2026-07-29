import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiAccess, requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { canReadProjects } from "@/lib/permissions";
import { caseInsensitiveExactRegex, escapeRegex } from "@/lib/escape-regex";
import { Project } from "@/models";
import { createProjectSchema, projectsQuerySchema } from "@/lib/validations/project";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiAccess(canReadProjects);
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = projectsQuerySchema.parse(params);

    const filter: Record<string, unknown> = {};

    if (query.archived === "true") filter.isArchived = true;
    else if (query.archived === "false") filter.isArchived = false;

    if (query.search) {
      filter.name = { $regex: escapeRegex(query.search), $options: "i" };
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
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiPermission("manageProjects");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const body = await req.json();
    const parsed = createProjectSchema.parse(body);

    const existing = await Project.findOne({
      name: { $regex: caseInsensitiveExactRegex(parsed.name), $options: "i" },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A project with this name already exists." },
        { status: 409 },
      );
    }

    const project = await Project.create({ ...parsed, createdBy: user.id });
    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
