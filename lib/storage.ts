import { createDefaultAppData, DEFAULT_SETTINGS } from "@/data/defaults";
import type {
  AppData,
  Event,
  EventStatus,
  EventType,
  Leave,
  PerformanceOvernight,
  RewardLeave,
  UserSettings,
} from "@/types";

const STORAGE_KEY = "airplanner-data";

type JsonObject = Record<string, unknown>;
type Validator<T> = (value: unknown) => value is T;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return isNonNegativeNumber(value) ? value : fallback;
}

function mergeSettings(value: unknown): UserSettings {
  const settings = isObject(value) ? value : {};

  return {
    serviceStartDate: readString(
      settings.serviceStartDate,
      DEFAULT_SETTINGS.serviceStartDate ?? "",
    ),
    dischargeDate: readString(settings.dischargeDate, DEFAULT_SETTINGS.dischargeDate),
    regularLeaveDays: readNumber(
      settings.regularLeaveDays,
      DEFAULT_SETTINGS.regularLeaveDays,
    ),
    rewardLeaveLimit: readNumber(
      settings.rewardLeaveLimit,
      DEFAULT_SETTINGS.rewardLeaveLimit,
    ),
    performanceOvernightCycleWeeks: readNumber(
      settings.performanceOvernightCycleWeeks,
      DEFAULT_SETTINGS.performanceOvernightCycleWeeks,
    ),
    performanceOvernightNights: readNumber(
      settings.performanceOvernightNights,
      DEFAULT_SETTINGS.performanceOvernightNights,
    ),
    performanceOvernightDays: readNumber(
      settings.performanceOvernightDays,
      DEFAULT_SETTINGS.performanceOvernightDays,
    ),
    performanceOvernightBaseDate: readString(
      settings.performanceOvernightBaseDate,
      DEFAULT_SETTINGS.performanceOvernightBaseDate ?? "",
    ),
  };
}

function isLeave(value: unknown): value is Leave {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    (value.category === "REGULAR" || value.category === "OTHER") &&
    typeof value.name === "string" &&
    isNonNegativeNumber(value.grantedDays) &&
    isNonNegativeNumber(value.usedDays) &&
    typeof value.grantedAt === "string" &&
    isOptionalString(value.memo)
  );
}

function isRewardLeave(value: unknown): value is RewardLeave {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isNonNegativeNumber(value.grantedDays) &&
    isNonNegativeNumber(value.usedDays) &&
    typeof value.grantedAt === "string" &&
    isOptionalString(value.memo)
  );
}

function isPerformanceOvernight(value: unknown): value is PerformanceOvernight {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.availableFrom === "string" &&
    isNonNegativeNumber(value.cycleWeeks) &&
    isNonNegativeNumber(value.durationNights) &&
    isNonNegativeNumber(value.durationDays) &&
    typeof value.used === "boolean" &&
    isOptionalString(value.eventId) &&
    isOptionalString(value.memo)
  );
}

function isEventType(value: unknown): value is EventType {
  return (
    value === "GENERAL" ||
    value === "LEAVE" ||
    value === "OUTING" ||
    value === "OVERNIGHT" ||
    value === "PROPOSAL"
  );
}

function isEventStatus(value: unknown): value is EventStatus {
  return (
    value === "PROPOSED" ||
    value === "REJECTED" ||
    value === "CONFIRMED" ||
    value === "COMPLETED"
  );
}

function isEvent(value: unknown): value is Event {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isEventType(value.type) &&
    isEventStatus(value.status) &&
    typeof value.startDate === "string" &&
    typeof value.endDate === "string" &&
    isOptionalString(value.leaveId) &&
    isOptionalString(value.rewardLeaveId) &&
    isOptionalString(value.overnightId) &&
    isOptionalString(value.proposer) &&
    isOptionalString(value.description) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function readArray<T>(value: unknown, field: string, validator: Validator<T>): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every(validator)) {
    throw new Error(`백업 데이터의 ${field} 항목이 올바르지 않습니다.`);
  }
  return value;
}

function normalizeAppData(value: unknown): AppData {
  if (!isObject(value)) {
    throw new Error("올바른 AirPlanner 데이터 형식이 아닙니다.");
  }

  return {
    settings: mergeSettings(value.settings),
    leaves: readArray(value.leaves, "휴가", isLeave),
    rewardLeaves: readArray(value.rewardLeaves, "포상휴가", isRewardLeave),
    performanceOvernights: readArray(
      value.performanceOvernights,
      "성과제외박",
      isPerformanceOvernight,
    ),
    events: readArray(value.events, "일정", isEvent),
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") return createDefaultAppData();

  try {
    const storedData = window.localStorage.getItem(STORAGE_KEY);
    if (storedData === null) {
      const defaultData = createDefaultAppData();
      saveAppData(defaultData);
      return defaultData;
    }

    const appData = normalizeAppData(JSON.parse(storedData) as unknown);
    saveAppData(appData);
    return appData;
  } catch {
    return createDefaultAppData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAppData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function exportAppData(): string {
  return JSON.stringify(loadAppData(), null, 2);
}

export function importAppData(json: string): AppData {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw new Error("올바른 JSON 백업 파일이 아닙니다.");
  }

  const appData = normalizeAppData(parsed);
  saveAppData(appData);
  return appData;
}