import { requireRole } from "@/lib/session";
import { AuthenticatedPlaceholder } from "@/components/auth/authenticated-placeholder";

export default async function EmployeePage() {
  const user = await requireRole(["admin", "project_manager", "employee"]);
  return <AuthenticatedPlaceholder title="Employee" user={user} />;
}
