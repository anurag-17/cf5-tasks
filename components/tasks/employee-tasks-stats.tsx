import {
  ClipboardListIcon,
  CircleCheckIcon,
  ClockIcon,
  RefreshCwIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StatTone = "blue" | "green" | "amber" | "violet";

const TONE_STYLES: Record<StatTone, { card: string; iconWrap: string; icon: string }> = {
  blue: {
    card: "border-blue-200/80 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/30",
    iconWrap: "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-300",
  },
  green: {
    card: "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30",
    iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-300",
  },
  amber: {
    card: "border-amber-200/80 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30",
    iconWrap: "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300",
    icon: "text-amber-600 dark:text-amber-300",
  },
  violet: {
    card: "border-violet-200/80 bg-violet-50/80 dark:border-violet-900/50 dark:bg-violet-950/30",
    iconWrap: "bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300",
    icon: "text-violet-600 dark:text-violet-300",
  },
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: StatTone;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xs",
        styles.card,
      )}
    >
      <div
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", styles.iconWrap)}
        aria-hidden
      >
        <Icon className={cn("size-5", styles.icon)} />
      </div>
      <div className="min-w-0">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
        <p className="text-foreground text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export function EmployeeTasksStats({
  total,
  completed,
  pending,
  inProgress = 0,
}: {
  total: number;
  completed: number;
  pending: number;
  inProgress?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Total Tasks" value={total} icon={ClipboardListIcon} tone="blue" />
      <StatCard label="Completed" value={completed} icon={CircleCheckIcon} tone="green" />
      <StatCard label="Pending" value={pending} icon={ClockIcon} tone="amber" />
      <StatCard label="In Progress" value={inProgress} icon={RefreshCwIcon} tone="violet" />
    </div>
  );
}
