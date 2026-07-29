import { requireRole } from "@/lib/session";
import { ManagerDashboardClient } from "@/components/manager/manager-dashboard-client";

export default async function ManagerTasksPage() {
  await requireRole(["admin", "project_manager"]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-xl font-semibold">Task Management</h1>
      <ManagerDashboardClient />
    </div>
  );
}
