import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiAccess, requireApiPermission } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { canReadProjects } from "@/lib/permissions";
import { caseInsensitiveExactRegex } from "@/lib/escape-regex";
import { Project, Task } from "@/models";
import { updateProjectSchema } from "@/lib/validations/project";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiAccess(canReadProjects);
    if (!auth.ok) return auth.response;
    await connectDB();

    const { id } = await params;
    const project = await Project.findById(id).populate("createdBy", "name email").lean();
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageProjects");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateProjectSchema.parse(body);

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    if (user.role === "project_manager" && project.createdBy.toString() !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
    }

    if (parsed.name) {
      const existing = await Project.findOne({
        name: { $regex: caseInsensitiveExactRegex(parsed.name), $options: "i" },
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: "A project with this name already exists." },
          { status: 409 },
        );
      }
    }

    Object.assign(project, parsed);
    await project.save();

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireApiPermission("manageProjects");
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const { id } = await params;
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    if (user.role === "project_manager" && project.createdBy.toString() !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
    }

    const taskCount = await Task.countDocuments({ project: id });
    if (taskCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete project with ${taskCount} task(s). Archive it instead.`,
        },
        { status: 409 },
      );
    }

    await project.deleteOne();
    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    return handleApiError(error);
  }
}
