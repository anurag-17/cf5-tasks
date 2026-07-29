import { requireRole } from "@/lib/session";
import { ModuleShell } from "@/components/layouts/module-shell";

const MANAGER_NAV = [
  { href: "/manager/tasks", label: "Tasks" },
  { href: "/manager/projects", label: "Projects" },
] as const;

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("project_manager");

  return (
    <ModuleShell moduleLabel="Project Manager" navItems={[...MANAGER_NAV]} user={user}>
      {children}
    </ModuleShell>
  );
}
