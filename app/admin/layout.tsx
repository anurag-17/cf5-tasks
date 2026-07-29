import { requireRole } from "@/lib/session";
import { ModuleShell } from "@/components/layouts/module-shell";

const ADMIN_NAV = [
  { href: "/admin", label: "Schedule" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/projects", label: "Projects" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");

  return (
    <ModuleShell moduleLabel="Admin" navItems={[...ADMIN_NAV]} user={user}>
      {children}
    </ModuleShell>
  );
}
