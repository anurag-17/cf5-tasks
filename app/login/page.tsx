import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { roleHomePath } from "@/lib/permissions";
import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants/app";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(roleHomePath(user.role));
  }

  const { callbackUrl } = await searchParams;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="bg-card w-full max-w-sm rounded-xl border p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">
              C
            </span>
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <ThemeToggle />
        </div>

        <h1 className="mb-1 text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground mb-6 text-sm">Use your office email to continue.</p>

        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
