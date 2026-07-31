import { ROLES, type Role } from "@/lib/constants/roles";

export type Permission = "manageUsers" | "manageProjects" | "assignTasks" | "viewAllTasks";

const ROLE_PERMISSIONS = {
  admin: {
    manageUsers: true,
    manageProjects: true,
    assignTasks: true,
    viewAllTasks: true,
  },
  project_manager: {
    manageUsers: true,
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

/** Employees may read project lists (e.g. task form dropdown) without manageProjects. */
export function canReadProjects(role: Role): boolean {
  return can(role, "manageProjects") || role === "employee";
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

// Strict role isolation: each role may only access its own module prefix.
// Consulted by proxy.ts (optimistic redirect) and layout-level requireRole.
const ROUTE_ACCESS: Record<string, readonly Role[]> = {
  "/admin": ["admin"],
  "/manager": ["project_manager"],
  "/employee": ["employee"],
};

export function rolesAllowedForRoute(pathname: string): readonly Role[] | null {
  const prefix = Object.keys(ROUTE_ACCESS).find(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  return prefix ? ROUTE_ACCESS[prefix] : null;
}
