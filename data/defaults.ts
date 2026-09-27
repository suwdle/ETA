import type { AppData, UserSettings } from "@/types";

export const DEFAULT_SETTINGS: UserSettings = {
  serviceStartDate: "",
  dischargeDate: "",
  regularLeaveDays: 28,
  rewardLeaveLimit: 18,
  performanceOvernightCycleWeeks: 6,
  performanceOvernightNights: 2,
  performanceOvernightDays: 3,
  performanceOvernightBaseDate: "",
};

export function createDefaultAppData(): AppData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    regularLeaveUsedDays: 0,
    leaves: [],
    rewardLeaves: [],
    performanceOvernights: [],
    events: [],
  };
}