import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  description: z.string().trim().max(1000).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export const createProjectSchema = projectSchema;
export type CreateProjectInput = ProjectInput;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }).optional(),
  description: z.string().trim().max(1000).optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const projectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  archived: z.enum(["all", "true", "false"]).optional().default("false"),
});
