import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Project } from "@/models";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Params) {
  const user = await requireRole(["admin", "project_manager"]);
  await connectDB();

  const { id } = await params;
  const project = await Project.findById(id);
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found." }, { status: 404 });
  }

  if (user.role === "project_manager" && project.createdBy.toString() !== user.id) {
    return NextResponse.json({ success: false, error: "Not authorized." }, { status: 403 });
  }

  project.isArchived = !project.isArchived;
  await project.save();

  return NextResponse.json({ success: true, data: { id, isArchived: project.isArchived } });
}
