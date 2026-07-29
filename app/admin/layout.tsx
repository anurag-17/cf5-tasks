import { requireRole } from "@/lib/session";
import { getSidebarDefaultOpen } from "@/lib/sidebar-server";
import { ModuleShell } from "@/components/layouts/module-shell";

const ADMIN_NAV = [
  { href: "/admin", label: "Schedule", iconKey: "calendarDays" },
  { href: "/admin/users", label: "Users", iconKey: "users" },
  { href: "/admin/projects", label: "Projects", iconKey: "folderKanban" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, defaultSidebarOpen] = await Promise.all([
    requireRole("admin"),
    getSidebarDefaultOpen(),
  ]);

  return (
    <ModuleShell
      moduleLabel="Admin"
      navItems={[...ADMIN_NAV]}
      user={user}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      {children}
    </ModuleShell>
  );
}
