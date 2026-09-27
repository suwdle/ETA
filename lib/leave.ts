import { addWeeks, format, parseISO } from "date-fns";
import { isValidDateString } from "@/lib/discharge";
import type { RewardLeave } from "@/types";

export function calculateRemainingLeave(
  grantedDays: number,
  usedDays: number,
): number {
  return Math.max(0, grantedDays - usedDays);
}

export function calculateRewardLeaveRemaining(
  rewardLeaves: readonly Pick<RewardLeave, "grantedDays" | "usedDays">[],
): number {
  return rewardLeaves.reduce(
    (total, leave) =>
      total + calculateRemainingLeave(leave.grantedDays, leave.usedDays),
    0,
  );
}

export function calculateNextPerformanceOvernight(
  baseDate: string,
  cycleWeeks: number,
): string | null {
  if (
    !isValidDateString(baseDate) ||
    !Number.isInteger(cycleWeeks) ||
    cycleWeeks <= 0
  ) {
    return null;
  }

  return format(addWeeks(parseISO(baseDate), cycleWeeks), "yyyy-MM-dd");
}