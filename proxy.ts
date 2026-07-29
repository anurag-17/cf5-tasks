import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rolesAllowedForRoute, roleHomePath } from "@/lib/permissions";

// Optimistic check only — confirms a session/role exists before rendering a
// protected route, for fast redirects and to avoid a flash of protected UI.
// It is NOT the authorization boundary: every protected page must still call
// requireRole()/requireUser() from lib/session.ts server-side. See:
// node_modules/next/dist/docs/01-app/02-guides/authentication.md#proxy
const PROTECTED_PREFIXES = ["/admin", "/manager", "/employee"];

export default auth((req) => {
  const { nextUrl } = req;
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => nextUrl.pathname === prefix || nextUrl.pathname.startsWith(`${prefix}/`),
  );
  if (!isProtectedRoute) return;

  const user = req.auth?.user;

  if (!user) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles = rolesAllowedForRoute(nextUrl.pathname);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.redirect(new URL(roleHomePath(user.role), nextUrl.origin));
  }
});

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/employee/:path*"],
};
