import { ManagerDashboardClient } from "@/components/manager/manager-dashboard-client";

export default async function ManagerTasksPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-xl font-semibold">Task Management</h1>
      <ManagerDashboardClient />
    </div>
  );
}
