import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db/mongoose";
import { requireRole } from "@/lib/session";
import { Task } from "@/models";

const querySchema = z.object({
  project: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  await requireRole(["admin", "project_manager"]);
  await connectDB();

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const query = querySchema.parse(params);

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
}
