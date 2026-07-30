// "HH:mm" 24-hour strings — kept as strings (not Date) since they represent a
// daily recurring schedule, not a specific point in time.
export const OFFICE_START_TIME = "09:30";
export const OFFICE_END_TIME = "19:00";
export const LUNCH_START_TIME = "13:30";
export const LUNCH_END_TIME = "14:00";

// The 9 fixed hourly slots tasks can be logged against (requirement.txt
// "Time Slots"). Lunch (13:30–14:00) is intentionally excluded — it is not a
// bookable slot. Every valid `startTime`/`endTime` on a Task must come from
// these tuples, which is what keeps "tasks can only be added during office
// working hours" a schema-level guarantee instead of just a UI rule.
export const TASK_START_TIMES = [
  "09:30",
  "10:30",
  "11:30",
  "12:30",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
] as const;

export const TASK_END_TIMES = [
  "10:30",
  "11:30",
  "12:30",
  "13:30",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

export const TIME_SLOTS = TASK_START_TIMES.map((start, i) => ({
  start,
  end: TASK_END_TIMES[i],
}));

/** Next bookable hourly slot after `startTime`, or null at end of day. */
export function getNextTimeSlot(startTime: string): { start: string; end: string } | null {
  const index = TIME_SLOTS.findIndex((slot) => slot.start === startTime);
  if (index < 0 || index >= TIME_SLOTS.length - 1) return null;
  return TIME_SLOTS[index + 1];
}

/** Next slot only if it is not already occupied (lunch is already outside TIME_SLOTS). */
export function getNextFreeSlot(
  startTime: string,
  occupiedStarts: Iterable<string>,
): { start: string; end: string } | null {
  const next = getNextTimeSlot(startTime);
  if (!next) return null;
  const occupied = occupiedStarts instanceof Set ? occupiedStarts : new Set(occupiedStarts);
  if (occupied.has(next.start)) return null;
  return next;
}
