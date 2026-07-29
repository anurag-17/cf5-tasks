"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDaysIcon,
  UsersIcon,
  FolderKanbanIcon,
  ListTodoIcon,
  ClipboardListIcon,
  type LucideIcon,
} from "lucide-react";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/admin" || href === "/manager" || href === "/employee") {
    return false;
  }
  return pathname.startsWith(`${href}/`);
}

const NAV_ICONS: Record<string, LucideIcon> = {
  calendarDays: CalendarDaysIcon,
  users: UsersIcon,
  folderKanban: FolderKanbanIcon,
  listTodo: ListTodoIcon,
  clipboardList: ClipboardListIcon,
};

export function ModuleNavLink({
  href,
  label,
  iconKey,
  onNavigate,
}: {
  href: string;
  label: string;
  iconKey?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isNavActive(pathname, href);
  const Icon = iconKey ? NAV_ICONS[iconKey] : undefined;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={label}
        render={<Link href={href} onClick={onNavigate} />}
      >
        {Icon ? <Icon aria-hidden /> : null}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
