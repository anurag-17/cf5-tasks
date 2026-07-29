import { requireRole } from "@/lib/session";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";

export default async function AdminProjectsPage() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ProjectsPageClient />
    </div>
  );
}
