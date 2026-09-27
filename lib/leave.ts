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