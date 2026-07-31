"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatTime12h } from "@/lib/format";
import { cn } from "@/lib/utils";
import { planDurationAssign, type DurationAssignPlan } from "@/lib/slot-utils";

/** UI chips cover a full bookable day (lunch already excluded from TIME_SLOTS). */
export const DURATION_HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function getDurationAssignPlan(
  startTime: string | undefined,
  durationHours: number,
  occupiedStarts: Iterable<string> = [],
): DurationAssignPlan | null {
  if (!startTime) return null;
  return planDurationAssign(startTime, durationHours, occupiedStarts);
}

export function durationAssignButtonLabel(hours: number, canAssign: boolean): string {
  if (!canAssign) return "Resolve conflicts first";
  return hours === 1 ? "Assign 1 hour" : `Assign ${hours} hours`;
}

export function DurationHoursPicker({
  startTime,
  durationHours,
  onChange,
  occupiedStarts = [],
  disabled = false,
}: {
  startTime: string | undefined;
  durationHours: number;
  onChange: (hours: number) => void;
  occupiedStarts?: Iterable<string>;
  disabled?: boolean;
}) {
  const plan = getDurationAssignPlan(startTime, durationHours, occupiedStarts);
  const rangeEnd = plan?.planned.length
    ? plan.planned[plan.planned.length - 1]!.end
    : null;

  return (
    <div className="grid gap-2 rounded-lg border bg-muted/30 p-3">
      <div className="grid gap-1">
        <Label>Duration</Label>
        <p className="text-muted-foreground text-xs">
          Same title and description apply to each consecutive hour.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Duration in hours">
        {DURATION_HOUR_OPTIONS.map((hours) => (
          <Button
            key={hours}
            type="button"
            size="sm"
            variant={durationHours === hours ? "default" : "outline"}
            disabled={disabled}
            aria-pressed={durationHours === hours}
            onClick={() => onChange(hours)}
            className={cn(durationHours === hours && "pointer-events-none")}
          >
            {hours === 1 ? "1 hr" : `${hours} hrs`}
          </Button>
        ))}
      </div>

      {plan && startTime && rangeEnd ? (
        <p
          className={cn(
            "text-xs leading-relaxed",
            plan.canAssign ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {plan.canAssign ? (
            <>
              Will create{" "}
              <span className="font-medium text-foreground">
                {durationHours} task{durationHours > 1 ? "s" : ""}
              </span>
              : {formatTime12h(startTime)} – {formatTime12h(rangeEnd)}
              {durationHours > 1 ? " (consecutive slots)" : null}
            </>
          ) : plan.insufficientRemaining ? (
            <>
              Only {plan.planned.length} slot
              {plan.planned.length === 1 ? "" : "s"} remain from this start. Choose fewer hours or
              an earlier start.
            </>
          ) : (
            <>
              Conflict:{" "}
              {plan.conflicts
                .map((slot) => `${formatTime12h(slot.start)}–${formatTime12h(slot.end)}`)
                .join(", ")}{" "}
              already occupied. Choose fewer hours or another start.
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
