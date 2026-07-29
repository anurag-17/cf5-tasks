import { ROLES, type Role } from "@/lib/constants/roles";

type Permission = "manageUsers" | "manageProjects" | "assignTasks" | "viewAllTasks";

const ROLE_PERMISSIONS = {
  admin: {
    manageUsers: true,
    manageProjects: true,
    assignTasks: true,
    viewAllTasks: true,
  },
  project_manager: {
    manageUsers: false,
    manageProjects: true,
    assignTasks: true,
    viewAllTasks: true,
  },
  employee: {
    manageUsers: false,
    manageProjects: false,
    assignTasks: false,
    viewAllTasks: false,
  },
} as const satisfies Record<Role, Record<Permission, boolean>>;

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function isManagerial(role: Role): boolean {
  return role === "admin" || role === "project_manager";
}

export function isValidRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

// Each role's landing route once signed in — used to route "/" and to send
// a signed-in user somewhere useful if they hit a route their role can't see.
const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  project_manager: "/manager",
  employee: "/employee",
};

export function roleHomePath(role: Role): string {
  return ROLE_HOME[role];
}

// Which roles may access each protected route prefix. Admin is treated as a
// superset that can view every role's area; Project Manager can also see the
// Employee area; Employee is restricted to its own. Consulted by both
// proxy.ts (optimistic redirect) and the page-level `requireRole` guard
// (the authoritative check) — see lib/session.ts.
const ROUTE_ACCESS: Record<string, readonly Role[]> = {
  "/admin": ["admin"],
  "/manager": ["admin", "project_manager"],
  "/employee": ["admin", "project_manager", "employee"],
};

export function rolesAllowedForRoute(pathname: string): readonly Role[] | null {
  const prefix = Object.keys(ROUTE_ACCESS).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  return prefix ? ROUTE_ACCESS[prefix] : null;
}
