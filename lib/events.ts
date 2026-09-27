import { format, parseISO, subWeeks } from "date-fns";
import { isValidDateString } from "@/lib/discharge";
import type {
  AppData,
  Event,
  Leave,
  LeaveEventType,
  PerformanceOvernight,
  RewardLeave,
} from "@/types";

type Usage =
  | { type: "REGULAR"; days: number }
  | { type: "REWARD"; id: string; days: number }
  | { type: "OTHER"; id: string; days: number };

export type EventMutationResult =
  | { data: AppData; error?: never }
  | { data?: never; error: string };

export interface SaveEventOptions {
  performanceOvernight?: PerformanceOvernight;
}

function failure(error: string): EventMutationResult {
  return { error };
}

function getLeaveType(event: Event, data: AppData): LeaveEventType | undefined {
  if (event.leaveType) return event.leaveType;
  if (event.rewardLeaveId) return "REWARD";
  if (event.leaveId) {
    return data.leaves.find((leave) => leave.id === event.leaveId)?.category === "REGULAR"
      ? "REGULAR"
      : "OTHER";
  }
  return undefined;
}

function getUsage(event: Event | undefined, data: AppData): Usage | undefined {
  if (
    !event ||
    event.type !== "LEAVE" ||
    event.status === "REJECTED" ||
    !event.leaveDays ||
    event.leaveDays <= 0
  ) {
    return undefined;
  }

  const type = getLeaveType(event, data);
  if (type === "REGULAR") return { type, days: event.leaveDays };
  if (type === "REWARD" && event.rewardLeaveId) {
    return { type, id: event.rewardLeaveId, days: event.leaveDays };
  }
  if (type === "OTHER" && event.leaveId) {
    return { type, id: event.leaveId, days: event.leaveDays };
  }
  return undefined;
}

function validateEvent(event: Event, data: AppData): string | undefined {
  if (!event.title.trim()) return "일정 제목을 입력해 주세요.";
  if (!isValidDateString(event.startDate) || !isValidDateString(event.endDate)) {
    return "시작일과 종료일을 올바르게 입력해 주세요.";
  }
  if (event.endDate < event.startDate) return "종료일은 시작일보다 빠를 수 없습니다.";
  if (event.startTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.startTime)) {
    return "시작 시간을 올바르게 입력해 주세요.";
  }

  if (event.type !== "LEAVE") return undefined;
  const leaveType = getLeaveType(event, data);
  if (!leaveType || !Number.isFinite(event.leaveDays) || (event.leaveDays ?? 0) <= 0) {
    return "휴가 종류와 0보다 큰 사용일수를 입력해 주세요.";
  }
  if (leaveType === "REWARD" && !data.rewardLeaves.some((leave) => leave.id === event.rewardLeaveId)) {
    return "연결할 포상휴가를 선택해 주세요.";
  }
  if (
    leaveType === "OTHER" &&
    !data.leaves.some((leave) => leave.id === event.leaveId && leave.category === "OTHER")
  ) {
    return "연결할 기타 휴가를 선택해 주세요.";
  }
  if (leaveType === "REGULAR" && (event.leaveId || event.rewardLeaveId)) {
    return "정기휴가에는 별도의 휴가 기록을 연결할 수 없습니다.";
  }
  if (leaveType === "REWARD" && event.leaveId) return "포상휴가 연결 정보가 올바르지 않습니다.";
  if (leaveType === "OTHER" && event.rewardLeaveId) return "기타 휴가 연결 정보가 올바르지 않습니다.";
  return undefined;
}

function releasePerformanceOvernight(
  data: AppData,
  event: Event,
): Pick<AppData, "performanceOvernights" | "settings"> {
  const linkedRecord = data.performanceOvernights.find(
    (record) => record.id === event.overnightId || record.eventId === event.id,
  );
  if (!linkedRecord) {
    return { performanceOvernights: data.performanceOvernights, settings: data.settings };
  }

  const performanceOvernights = data.performanceOvernights.map((record) =>
    record.id === linkedRecord.id ? { ...record, used: false, eventId: undefined } : record,
  );
  let performanceOvernightBaseDate = data.settings.performanceOvernightBaseDate;
  if (performanceOvernightBaseDate === linkedRecord.availableFrom) {
    const previousDate = format(
      subWeeks(parseISO(linkedRecord.availableFrom), linkedRecord.cycleWeeks),
      "yyyy-MM-dd",
    );
    const latestUsedDate = performanceOvernights
      .filter((record) => record.used && isValidDateString(record.availableFrom))
      .map((record) => record.availableFrom)
      .sort()
      .at(-1);
    performanceOvernightBaseDate =
      latestUsedDate && latestUsedDate > previousDate ? latestUsedDate : previousDate;
  }

  return {
    performanceOvernights,
    settings: { ...data.settings, performanceOvernightBaseDate },
  };
}

