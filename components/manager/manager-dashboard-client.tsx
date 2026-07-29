"use client";

import { useState } from "react";
import { EmployeeScheduleView } from "./employee-schedule-view";
import { ProjectTasksView } from "./project-tasks-view";

type Tab = "schedules" | "project-tasks";

export function ManagerDashboardClient() {
  const [tab, setTab] = useState<Tab>("schedules");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setTab("schedules")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "schedules" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          Employee Schedules
        </button>
        <button
          type="button"
          onClick={() => setTab("project-tasks")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "project-tasks" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          Project Tasks
        </button>
      </div>

      {tab === "schedules" && <EmployeeScheduleView />}
      {tab === "project-tasks" && <ProjectTasksView />}
    </div>
  );
}
