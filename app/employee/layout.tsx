import { requireRole } from "@/lib/session";
import { ModuleShell } from "@/components/layouts/module-shell";

const EMPLOYEE_NAV = [{ href: "/employee/schedule", label: "Schedule" }] as const;

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("employee");

  return (
    <ModuleShell moduleLabel="Employee" navItems={[...EMPLOYEE_NAV]} user={user}>
      {children}
    </ModuleShell>
  );
}
