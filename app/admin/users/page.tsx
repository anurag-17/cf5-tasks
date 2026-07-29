import { UsersPageClient } from "@/components/users/users-page-client";

export default async function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <UsersPageClient />
    </div>
  );
}
