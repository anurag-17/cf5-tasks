import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import type { Role } from "@/lib/constants/roles";

type ApiUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

type ApiAuthResult =
  | { ok: true; user: ApiUser }
  | { ok: false; response: NextResponse };

/**
 * API-route auth guard. Returns JSON 401/403 instead of page redirects.
 * Use in Route Handlers; pages should keep using requireRole() from lib/session.
 */
export async function requireApiRole(
  allowed: Role | readonly Role[],
): Promise<ApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

  if (!allowedRoles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}
