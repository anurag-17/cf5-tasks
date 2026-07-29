/**
 * UTC-normalized date helpers. Task dates are stored as midnight UTC so
 * queries stay consistent regardless of server or browser timezone.
 */

/** Parse a YYYY-MM-DD calendar string to midnight UTC. */
export function parseDateParam(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return todayUtcDayStart();
  }
  return new Date(Date.UTC(year, month - 1, day));
}

/** Normalize any Date to midnight UTC (calendar day from UTC components). */
export function toUtcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Today's calendar date as midnight UTC. */
export function todayUtcDayStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Resolve an optional date query param or default to today (UTC). */
export function resolveDateParam(dateParam: string | null): Date {
  return dateParam ? parseDateParam(dateParam) : todayUtcDayStart();
}

/** Today as YYYY-MM-DD for date inputs (local calendar — matches browser date picker). */
export function todayDateInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
