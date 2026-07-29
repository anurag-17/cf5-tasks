import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { roleHomePath } from "@/lib/permissions";
import type { Role } from "@/lib/constants/roles";

/**
 * Server-only session helpers for Server Components, Route Handlers, and
 * Server Actions. These are the *authoritative* checks — proxy.ts only
 * redirects optimistically before a request reaches the app; every
 * protected page must still call one of these itself. See:
 * node_modules/next/dist/docs/01-app/02-guides/authentication.md
 */

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Redirects to /login (preserving the current path as callbackUrl) if signed out. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** Redirects signed-out users to /login, and wrong-role users to their own home. */
export async function requireRole(allowed: Role | readonly Role[]) {
  const user = await requireUser();
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

  if (!allowedRoles.includes(user.role)) {
    redirect(roleHomePath(user.role));
  }

  return user;
}
