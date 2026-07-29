import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Optimistic check only — confirms a session exists before rendering a
// protected route. Real authorization (role checks, ownership) still happens
// server-side in layouts/route handlers, since Proxy can't safely do full
// session/DB lookups. See: docs/app/guides/authentication#proxy.
const PROTECTED_PREFIXES = ["/admin", "/manager", "/employee"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) => nextUrl.pathname.startsWith(prefix));

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*", "/manager/:path*", "/employee/:path*"],
};
