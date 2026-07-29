import { requireRole } from "@/lib/session";
import { SchedulePageClient } from "@/components/tasks/schedule-page-client";

export default async function EmployeeSchedulePage() {
  await requireRole(["admin", "project_manager", "employee"]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SchedulePageClient />
    </div>
  );
}
