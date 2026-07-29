import { requireRole } from "@/lib/session";
import { UsersPageClient } from "@/components/users/users-page-client";

export default async function AdminUsersPage() {
  await requireRole("admin");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <UsersPageClient />
    </div>
  );
}
