import { UsersPageClient } from "@/components/users/users-page-client";

export default async function ManagerUsersPage() {
  return (
    <div className="mx-auto w-full max-w-none">
      <UsersPageClient mode="manager" />
    </div>
  );
}
