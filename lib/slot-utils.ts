import { TIME_SLOTS } from "@/lib/constants/office-hours";

export function getNextSlot(startTime: string): { start: string; end: string } | null {
  const index = TIME_SLOTS.findIndex((slot) => slot.start === startTime);
  if (index === -1 || index >= TIME_SLOTS.length - 1) return null;
  return TIME_SLOTS[index + 1];
}

/** First free slot after `currentStartTime` (skips occupied slots; lunch is already excluded from TIME_SLOTS). */
export function getNextFreeSlot(
  currentStartTime: string,
  occupiedStartTimes: string[],
): { start: string; end: string } | null {
  let slot = getNextSlot(currentStartTime);
  while (slot) {
    if (!occupiedStartTimes.includes(slot.start)) return slot;
    slot = getNextSlot(slot.start);
  }
  return null;
}
