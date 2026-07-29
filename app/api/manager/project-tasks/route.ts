import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { requireManagerApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api/handle-api-error";
import { Project, Task } from "@/models";

const querySchema = z.object({
  project: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireManagerApi();
    if (!auth.ok) return auth.response;
    const user = auth.user;
    await connectDB();

    const params = Object.fromEntries(req.nextUrl.searchParams);
    const query = querySchema.parse(params);

    const project = await Project.findById(query.project);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
    }

    if (project.createdBy.toString() !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
    }

    const filter: Record<string, unknown> = { project: query.project };
    if (query.date) {
      const d = new Date(query.date);
      filter.date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .populate("assignedBy", "name")
        .sort({ date: -1, startTime: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: { tasks, total, page: query.page, totalPages: Math.ceil(total / query.limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
