import { ROLES, type Role } from "@/lib/constants/roles";

type Permission =
  | "manageUsers"
  | "manageDepartments"
  | "manageProjects"
  | "assignTasks"
  | "approveTasks"
  | "viewAllTasks";

const ROLE_PERMISSIONS = {
  admin: {
    manageUsers: true,
    manageDepartments: true,
    manageProjects: true,
    assignTasks: true,
    approveTasks: true,
    viewAllTasks: true,
  },
  project_manager: {
    manageUsers: false,
    manageDepartments: false,
    manageProjects: true,
    assignTasks: true,
    approveTasks: true,
    viewAllTasks: true,
  },
  team_lead: {
    manageUsers: false,
    manageDepartments: false,
    manageProjects: false,
    assignTasks: true,
    approveTasks: true,
    viewAllTasks: true,
  },
  employee: {
    manageUsers: false,
    manageDepartments: false,
    manageProjects: false,
    assignTasks: false,
    approveTasks: false,
    viewAllTasks: false,
  },
} as const satisfies Record<Role, Record<Permission, boolean>>;

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function isManagerial(role: Role): boolean {
  return role === "admin" || role === "project_manager" || role === "team_lead";
}

export function isValidRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
