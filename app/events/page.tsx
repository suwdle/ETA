"use client";

import { useState, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Clock3, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { deleteEvent, saveEvent } from "@/lib/events";
import { calculateNextPerformanceOvernight } from "@/lib/leave";
import { isValidDateString } from "@/lib/discharge";
import type { Event, EventStatus, EventType, LeaveEventType, PerformanceOvernight } from "@/types";

type EventDraft = {
  title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  startTime: string;
  status: EventStatus;
  proposer: string;
  description: string;
  leaveType: LeaveEventType;
  leaveDays: string;
  leaveId: string;
  rewardLeaveId: string;
  usePerformanceOvernight: boolean;
};

const inputClassName =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

const eventTypeOptions: { value: EventType; label: string }[] = [
  { value: "GENERAL", label: "일반 일정" },
  { value: "LEAVE", label: "휴가" },
  { value: "OUTING", label: "외출" },
  { value: "OVERNIGHT", label: "외박" },
  { value: "PROPOSAL", label: "일정 제안" },
];

const eventStatusOptions: { value: EventStatus; label: string }[] = [
  { value: "PROPOSED", label: "제안" },
  { value: "REJECTED", label: "거절" },
  { value: "CONFIRMED", label: "확정" },
  { value: "COMPLETED", label: "완료" },
];

function localDateString(): string {
  const today = new Date();
  return format(today, "yyyy-MM-dd");
}

function createEmptyDraft(): EventDraft {
  const today = localDateString();
  return {
    title: "",
    type: "GENERAL",
    startDate: today,
    endDate: today,
    startTime: "",
    status: "CONFIRMED",
    proposer: "",
    description: "",
    leaveType: "REGULAR",
    leaveDays: "",
    leaveId: "",
    rewardLeaveId: "",
    usePerformanceOvernight: false,
  };
}

function getEventTypeLabel(type: EventType): string {
  return eventTypeOptions.find((option) => option.value === type)?.label ?? "일정";
}

function getEventStatusLabel(status: EventStatus): string {
  return eventStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getLeaveConnectionLabel(event: Event, data: ReturnType<typeof useAppData>["data"]): string | undefined {
  const leaveType = event.leaveType ?? (event.rewardLeaveId ? "REWARD" : event.leaveId ? "OTHER" : undefined);
  if (leaveType === "REGULAR") return "정기휴가";
  if (leaveType === "REWARD") {
    const reward = data.rewardLeaves.find((leave) => leave.id === event.rewardLeaveId);
    return reward ? `포상휴가 · ${reward.name}` : "포상휴가";
  }
  if (leaveType === "OTHER") {
    const leave = data.leaves.find((item) => item.id === event.leaveId);
    return leave ? `기타 휴가 · ${leave.name}` : "기타 휴가";
  }
  return undefined;
}

function formatEventDate(dateString: string): string {
  return isValidDateString(dateString)
    ? format(parseISO(dateString), "yyyy.MM.dd")
    : dateString;
}

function draftFromEvent(event: Event): EventDraft {
  return {
    title: event.title,
    type: event.type,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: event.startTime ?? "",
    status: event.status,
    proposer: event.proposer ?? "",
    description: event.description ?? "",
    leaveType: event.leaveType ?? (event.rewardLeaveId ? "REWARD" : event.leaveId ? "OTHER" : "REGULAR"),
    leaveDays: event.leaveDays === undefined ? "" : String(event.leaveDays),
    leaveId: event.leaveId ?? "",
    rewardLeaveId: event.rewardLeaveId ?? "",
    usePerformanceOvernight: Boolean(event.overnightId),
  };
}

export default function EventsPage() {
  const { data, setData, isReady } = useAppData();
  const [draft, setDraft] = useState<EventDraft>(createEmptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const nextPerformanceDate = calculateNextPerformanceOvernight(
    data.settings.performanceOvernightBaseDate ?? "",
    data.settings.performanceOvernightCycleWeeks,
  );
  const availableOtherLeaves = data.leaves.filter((leave) => leave.category === "OTHER");
  const sortedEvents = [...data.events].sort((first, second) =>
    first.startDate.localeCompare(second.startDate) ||
    (first.startTime ?? "").localeCompare(second.startTime ?? ""),
  );

  function closeForm() {
    setDraft(createEmptyDraft());
    setEditingId(null);
    setFormError("");
    setIsFormOpen(false);
  }

  function openNewForm() {
    closeForm();
    setIsFormOpen(true);
  }

  function openEditForm(event: Event) {
    setDraft(draftFromEvent(event));
    setEditingId(event.id);
    setFormError("");
    setIsFormOpen(true);
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const currentEvent = editingId
      ? data.events.find((event) => event.id === editingId)
      : undefined;
    const eventId = editingId ?? crypto.randomUUID();
    const performanceDate = draft.usePerformanceOvernight
      ? nextPerformanceDate ?? draft.startDate
      : null;

    const overnightId = draft.type === "OVERNIGHT" && draft.usePerformanceOvernight
      ? currentEvent?.overnightId ?? crypto.randomUUID()
      : undefined;
    const now = new Date().toISOString();
    const event: Event = {
      id: eventId,
      title: draft.title.trim(),
      type: draft.type,
      status: draft.status,
      startDate: draft.startDate,
      endDate: draft.endDate,
      startTime: draft.startTime || undefined,
      leaveType: draft.type === "LEAVE" ? draft.leaveType : undefined,
      leaveDays: draft.type === "LEAVE" ? Number(draft.leaveDays) : undefined,
      leaveId: draft.type === "LEAVE" && draft.leaveType === "OTHER" ? draft.leaveId : undefined,
      rewardLeaveId: draft.type === "LEAVE" && draft.leaveType === "REWARD"
        ? draft.rewardLeaveId
        : undefined,
      overnightId,
      proposer: draft.proposer,
      description: draft.description,
      createdAt: currentEvent?.createdAt ?? now,
      updatedAt: now,
    };

    let performanceOvernight: PerformanceOvernight | undefined;
    if (overnightId && performanceDate && !currentEvent?.overnightId) {
      performanceOvernight = {
        id: overnightId,
        availableFrom: performanceDate,
        cycleWeeks: data.settings.performanceOvernightCycleWeeks,
        durationNights: data.settings.performanceOvernightNights,
        durationDays: data.settings.performanceOvernightDays,
        used: true,
        eventId,
      };
    }

    const result = saveEvent(data, event, { performanceOvernight });
    if (!result.data) {
      setFormError(result.error);
      return;
    }
    setData(result.data);
    closeForm();
  }

  function confirmDelete() {
    if (!deleteId) return;
    const result = deleteEvent(data, deleteId);
    if (!result.data) {
      setDeleteError(result.error);
      return;
    }
    setData(result.data);
    setDeleteId(null);
    setDeleteError("");
  }

  return (
    <section aria-labelledby="events-title" className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-primary">EVENTS</p>
            <h1 id="events-title" className="mt-1 text-2xl font-semibold">일정</h1>
            <p className="mt-1 text-sm text-muted-foreground">일반 일정, 휴가, 외박과 제안</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openNewForm}
          disabled={!isReady}
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Plus aria-hidden="true" className="size-4" /> 추가
        </button>
      </header>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 border-y border-border py-5">
          <h2 className="font-semibold">{editingId ? "일정 수정" : "일정 추가"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium sm:col-span-2">
              제목
              <input
                required
                maxLength={100}
                value={draft.title}
                disabled={!isReady}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                className={inputClassName}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              종류
              <select
                value={draft.type}
                disabled={!isReady}
                onChange={(event) => {
                  const type = event.target.value as EventType;
                  setDraft({
                    ...draft,
                    type,
                    status: type === "PROPOSAL" && draft.status === "CONFIRMED" ? "PROPOSED" : draft.status,
                    usePerformanceOvernight: type === "OVERNIGHT" && draft.usePerformanceOvernight,
                  });
                }}
                className={inputClassName}
              >
                {eventTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              상태
              <select
                value={draft.status}
                disabled={!isReady}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as EventStatus })}
                className={inputClassName}
              >
                {eventStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              시작일
              <input
                required
                type="date"
                value={draft.startDate}
                disabled={!isReady}
                onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
                className={inputClassName}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              종료일
              <input
                required
                type="date"
                min={draft.startDate}
                value={draft.endDate}
                disabled={!isReady}
                onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
                className={inputClassName}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              시작 시간 <span className="font-normal text-muted-foreground">(선택)</span>
              <input
                type="time"
                value={draft.startTime}
                disabled={!isReady}
                onChange={(event) => setDraft({ ...draft, startTime: event.target.value })}
                className={inputClassName}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              제안자 <span className="font-normal text-muted-foreground">(선택)</span>
              <input
                maxLength={60}
                value={draft.proposer}
                disabled={!isReady}
                onChange={(event) => setDraft({ ...draft, proposer: event.target.value })}
                className={inputClassName}
              />
            </label>
          </div>

          {draft.type === "LEAVE" && (
            <fieldset className="space-y-4 rounded-md bg-muted/50 p-4">
              <legend className="px-1 text-sm font-semibold">휴가 사용 연결</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">
                  휴가 종류
                  <select
                    value={draft.leaveType}
                    disabled={!isReady}
                    onChange={(event) => setDraft({
                      ...draft,
                      leaveType: event.target.value as LeaveEventType,
                      leaveId: "",
                      rewardLeaveId: "",
                    })}
                    className={inputClassName}
                  >
                    <option value="REGULAR">정기휴가</option>
                    <option value="REWARD">포상휴가</option>
                    <option value="OTHER">기타 휴가</option>
                  </select>
                </label>
                {draft.leaveType === "REWARD" && (
                  <label className="space-y-2 text-sm font-medium">
                    연결할 포상휴가
                    <select
                      required
                      value={draft.rewardLeaveId}
                      disabled={!isReady}
                      onChange={(event) => setDraft({ ...draft, rewardLeaveId: event.target.value })}
                      className={inputClassName}
                    >
                      <option value="">포상 선택</option>
                      {data.rewardLeaves.map((leave) => (
                        <option key={leave.id} value={leave.id}>
                          {leave.name} · {leave.grantedDays - leave.usedDays}일 남음
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {draft.leaveType === "OTHER" && (
                  <label className="space-y-2 text-sm font-medium">
                    연결할 기타 휴가
                    <select
                      required
                      value={draft.leaveId}
                      disabled={!isReady}
                      onChange={(event) => setDraft({ ...draft, leaveId: event.target.value })}
                      className={inputClassName}
                    >
                      <option value="">휴가 선택</option>
                      {availableOtherLeaves.map((leave) => (
                        <option key={leave.id} value={leave.id}>
                          {leave.name} · {leave.grantedDays - leave.usedDays}일 남음
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="space-y-2 text-sm font-medium">
                  사용일수
                  <input
                    required
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={draft.leaveDays}
                    disabled={!isReady}
                    onChange={(event) => setDraft({ ...draft, leaveDays: event.target.value })}
                    className={inputClassName}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {draft.type === "OVERNIGHT" && (
            <fieldset className="space-y-3 rounded-md bg-muted/50 p-4">
              <legend className="px-1 text-sm font-semibold">외박 연결</legend>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={draft.usePerformanceOvernight}
                  disabled={!isReady}
                  onChange={(event) => setDraft({ ...draft, usePerformanceOvernight: event.target.checked })}
                  className="size-4 accent-primary"
                />
                성과제외박 사용 처리
              </label>
              {draft.usePerformanceOvernight && (
                <p className="text-xs text-muted-foreground">
                  다음 가능일 {nextPerformanceDate ? format(parseISO(nextPerformanceDate), "yyyy.MM.dd") : "연결된 성과제외박"}
                  {nextPerformanceDate ? ` · ${data.settings.performanceOvernightNights}박 ${data.settings.performanceOvernightDays}일` : ""}
                </p>
              )}
            </fieldset>
          )}

          <label className="block space-y-2 text-sm font-medium">
            설명 <span className="font-normal text-muted-foreground">(선택)</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={draft.description}
              disabled={!isReady}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          </label>

          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!isReady}
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {editingId ? "수정 저장" : "일정 저장"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-medium hover:bg-muted"
            >
              <X aria-hidden="true" className="size-4" /> 취소
            </button>
          </div>
        </form>
      )}

      {!isReady ? (
        <p className="py-8 text-center text-sm text-muted-foreground">일정을 불러오는 중입니다.</p>
      ) : sortedEvents.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">등록된 일정이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-border">
          {sortedEvents.map((event) => {
            const connection = getLeaveConnectionLabel(event, data);
            return (
              <li key={event.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-medium">{event.title}</h2>
                    <span className="rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">{getEventTypeLabel(event.type)}</span>
                    <span className="text-xs text-muted-foreground">{getEventStatusLabel(event.status)}</span>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <span>{formatEventDate(event.startDate)}{event.endDate !== event.startDate ? ` ~ ${formatEventDate(event.endDate)}` : ""}</span>
                    {event.startTime && <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="size-3" />{event.startTime}</span>}
                  </p>
                  {connection && <p className="mt-1 text-sm text-primary">{connection}{event.leaveDays ? ` · ${event.leaveDays}일` : ""}</p>}
                  {event.overnightId && <p className="mt-1 text-sm text-accent-foreground">성과제외박 사용</p>}
                  {event.proposer && <p className="mt-1 text-sm text-muted-foreground">제안자 · {event.proposer}</p>}
                  {event.description && <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{event.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`${event.title} 수정`}
                    title="수정"
                    onClick={() => openEditForm(event)}
                    className="grid size-9 place-items-center rounded-md hover:bg-muted"
                  >
                    <Pencil aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`${event.title} 삭제`}
                    title="삭제"
                    onClick={() => {
                      setDeleteId(event.id);
                      setDeleteError("");
                    }}
                    className="grid size-9 place-items-center rounded-md text-destructive hover:bg-muted"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5">
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-event-title" className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg">
            <h2 id="delete-event-title" className="font-semibold">이 일정을 삭제하시겠습니까?</h2>
            <p className="mt-2 text-sm text-muted-foreground">휴가 사용량도 함께 복구됩니다.</p>
            {deleteError && <p role="alert" className="mt-3 text-sm text-destructive">{deleteError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="min-h-10 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              >취소</button>
              <button
                type="button"
                onClick={confirmDelete}
                className="min-h-10 rounded-md bg-destructive px-3 text-sm font-medium text-white hover:bg-destructive/90"
              >삭제</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}