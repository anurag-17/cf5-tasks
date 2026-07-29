import { requireRole } from "@/lib/session";
import { AuthenticatedPlaceholder } from "@/components/auth/authenticated-placeholder";

export default async function AdminPage() {
  const user = await requireRole("admin");
  return <AuthenticatedPlaceholder title="Admin" user={user} />;
}
