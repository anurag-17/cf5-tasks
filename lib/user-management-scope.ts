import "server-only";
import { NextResponse } from "next/server";
import type { Role } from "@/lib/constants/roles";

/** Project managers may manage employees only; admins keep full user-management access. */
export function isEmployeeOnlyUserManager(actorRole: Role): boolean {
  return actorRole === "project_manager";
}

export function employeeOnlyForbiddenResponse(
  message = "You can only manage employee accounts.",
) {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/** Whether this actor may create/update a user with `targetRole`. */
export function canAssignAuthRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "admin") {
    return targetRole === "employee" || targetRole === "project_manager";
  }
  if (actorRole === "project_manager") {
    return targetRole === "employee";
  }
  return false;
}

/**
 * Whether this actor may read/edit/delete/toggle the given user.
 * Admins: unchanged (any user; DELETE still guards last admin).
 * Managers: employees only.
 */
export function canManageTargetUser(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "admin") return true;
  if (actorRole === "project_manager") return targetRole === "employee";
  return false;
}