function applyEventChange(
  data: AppData,
  previousEvent: Event | undefined,
  nextEvent: Event | undefined,
  options: SaveEventOptions = {},
): EventMutationResult {
  const validationError = nextEvent ? validateEvent(nextEvent, data) : undefined;
  if (validationError) return failure(validationError);

  const previousUsage = getUsage(previousEvent, data);
  const nextUsage = getUsage(nextEvent, data);
  const regularLeaveUsedDays =
    data.regularLeaveUsedDays -
    (previousUsage?.type === "REGULAR" ? previousUsage.days : 0) +
    (nextUsage?.type === "REGULAR" ? nextUsage.days : 0);
  if (
    regularLeaveUsedDays < 0 ||
    regularLeaveUsedDays > data.settings.regularLeaveDays
  ) {
    return failure("정기휴가 사용일수가 잔여량을 초과합니다.");
  }

  const adjustedRewardLeaves: RewardLeave[] = data.rewardLeaves.map((leave) => {
    let usedDays = leave.usedDays;
    if (previousUsage?.type === "REWARD" && previousUsage.id === leave.id) {
      usedDays -= previousUsage.days;
    }
    if (nextUsage?.type === "REWARD" && nextUsage.id === leave.id) {
      usedDays += nextUsage.days;
    }
    return { ...leave, usedDays };
  });
  if (
    adjustedRewardLeaves.some(
      (leave) => leave.usedDays < 0 || leave.usedDays > leave.grantedDays,
    )
  ) {
    return failure("포상휴가 사용일수가 부여량을 초과합니다.");
  }

  const adjustedLeaves: Leave[] = data.leaves.map((leave) => {
    let usedDays = leave.usedDays;
    if (previousUsage?.type === "OTHER" && previousUsage.id === leave.id) {
      usedDays -= previousUsage.days;
    }
    if (nextUsage?.type === "OTHER" && nextUsage.id === leave.id) {
      usedDays += nextUsage.days;
    }
    return { ...leave, usedDays };
  });
  if (adjustedLeaves.some((leave) => leave.usedDays < 0 || leave.usedDays > leave.grantedDays)) {
    return failure("기타 휴가 사용일수가 부여량을 초과합니다.");
  }

  if (nextEvent?.overnightId) {
    if (nextEvent.type !== "OVERNIGHT") {
      return failure("성과제외박은 외박 일정에만 연결할 수 있습니다.");
    }
    const linkedRecord =
      options.performanceOvernight?.id === nextEvent.overnightId
        ? options.performanceOvernight
        : data.performanceOvernights.find((record) => record.id === nextEvent.overnightId);
    if (!linkedRecord) return failure("연결할 성과제외박을 찾을 수 없습니다.");
    if (linkedRecord.used && linkedRecord.eventId !== nextEvent.id) {
      return failure("이미 다른 일정에서 사용 중인 성과제외박입니다.");
    }
  }

  let nextData: AppData = {
    ...data,
    regularLeaveUsedDays,
    rewardLeaves: adjustedRewardLeaves,
    leaves: adjustedLeaves,
  };

  if (previousEvent?.overnightId && previousEvent.overnightId !== nextEvent?.overnightId) {
    const released = releasePerformanceOvernight(nextData, previousEvent);
    nextData = { ...nextData, ...released };
  }

  const newPerformanceOvernight = options.performanceOvernight;
  if (newPerformanceOvernight) {
    if (newPerformanceOvernight.eventId !== nextEvent?.id || !newPerformanceOvernight.used) {
      return failure("성과제외박 연결 정보가 올바르지 않습니다.");
    }
    if (nextData.performanceOvernights.some((record) => record.id === newPerformanceOvernight.id)) {
      return failure("이미 등록된 성과제외박입니다.");
    }
    nextData = {
      ...nextData,
      settings: {
        ...nextData.settings,
        performanceOvernightBaseDate: newPerformanceOvernight.availableFrom,
      },
      performanceOvernights: [...nextData.performanceOvernights, newPerformanceOvernight],
    };
  } else if (nextEvent?.overnightId) {
    nextData = {
      ...nextData,
      performanceOvernights: nextData.performanceOvernights.map((record) =>
        record.id === nextEvent.overnightId
          ? { ...record, used: true, eventId: nextEvent.id }
          : record,
      ),
    };
  }

  const events = nextEvent
    ? previousEvent
      ? nextData.events.map((event) => (event.id === nextEvent.id ? nextEvent : event))
      : [...nextData.events, nextEvent]
    : nextData.events.filter((event) => event.id !== previousEvent?.id);

  return { data: { ...nextData, events } };
}

export function saveEvent(
  data: AppData,
  event: Event,
  options: SaveEventOptions = {},
): EventMutationResult {
  const previousEvent = data.events.find((current) => current.id === event.id);
  const now = new Date().toISOString();
  const savedEvent = {
    ...event,
    title: event.title.trim(),
    proposer: event.proposer?.trim() || undefined,
    description: event.description?.trim() || undefined,
    updatedAt: now,
    createdAt: previousEvent?.createdAt ?? event.createdAt ?? now,
  };
  return applyEventChange(data, previousEvent, savedEvent, options);
}

export function deleteEvent(data: AppData, eventId: string): EventMutationResult {
  const event = data.events.find((current) => current.id === eventId);
  if (!event) return failure("삭제할 일정을 찾을 수 없습니다.");
  return applyEventChange(data, event, undefined);
}