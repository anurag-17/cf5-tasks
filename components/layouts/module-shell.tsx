"use client";

import { LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModuleNavLink } from "@/components/layouts/module-nav-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { APP_NAME } from "@/lib/constants/app";
import { ROLE_LABELS, type Role } from "@/lib/constants/roles";
import { roleHomePath } from "@/lib/permissions";

export type ModuleNavItem = {
  href: string;
  label: string;
  iconKey?: string;
};

function userInitials(name?: string | null, email?: string | null) {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function ModuleShell({
  moduleLabel,
  navItems,
  user,
  children,
  defaultSidebarOpen = true,
}: {
  moduleLabel: string;
  navItems: ModuleNavItem[];
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
  defaultSidebarOpen?: boolean;
}) {
  const displayName = user.name ?? user.email ?? "User";
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const homePath = roleHomePath(user.role);
    const inOwnModule = pathname === homePath || pathname.startsWith(`${homePath}/`);

    if (!inOwnModule) {
      router.replace(homePath);
    }
  }, [pathname, router, user.role]);

  const currentScreenLabel =
    navItems.find((item) => item.href === pathname)?.label ??
    navItems.find((item) => pathname.startsWith(`${item.href}/`))?.label ??
    moduleLabel;

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip={APP_NAME}>
                <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                  C
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{APP_NAME}</span>
                  <span className="text-sidebar-foreground/60 truncate text-xs">{moduleLabel}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <ModuleNavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    iconKey={item.iconKey}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip={displayName}>
                <Avatar size="sm">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-semibold">
                    {userInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-sidebar-foreground/60 truncate text-xs">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign out"
                className="cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOutIcon aria-hidden />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="bg-card/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <h1 className="truncate text-sm font-semibold">{currentScreenLabel}</h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Avatar size="sm">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                {userInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[10rem] truncate text-sm font-medium">
              {displayName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              className="cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOutIcon className="size-4" aria-hidden />
            </Button>
          </div>
        </header>

        <div className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col px-4 py-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
