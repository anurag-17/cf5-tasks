import { Suspense } from "react";
import {
  TeamTasksPageClient,
  TeamTasksPageFallback,
} from "@/components/tasks/team-tasks-page-client";

export default function ManagerTeamTasksPage() {
  return (
    <Suspense fallback={<TeamTasksPageFallback />}>
      <TeamTasksPageClient />
    </Suspense>
  );
}
