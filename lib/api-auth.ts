import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { can, type Permission } from "@/lib/permissions";
import type { Role } from "@/lib/constants/roles";

type ApiUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type ApiAuthResult =
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

/** Permission-based API guard — use for capability checks (users, projects, tasks). */
export async function requireApiPermission(permission: Permission): Promise<ApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!can(user.role, permission)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}

/** Authenticated user with a custom permission predicate (e.g. canReadProjects). */
export async function requireApiAccess(
  check: (role: Role) => boolean,
): Promise<ApiAuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!check(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}

/** Manager module API guard — strict role + assignTasks permission. */
export async function requireManagerApi(): Promise<ApiAuthResult> {
  const auth = await requireApiRole("project_manager");
  if (!auth.ok) return auth;

  if (!can(auth.user.role, "assignTasks")) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}
