import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="bg-background flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-3 text-center">
        <p className="text-primary text-sm font-semibold tracking-wide uppercase">404</p>
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">Page Not Found</h1>
        <p className="text-muted-foreground text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link href="/" className={buttonVariants({ size: "lg" })}>
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
