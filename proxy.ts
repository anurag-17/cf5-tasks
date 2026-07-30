import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { rolesAllowedForRoute, roleHomePath } from "@/lib/permissions";

// Optimistic check only — confirms a session/role exists before rendering a
// protected route, for fast redirects and to avoid a flash of protected UI.
// It is NOT the authorization boundary: every protected layout must still call
// requireRole() from lib/session.ts server-side.
const PROTECTED_PREFIXES = ["/admin", "/manager", "/employee"];
const PROTECTED_NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function withNoStore(res: NextResponse) {
  for (const [key, value] of Object.entries(PROTECTED_NO_STORE_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const user =
    session?.user?.id && session.error !== "SessionRevoked" ? session.user : undefined;

  if (nextUrl.pathname === "/login") {
    if (user) {
      return withNoStore(NextResponse.redirect(new URL(roleHomePath(user.role), nextUrl.origin)));
    }
    return;
  }

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => nextUrl.pathname === prefix || nextUrl.pathname.startsWith(`${prefix}/`),
  );
  if (!isProtectedRoute) return;

  if (!user) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return withNoStore(NextResponse.redirect(loginUrl));
  }

  const allowedRoles = rolesAllowedForRoute(nextUrl.pathname);
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return withNoStore(NextResponse.redirect(new URL(roleHomePath(user.role), nextUrl.origin)));
  }
});

export const config = {
  matcher: ["/login", "/admin/:path*", "/manager/:path*", "/employee/:path*"],
};
