export interface UserSettings {
  serviceStartDate?: string;
  dischargeDate: string;
  regularLeaveDays: number;
  rewardLeaveLimit: number;
  performanceOvernightCycleWeeks: number;
  performanceOvernightNights: number;
  performanceOvernightDays: number;
  performanceOvernightBaseDate?: string;
}

export interface Leave {
  id: string;
  category: "REGULAR" | "OTHER";
  name: string;
  grantedDays: number;
  usedDays: number;
  grantedAt: string;
  memo?: string;
}

export interface RewardLeave {
  id: string;
  name: string;
  grantedDays: number;
  usedDays: number;
  grantedAt: string;
  memo?: string;
}

export interface PerformanceOvernight {
  id: string;
  availableFrom: string;
  cycleWeeks: number;
  durationNights: number;
  durationDays: number;
  used: boolean;
  eventId?: string;
  memo?: string;
}

export type EventType =
  | "GENERAL"
  | "LEAVE"
  | "OUTING"
  | "OVERNIGHT"
  | "PROPOSAL";

export type EventStatus = "PROPOSED" | "REJECTED" | "CONFIRMED" | "COMPLETED";

export interface Event {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  leaveId?: string;
  rewardLeaveId?: string;
  overnightId?: string;
  proposer?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  settings: UserSettings;
  leaves: Leave[];
  rewardLeaves: RewardLeave[];
  performanceOvernights: PerformanceOvernight[];
  events: Event[];
}