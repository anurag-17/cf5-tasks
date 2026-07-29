import { format, isToday as dateFnsIsToday } from "date-fns";

/** e.g. "Tue, 29 Jul 2026" */
export function formatDate(date: Date | string, pattern = "EEE, d MMM yyyy"): string {
  return format(new Date(date), pattern);
}

/** "14:00" -> "2:00 PM". Input must be a valid "HH:mm" 24-hour string. */
export function formatTime12h(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${minutesStr.padStart(2, "0")} ${period}`;
}

export function isToday(date: Date | string): boolean {
  return dateFnsIsToday(new Date(date));
}
