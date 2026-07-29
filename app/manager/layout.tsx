import { requireRole } from "@/lib/session";
import { getSidebarDefaultOpen } from "@/lib/sidebar-server";
import { ModuleShell } from "@/components/layouts/module-shell";

const MANAGER_NAV = [
  { href: "/manager/tasks", label: "Tasks", iconKey: "listTodo" },
  { href: "/manager/projects", label: "Projects", iconKey: "folderKanban" },
] as const;

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const [user, defaultSidebarOpen] = await Promise.all([
    requireRole("project_manager"),
    getSidebarDefaultOpen(),
  ]);

  return (
    <ModuleShell
      moduleLabel="Project Manager"
      navItems={[...MANAGER_NAV]}
      user={user}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      {children}
    </ModuleShell>
  );
}
