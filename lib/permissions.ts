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
