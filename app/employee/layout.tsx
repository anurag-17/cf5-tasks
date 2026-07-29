import { requireRole } from "@/lib/session";
import { getSidebarDefaultOpen } from "@/lib/sidebar-server";
import { ModuleShell } from "@/components/layouts/module-shell";

const EMPLOYEE_NAV = [
  { href: "/employee/tasks", label: "My Tasks", iconKey: "clipboardList" },
] as const;

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [user, defaultSidebarOpen] = await Promise.all([
    requireRole("employee"),
    getSidebarDefaultOpen(),
  ]);

  return (
    <ModuleShell
      moduleLabel="Employee"
      navItems={[...EMPLOYEE_NAV]}
      user={user}
      defaultSidebarOpen={defaultSidebarOpen}
    >
      {children}
    </ModuleShell>
  );
}
