import { SignOutButton } from "@/components/auth/sign-out-button";
import { ROLE_LABELS, type Role } from "@/lib/constants/roles";

/**
 * Minimal stand-in for each role's landing page — proves the full
 * login → JWT → role-gated route chain works end to end. Replace with the
 * real dashboard once that's built.
 */
export function AuthenticatedPlaceholder({
  title,
  user,
}: {
  title: string;
  user: { name?: string | null; email?: string | null; role: Role };
}) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="bg-card rounded-lg border px-5 py-4 text-center text-sm">
        <p className="font-medium">{user.name ?? user.email}</p>
        <p className="text-muted-foreground">{user.email}</p>
        <p className="text-muted-foreground mt-2">Role: {ROLE_LABELS[user.role]}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
