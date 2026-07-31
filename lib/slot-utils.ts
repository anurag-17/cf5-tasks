import { TIME_SLOTS } from "@/lib/constants/office-hours";

export type TimeSlot = { start: string; end: string };

/** Max bookable hours in a day (lunch already excluded from TIME_SLOTS). */
export const MAX_DURATION_HOURS = TIME_SLOTS.length;

export function getNextSlot(startTime: string): TimeSlot | null {
  const index = TIME_SLOTS.findIndex((slot) => slot.start === startTime);
  if (index === -1 || index >= TIME_SLOTS.length - 1) return null;
  return TIME_SLOTS[index + 1];
}

/** First free slot after `currentStartTime` (skips occupied slots; lunch is already excluded from TIME_SLOTS). */
export function getNextFreeSlot(
  currentStartTime: string,
  occupiedStartTimes: string[],
): TimeSlot | null {
  let slot = getNextSlot(currentStartTime);
  while (slot) {
    if (!occupiedStartTimes.includes(slot.start)) return slot;
    slot = getNextSlot(slot.start);
  }
  return null;
}

/** Earliest bookable slot of the day that is not occupied. */
export function getFirstFreeSlot(
  occupiedStartTimes: Iterable<string>,
): TimeSlot | null {
  const occupied = occupiedStartTimes instanceof Set ? occupiedStartTimes : new Set(occupiedStartTimes);
  return TIME_SLOTS.find((slot) => !occupied.has(slot.start)) ?? null;
}

/**
 * Consecutive bookable slots starting at `startTime` for `durationHours`.
 * Lunch is never included (not in TIME_SLOTS). Returns fewer slots if the day ends early.
 * Invalid start or duration ≤ 0 → [].
 */
export function getConsecutiveSlots(startTime: string, durationHours: number): TimeSlot[] {
  if (!Number.isInteger(durationHours) || durationHours < 1) return [];

  const startIndex = TIME_SLOTS.findIndex((slot) => slot.start === startTime);
  if (startIndex < 0) return [];

  const count = Math.min(durationHours, TIME_SLOTS.length - startIndex);
  return TIME_SLOTS.slice(startIndex, startIndex + count);
}

/** Planned slots whose start is already occupied. */
export function getSlotConflicts(
  plannedSlots: ReadonlyArray<TimeSlot>,
  occupiedStartTimes: Iterable<string>,
): TimeSlot[] {
  const occupied =
    occupiedStartTimes instanceof Set ? occupiedStartTimes : new Set(occupiedStartTimes);
  return plannedSlots.filter((slot) => occupied.has(slot.start));
}

export type DurationAssignPlan = {
  planned: TimeSlot[];
  conflicts: TimeSlot[];
  /** True when fewer bookable slots remain from start than requested hours. */
  insufficientRemaining: boolean;
  /** True when planned length matches duration and there are no conflicts. */
  canAssign: boolean;
};

/**
 * Plan a multi-hour assign: expand slots, detect end-of-day shortfall and occupied conflicts.
 * Does not skip occupied slots — conflicts must be resolved by the caller (fail-all policy).
 */
export function planDurationAssign(
  startTime: string,
  durationHours: number,
  occupiedStartTimes: Iterable<string>,
): DurationAssignPlan {
  const planned = getConsecutiveSlots(startTime, durationHours);
  const insufficientRemaining = planned.length < durationHours;
  const conflicts = getSlotConflicts(planned, occupiedStartTimes);
  const canAssign = !insufficientRemaining && conflicts.length === 0 && planned.length > 0;

  return { planned, conflicts, insufficientRemaining, canAssign };
}
