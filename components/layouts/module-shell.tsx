"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModuleNavLink } from "@/components/layouts/module-nav-link";
import { APP_NAME } from "@/lib/constants/app";
import { ROLE_LABELS, type Role } from "@/lib/constants/roles";

type NavItem = { href: string; label: string };

export function ModuleShell({
  moduleLabel,
  navItems,
  user,
  children,
}: {
  moduleLabel: string;
  navItems: NavItem[];
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="bg-card sticky top-0 z-40 border-b">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex shrink-0 items-center gap-2">
              <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
                T
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">{APP_NAME}</p>
                <p className="text-muted-foreground truncate text-xs">{moduleLabel}</p>
              </div>
            </div>
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <ModuleNavLink key={item.href} href={item.href} label={item.label} />
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium">{user.name ?? user.email}</p>
              <p className="text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 sm:hidden">
          {navItems.map((item) => (
            <ModuleNavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
