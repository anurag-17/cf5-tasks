"use client";

import { useState } from "react";
import { EmployeeScheduleView } from "./employee-schedule-view";
import { ProjectTasksView } from "./project-tasks-view";

type Tab = "schedules" | "project-tasks";

const TABS: { id: Tab; label: string }[] = [
  { id: "schedules", label: "Employee Schedules" },
  { id: "project-tasks", label: "Project Tasks" },
];

export function ManagerDashboardClient() {
  const [tab, setTab] = useState<Tab>("schedules");

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Task management views"
        className="flex gap-1 rounded-lg border p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "schedules" && <EmployeeScheduleView />}
        {tab === "project-tasks" && <ProjectTasksView />}
      </div>
    </div>
  );
}
