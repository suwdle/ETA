import {
  addWeeks,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
} from "date-fns";
import { isValidDateString } from "@/lib/discharge";

export function calculatePerformanceOvernightDates(
  baseDate: string,
  cycleWeeks: number,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  if (
    !isValidDateString(baseDate) ||
    !isValidDateString(rangeStart) ||
    !isValidDateString(rangeEnd) ||
    !Number.isInteger(cycleWeeks) ||
    cycleWeeks <= 0
  ) {
    return [];
  }

  const firstDate = addWeeks(parseISO(baseDate), cycleWeeks);
  const startDate = parseISO(rangeStart);
  const endDate = parseISO(rangeEnd);
  if (!isValid(firstDate) || isAfter(startDate, endDate)) return [];

  const daysUntilRange = Math.max(0, differenceInCalendarDays(startDate, firstDate));
  const skippedCycles = Math.ceil(daysUntilRange / (cycleWeeks * 7));
  let occurrence = addWeeks(firstDate, skippedCycles * cycleWeeks);
  const dates: string[] = [];

  while (isValid(occurrence) && !isAfter(occurrence, endDate)) {
    if (!isBefore(occurrence, startDate)) {
      dates.push(format(occurrence, "yyyy-MM-dd"));
    }
    const nextOccurrence = addWeeks(occurrence, cycleWeeks);
    if (!isAfter(nextOccurrence, occurrence)) break;
    occurrence = nextOccurrence;
  }

  return dates;
}