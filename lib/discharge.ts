import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";

export function isValidDateString(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

  const date = parseISO(dateString);
  return isValid(date) && format(date, "yyyy-MM-dd") === dateString;
}

export function calculateDDay(dischargeDate: string): number {
  if (!isValidDateString(dischargeDate)) {
    throw new Error("전역일은 올바른 YYYY-MM-DD 날짜여야 합니다.");
  }

  return differenceInCalendarDays(parseISO(dischargeDate), new Date());
}