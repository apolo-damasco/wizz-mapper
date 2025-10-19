import type { Flight } from "./data-parser";
import { addDays, addHours, startOfDay } from "date-fns";

export function countConnections(itinerary: Flight[]): number {
  return Math.max(0, itinerary.length - 1);
}

export function computeLayoverTotalMs(itinerary: Flight[]): number {
  if (!itinerary || itinerary.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < itinerary.length - 1; i++) {
    const prevArr = Date.parse(itinerary[i].arrival);
    const nextDep = Date.parse(itinerary[i + 1].departure);
    if (!Number.isNaN(prevArr) && !Number.isNaN(nextDep)) {
      total += Math.max(0, nextDep - prevArr);
    }
  }
  return total;
}

/**
 * Returns true if none of the segments overlap with the nightly window [02:00, 06:00) local time
 * after applying the same display offset (e.g. -2 hours).
 */
export function isItineraryDaytimeOnly(
  itinerary: Flight[],
  offsetHours = -2,
): boolean {
  // If overall itinerary duration exceeds 18 hours, it's not daytime-only
  if (itinerary && itinerary.length > 0) {
    const start = Date.parse(itinerary[0].departure);
    const end = Date.parse(itinerary[itinerary.length - 1].arrival);
    if (!Number.isNaN(start) && !Number.isNaN(end)) {
      const durationMs = end - start;
      const EIGHTEEN_HOURS_MS = 18 * 60 * 60 * 1000;
      if (durationMs > EIGHTEEN_HOURS_MS) return false;
    }
  }

  for (const seg of itinerary) {
    const dep = addHours(new Date(seg.departure), offsetHours);
    const arr = addHours(new Date(seg.arrival), offsetHours);

    if (overlapsNightWindow(dep, arr)) return false;
  }
  return true;
}

function overlapsNightWindow(start: Date, end: Date): boolean {
  if (!(start instanceof Date) || !(end instanceof Date)) return false;
  if (end <= start) return false;

  // Iterate day by day across the segment interval and check overlap with [02:00, 06:00)
  let day = startOfDay(start);
  const endDay = startOfDay(end);

  while (day <= endDay) {
    const windowStart = addHours(day, 2); // 02:00
    const windowEnd = addHours(day, 6); // 06:00

    // Overlap check: [start, end) intersects [windowStart, windowEnd)
    if (start < windowEnd && end > windowStart) {
      return true;
    }

    day = addDays(day, 1);
  }

  return false;
}
