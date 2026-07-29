import { requireRole } from "@/lib/session";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";

export default async function ManagerProjectsPage() {
  await requireRole(["admin", "project_manager"]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <ProjectsPageClient />
    </div>
  );
}
