"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/use-manager";
import { Button } from "@/components/ui/button";
import {
  TeamTasksEmployeeList,
  type TeamTasksEmployee,
} from "@/components/tasks/team-tasks-employee-list";
import { ManagedEmployeeTasksPanel } from "@/components/tasks/managed-employee-tasks-panel";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { todayDateInputValue } from "@/lib/dates";

export function TeamTasksPageFallback() {
  return (
    <div className="flex h-[calc(100dvh-6.5rem)] max-h-[calc(100dvh-6.5rem)] overflow-hidden rounded-xl border">
      <div className="hidden w-[280px] space-y-3 border-r p-4 md:block">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}

function buildTeamTasksHref(
  pathname: string,
  searchParams: URLSearchParams,
  patch: { employee?: string | null; date?: string | null },
) {
  const next = new URLSearchParams(searchParams.toString());

  if ("employee" in patch) {
    if (patch.employee) next.set("employee", patch.employee);
    else next.delete("employee");
  }

  if ("date" in patch) {
    if (patch.date) next.set("date", patch.date);
    else next.delete("date");
  }

  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function resolveDateParam(raw: string | null): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return todayDateInputValue();
}

export function TeamTasksPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const employeeFromUrl = searchParams.get("employee");
  const selectedDate = resolveDateParam(searchParams.get("date"));

  const { data, isLoading, isError, error } = useEmployees();
  const employees = (data?.data ?? []) as TeamTasksEmployee[];

  const [search, setSearch] = useState("");
  /** Mobile: when an employee is selected, show detail pane full-width. */
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const selectedEmployee = useMemo(() => {
    if (!employeeFromUrl) return null;
    return employees.find((e) => e._id === employeeFromUrl) ?? null;
  }, [employees, employeeFromUrl]);

  const invalidEmployeeInUrl =
    !!employeeFromUrl && !isLoading && employees.length > 0 && !selectedEmployee;

  const clearedInvalidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!invalidEmployeeInUrl || !employeeFromUrl) return;
    if (clearedInvalidRef.current === employeeFromUrl) return;
    clearedInvalidRef.current = employeeFromUrl;
    toast.error("Employee not found.");
    router.replace(buildTeamTasksHref(pathname, searchParams, { employee: null }));
  }, [invalidEmployeeInUrl, employeeFromUrl, pathname, router, searchParams]);

  useEffect(() => {
    if (selectedEmployee) setMobileShowDetail(true);
  }, [selectedEmployee?._id]);

  const selectEmployee = useCallback(
    (employee: TeamTasksEmployee) => {
      router.replace(
        buildTeamTasksHref(pathname, searchParams, {
          employee: employee._id,
          date: selectedDate,
        }),
        { scroll: false },
      );
      setMobileShowDetail(true);
    },
    [pathname, router, searchParams, selectedDate],
  );

  const clearSelection = useCallback(() => {
    router.replace(
      buildTeamTasksHref(pathname, searchParams, { employee: null, date: selectedDate }),
      { scroll: false },
    );
    setMobileShowDetail(false);
  }, [pathname, router, searchParams, selectedDate]);

  return (
    <div className="border-border bg-background flex h-[calc(100dvh-6.5rem)] max-h-[calc(100dvh-6.5rem)] flex-col overflow-hidden rounded-xl border shadow-xs">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className={cn(
            "min-h-0 md:flex md:h-full md:w-auto",
            mobileShowDetail && selectedEmployee ? "hidden md:flex" : "flex flex-1 md:flex-none",
          )}
        >
          <TeamTasksEmployeeList
            employees={employees}
            selectedId={selectedEmployee?._id ?? null}
            search={search}
            onSearchChange={setSearch}
            onSelect={selectEmployee}
            isLoading={isLoading}
          />
        </div>

        <section
          className={cn(
            "bg-muted/20 min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
            mobileShowDetail && selectedEmployee ? "flex" : "hidden md:flex",
          )}
          aria-label="Employee tasks"
        >
          {isError ? (
            <div className="text-destructive flex flex-1 items-center justify-center p-8 text-center text-sm">
              {error instanceof Error ? error.message : "Failed to load employees."}
            </div>
          ) : selectedEmployee ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="bg-card flex items-center gap-2 border-b px-4 py-3 md:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="gap-1.5 px-2"
                >
                  <ArrowLeftIcon className="size-4" aria-hidden />
                  Employees
                </Button>
              </div>

              <ManagedEmployeeTasksPanel
                employee={selectedEmployee}
                selectedDate={selectedDate}
              />
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="bg-muted flex size-12 items-center justify-center rounded-full">
                <UsersIcon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="text-foreground text-base font-semibold">Select an employee</p>
                <p className="mt-1 max-w-xs text-sm">
                  Choose someone from the list to view and manage their daily tasks.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
