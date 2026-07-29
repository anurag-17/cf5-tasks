import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().trim().min(2, { error: "Name must be at least 2 characters." }),
  description: z.string().trim().max(1000).optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
