import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { Project } from "@/models";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_req: NextRequest, { params }: Params) {
  const auth = await requireApiRole(["admin", "project_manager"]);
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

  project.isArchived = !project.isArchived;
  await project.save();

  return NextResponse.json({ success: true, data: { id, isArchived: project.isArchived } });
}
