import { requireRole } from "@/lib/session";
import { AuthenticatedPlaceholder } from "@/components/auth/authenticated-placeholder";

export default async function ManagerPage() {
  const user = await requireRole(["admin", "project_manager"]);
  return <AuthenticatedPlaceholder title="Project Manager" user={user} />;
}
