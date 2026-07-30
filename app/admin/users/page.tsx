import { UsersPageClient } from "@/components/users/users-page-client";

export default async function AdminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-none">
      <UsersPageClient />
    </div>
  );
}
