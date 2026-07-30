"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type TeamTasksEmployee = {
  _id: string;
  name: string;
  email: string;
};

function userInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || "?";
}

export function TeamTasksEmployeeList({
  employees,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  isLoading,
}: {
  employees: TeamTasksEmployee[];
  selectedId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (employee: TeamTasksEmployee) => void;
  isLoading?: boolean;
}) {
  const query = search.trim().toLowerCase();
  const filtered = query
    ? employees.filter(
        (e) =>
          e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query),
      )
    : employees;

  return (
    <aside className="bg-card flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden border-r md:w-[280px] md:shrink-0">
      <div className="shrink-0 space-y-3 border-b p-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Employees</h2>
          <p className="text-muted-foreground text-xs">Select someone to manage their day</p>
        </div>
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name…"
          aria-label="Search employees"
          disabled={isLoading}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground px-3 py-6 text-center text-sm">
            {employees.length === 0 ? "No employees found." : "No matches for your search."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((employee) => {
              const active = employee._id === selectedId;
              return (
                <li key={employee._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(employee)}
                    className={cn(
                      "hover:bg-muted/60 flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                      active && "bg-primary/10 ring-primary/20 ring-1",
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    <Avatar size="sm">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                        {userInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{employee.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{employee.email}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
  