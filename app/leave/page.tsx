"use client";

import { useState, type FormEvent } from "react";
import { addDays, format, parseISO } from "date-fns";
import { BedDouble, Gift, Pencil, Plus, Trash2, Umbrella, X } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import {
  calculateNextPerformanceOvernight,
  calculateRemainingLeave,
  calculateRewardLeaveRemaining,
} from "@/lib/leave";
import { isValidDateString } from "@/lib/discharge";
import type { Event, Leave, PerformanceOvernight, RewardLeave } from "@/types";

type LeaveDraft = {
  name: string;
  grantedDays: string;
  usedDays: string;
  grantedAt: string;
  memo: string;
};

const inputClassName =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

function todayString(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function emptyDraft(): LeaveDraft {
  return { name: "", grantedDays: "", usedDays: "0", grantedAt: todayString(), memo: "" };
}

function draftFromLeave(leave: Leave | RewardLeave): LeaveDraft {
  return {
    name: leave.name,
    grantedDays: String(leave.grantedDays),
    usedDays: String(leave.usedDays),
    grantedAt: leave.grantedAt,
    memo: leave.memo ?? "",
  };
}

function parseDays(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const days = Number(value);
  return Number.isFinite(days) && days >= 0 ? days : undefined;
}

function formatDays(days: number): string {
  return `${days.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}일`;
}

function formatDisplayDate(dateString: string): string {
  return isValidDateString(dateString)
    ? format(parseISO(dateString), "yyyy.MM.dd")
    : dateString;
}

export default function LeavePage() {
  const { data, setData, isReady } = useAppData();
  const [regularUsageInput, setRegularUsageInput] = useState<string | null>(null);
  const [regularError, setRegularError] = useState("");
  const [overnightDateInput, setOvernightDateInput] = useState<string | null>(null);
  const [overnightError, setOvernightError] = useState("");
  const [rewardDraft, setRewardDraft] = useState<LeaveDraft>(emptyDraft);
  const [rewardError, setRewardError] = useState("");
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [isAddingReward, setIsAddingReward] = useState(false);
  const [otherDraft, setOtherDraft] = useState<LeaveDraft>(emptyDraft);
  const [otherError, setOtherError] = useState("");
  const [editingOtherId, setEditingOtherId] = useState<string | null>(null);
  const [isAddingOther, setIsAddingOther] = useState(false);

  const regularUsageValue = regularUsageInput ?? String(data.regularLeaveUsedDays);
  const nextOvernightDate = calculateNextPerformanceOvernight(
    data.settings.performanceOvernightBaseDate ?? "",
    data.settings.performanceOvernightCycleWeeks,
  );
  const overnightDateValue = overnightDateInput ?? nextOvernightDate ?? "";
  const regularRemaining = calculateRemainingLeave(
    data.settings.regularLeaveDays,
    data.regularLeaveUsedDays,
  );
  const rewardRemaining = calculateRewardLeaveRemaining(data.rewardLeaves);
  const otherLeaves = data.leaves.filter((leave) => leave.category === "OTHER");
  const otherRemaining = otherLeaves.reduce(
    (total, leave) =>
      total + calculateRemainingLeave(leave.grantedDays, leave.usedDays),
    0,
  );
  const regularEventUsage = data.events
    .filter(
      (event) =>
        event.type === "LEAVE" &&
        event.status !== "REJECTED" &&
        (event.leaveType === "REGULAR" ||
          (!event.leaveType &&
            event.leaveId &&
            data.leaves.some((leave) => leave.id === event.leaveId && leave.category === "REGULAR"))),
    )
    .reduce((total, event) => total + (event.leaveDays ?? 0), 0);

  function saveRegularUsage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const usedDays = parseDays(regularUsageValue);
    if (usedDays === undefined || usedDays < regularEventUsage || usedDays > data.settings.regularLeaveDays) {
      setRegularError("사용일수는 연결된 일정의 사용량 이상이며 정기휴가 총일수를 넘을 수 없습니다.");
      return;
    }
    setData((current) => ({ ...current, regularLeaveUsedDays: usedDays }));
    setRegularUsageInput(null);
    setRegularError("");
  }

  function savePerformanceOvernight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const startDate = overnightDateValue;
    if (
      !nextOvernightDate ||
      !isValidDateString(startDate) ||
      startDate < nextOvernightDate
    ) {
      setOvernightError("다음 가능일 이후의 올바른 시작일을 입력해 주세요.");
      return;
    }

    const overnightId = crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { performanceOvernightCycleWeeks, performanceOvernightNights, performanceOvernightDays } =
      data.settings;
    if (
      !Number.isInteger(performanceOvernightNights) ||
      !Number.isInteger(performanceOvernightDays) ||
      performanceOvernightNights < 1 ||
      performanceOvernightDays < 1
    ) {
      setOvernightError("성과제외박 숙박 및 기간 설정을 확인해 주세요.");
      return;
    }
    const overnight: PerformanceOvernight = {
      id: overnightId,
      availableFrom: nextOvernightDate,
      cycleWeeks: performanceOvernightCycleWeeks,
      durationNights: performanceOvernightNights,
      durationDays: performanceOvernightDays,
      used: true,
      eventId,
    };
    const overnightEvent: Event = {
      id: eventId,
      title: `성과제외박 ${performanceOvernightNights}박 ${performanceOvernightDays}일`,
      type: "OVERNIGHT",
      status: "CONFIRMED",
      startDate,
      endDate: format(
        addDays(parseISO(startDate), performanceOvernightDays - 1),
        "yyyy-MM-dd",
      ),
      overnightId,
      createdAt: now,
      updatedAt: now,
    };

    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        performanceOvernightBaseDate: nextOvernightDate,
      },
      performanceOvernights: [...current.performanceOvernights, overnight],
      events: [...current.events, overnightEvent],
    }));
    setOvernightDateInput(null);
    setOvernightError("");
  }

  function saveReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const grantedDays = parseDays(rewardDraft.grantedDays);
    const usedDays = parseDays(rewardDraft.usedDays);
    const linkedUsage = editingRewardId
      ? data.events
          .filter((event) => event.type === "LEAVE" && event.status !== "REJECTED" && event.rewardLeaveId === editingRewardId)
          .reduce((total, event) => total + (event.leaveDays ?? 0), 0)
      : 0;
    if (
      !rewardDraft.name.trim() ||
      grantedDays === undefined ||
      usedDays === undefined ||
      usedDays > grantedDays ||
      usedDays < linkedUsage ||
      grantedDays < linkedUsage ||
      !rewardDraft.grantedAt
    ) {
      setRewardError("포상명과 부여일을 입력하고, 사용일수는 부여일수를 넘지 않게 해 주세요.");
      return;
    }

    const savedReward: RewardLeave = {
      id: editingRewardId ?? crypto.randomUUID(),
      name: rewardDraft.name.trim(),
      grantedDays,
      usedDays,
      grantedAt: rewardDraft.grantedAt,
      memo: rewardDraft.memo.trim() || undefined,
    };
    setData((current) => ({
      ...current,
      rewardLeaves: editingRewardId
        ? current.rewardLeaves.map((leave) =>
            leave.id === editingRewardId ? savedReward : leave,
          )
        : [...current.rewardLeaves, savedReward],
    }));
    cancelRewardEdit();
  }

  function cancelRewardEdit() {
    setRewardDraft(emptyDraft());
    setRewardError("");
    setEditingRewardId(null);
    setIsAddingReward(false);
  }

  function saveOther(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const grantedDays = parseDays(otherDraft.grantedDays);
    const usedDays = parseDays(otherDraft.usedDays);
    const linkedUsage = editingOtherId
      ? data.events
          .filter((event) => event.type === "LEAVE" && event.status !== "REJECTED" && event.leaveId === editingOtherId)
          .reduce((total, event) => total + (event.leaveDays ?? 0), 0)
      : 0;
    if (
      !otherDraft.name.trim() ||
      grantedDays === undefined ||
      usedDays === undefined ||
      usedDays > grantedDays ||
      usedDays < linkedUsage ||
      grantedDays < linkedUsage ||
      !otherDraft.grantedAt
    ) {
      setOtherError("휴가명과 부여일을 입력하고, 사용일수는 부여일수를 넘지 않게 해 주세요.");
      return;
    }

    const savedLeave: Leave = {
      id: editingOtherId ?? crypto.randomUUID(),
      category: "OTHER",
      name: otherDraft.name.trim(),
      grantedDays,
      usedDays,
      grantedAt: otherDraft.grantedAt,
      memo: otherDraft.memo.trim() || undefined,
    };
    setData((current) => ({
      ...current,
      leaves: editingOtherId
        ? current.leaves.map((leave) =>
            leave.id === editingOtherId ? savedLeave : leave,
          )
        : [...current.leaves, savedLeave],
    }));
    cancelOtherEdit();
  }

  function cancelOtherEdit() {
    setOtherDraft(emptyDraft());
    setOtherError("");
    setEditingOtherId(null);
    setIsAddingOther(false);
  }

  function editReward(leave: RewardLeave) {
    setRewardDraft(draftFromLeave(leave));
    setEditingRewardId(leave.id);
    setIsAddingReward(true);
    setRewardError("");
  }

  function editOther(leave: Leave) {
    setOtherDraft(draftFromLeave(leave));
    setEditingOtherId(leave.id);
    setIsAddingOther(true);
    setOtherError("");
  }

  function removeReward(id: string) {
    if (!window.confirm("이 포상휴가를 삭제할까요?")) return;
    if (data.events.some((event) => event.rewardLeaveId === id)) {
      window.alert("일정에 연결된 포상휴가는 먼저 해당 일정을 수정하거나 삭제해 주세요.");
      return;
    }
    setData((current) => ({
      ...current,
      rewardLeaves: current.rewardLeaves.filter((leave) => leave.id !== id),
    }));
  }

  function removeOther(id: string) {
    if (!window.confirm("이 기타 휴가를 삭제할까요?")) return;
    if (data.events.some((event) => event.leaveId === id)) {
      window.alert("일정에 연결된 기타 휴가는 먼저 해당 일정을 수정하거나 삭제해 주세요.");
      return;
    }
    setData((current) => ({
      ...current,
      leaves: current.leaves.filter((leave) => leave.id !== id),
    }));
  }

  function renderLeaveForm(
    draft: LeaveDraft,
    setDraft: (draft: LeaveDraft) => void,
    error: string,
    onSubmit: (event: FormEvent<HTMLFormElement>) => void,
    onCancel: () => void,
    submitLabel: string,
  ) {
    return (
      <form onSubmit={onSubmit} className="mt-4 space-y-4 rounded-md border border-border p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            이름
            <input
              required
              value={draft.name}
              disabled={!isReady}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            부여일수
            <input
              required
              type="number"
              min="0"
              step="0.5"
              value={draft.grantedDays}
              disabled={!isReady}
              onChange={(event) => setDraft({ ...draft, grantedDays: event.target.value })}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            사용일수
            <input
              required
              type="number"
              min="0"
              step="0.5"
              value={draft.usedDays}
              disabled={!isReady}
              onChange={(event) => setDraft({ ...draft, usedDays: event.target.value })}
              className={inputClassName}
            />
          </label>
          <label className="space-y-2 text-sm font-medium">
            부여일
            <input
              required
              type="date"
              value={draft.grantedAt}
              disabled={!isReady}
              onChange={(event) => setDraft({ ...draft, grantedAt: event.target.value })}
              className={inputClassName}
            />
          </label>
        </div>
        <label className="block space-y-2 text-sm font-medium">
          메모
          <textarea
            rows={2}
            value={draft.memo}
            disabled={!isReady}
            onChange={(event) => setDraft({ ...draft, memo: event.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!isReady}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
          >
            <X aria-hidden="true" className="size-4" />
            취소
          </button>
        </div>
      </form>
    );
  }

  return (
    <section aria-labelledby="leave-title" className="space-y-8">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Umbrella aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-primary">TIME OFF</p>
          <h1 id="leave-title" className="mt-1 text-2xl font-semibold">휴가</h1>
          <p className="mt-1 text-sm text-muted-foreground">부여량과 사용량을 기록합니다.</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium">정기휴가</p>
          <p className="mt-3 text-2xl font-semibold">{formatDays(regularRemaining)} 남음</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDays(data.regularLeaveUsedDays)} 사용 / {formatDays(data.settings.regularLeaveDays)} 부여
          </p>
        </article>
        <article className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium">포상휴가</p>
          <p className="mt-3 text-2xl font-semibold">{formatDays(rewardRemaining)} 남음</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.rewardLeaves.length}개 포상 기록
          </p>
        </article>
        <article className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium">기타 휴가</p>
          <p className="mt-3 text-2xl font-semibold">{formatDays(otherRemaining)} 남음</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {otherLeaves.length}개 휴가 기록
          </p>
        </article>
      </div>

      <div className="space-y-6">
        <section aria-labelledby="overnight-title" className="border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <BedDouble aria-hidden="true" className="size-5 text-primary" />
            <div>
              <h2 id="overnight-title" className="font-semibold">성과제외박</h2>
              {nextOvernightDate ? (
                <>
                  <p className="mt-1 text-sm text-muted-foreground">
                    다음 가능일 {formatDisplayDate(nextOvernightDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data.settings.performanceOvernightNights}박 {data.settings.performanceOvernightDays}일 · {data.settings.performanceOvernightCycleWeeks}주 주기
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">설정에서 기준일을 입력해 주세요.</p>
              )}
            </div>
          </div>
          <form onSubmit={savePerformanceOvernight} className="mt-4 flex flex-wrap items-end gap-3">
            <label htmlFor="overnightStartDate" className="min-w-40 flex-1 space-y-2 text-sm font-medium">
              일정 시작일
              <input
                id="overnightStartDate"
                type="date"
                min={nextOvernightDate ?? undefined}
                value={overnightDateValue}
                disabled={!isReady || !nextOvernightDate}
                onChange={(event) => setOvernightDateInput(event.target.value)}
                className={inputClassName}
              />
            </label>
            <button
              type="submit"
              disabled={!isReady || !nextOvernightDate}
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              일정 등록 및 사용 처리
            </button>
          </form>
          {overnightError && <p role="alert" className="mt-2 text-sm text-destructive">{overnightError}</p>}
          <ul className="mt-4 divide-y divide-border">
            {data.performanceOvernights.map((overnight) => {
              const linkedEvent = data.events.find((event) => event.id === overnight.eventId);
              return (
                <li key={overnight.id} className="py-3">
                  <p className="text-sm font-medium">
                    {overnight.used ? "사용" : "미사용"} · 가능일 {formatDisplayDate(overnight.availableFrom)}
                  </p>
                  {linkedEvent && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      일정 연결 · {linkedEvent.title} ({formatDisplayDate(linkedEvent.startDate)}–{formatDisplayDate(linkedEvent.endDate)})
                    </p>
                  )}
                  {overnight.memo && <p className="mt-1 text-sm text-muted-foreground">{overnight.memo}</p>}
                </li>
              );
            })}
            {data.performanceOvernights.length === 0 && (
              <li className="py-5 text-center text-sm text-muted-foreground">등록된 사용 기록이 없습니다.</li>
            )}
          </ul>
        </section>

        <section aria-labelledby="regular-title" className="border-t border-border pt-5">
          <div className="flex items-center gap-3">
            <Umbrella aria-hidden="true" className="size-5 text-primary" />
            <div>
              <h2 id="regular-title" className="font-semibold">정기휴가 상세</h2>
              <p className="text-sm text-muted-foreground">
                총 {formatDays(data.settings.regularLeaveDays)}, 사용 {formatDays(data.regularLeaveUsedDays)}, 잔여 {formatDays(regularRemaining)}
              </p>
            </div>
          </div>
          <form onSubmit={saveRegularUsage} className="mt-4 flex flex-wrap items-end gap-3">
            <label htmlFor="regularUsage" className="min-w-40 flex-1 space-y-2 text-sm font-medium">
              사용일수
              <input
                id="regularUsage"
                type="number"
                min="0"
                max={data.settings.regularLeaveDays}
                step="0.5"
                value={regularUsageValue}
                disabled={!isReady}
                onChange={(event) => setRegularUsageInput(event.target.value)}
                className={inputClassName}
              />
            </label>
            <button
              type="submit"
              disabled={!isReady}
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              사용량 저장
            </button>
          </form>
          {regularError && <p role="alert" className="mt-2 text-sm text-destructive">{regularError}</p>}
        </section>

        <section aria-labelledby="reward-title" className="border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Gift aria-hidden="true" className="size-5 text-primary" />
              <div>
                <h2 id="reward-title" className="font-semibold">포상휴가 상세</h2>
                <p className="text-sm text-muted-foreground">
                  총 잔여 {formatDays(rewardRemaining)} · 관리 한도 {formatDays(data.settings.rewardLeaveLimit)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                cancelRewardEdit();
                setIsAddingReward(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <Plus aria-hidden="true" className="size-4" /> 포상 추가
            </button>
          </div>
          {isAddingReward && renderLeaveForm(
            rewardDraft,
            setRewardDraft,
            rewardError,
            saveReward,
            cancelRewardEdit,
            editingRewardId ? "수정 저장" : "포상 저장",
          )}
          <ul className="mt-4 divide-y divide-border">
            {data.rewardLeaves.map((leave) => (
              <li key={leave.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{leave.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDays(leave.grantedDays)} 부여 · {formatDays(leave.usedDays)} 사용 · {formatDays(calculateRemainingLeave(leave.grantedDays, leave.usedDays))} 남음
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">부여일 {leave.grantedAt}</p>
                  {leave.memo && <p className="mt-2 whitespace-pre-wrap text-sm">{leave.memo}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`${leave.name} 수정`}
                    title="수정"
                    onClick={() => editReward(leave)}
                    className="grid size-9 place-items-center rounded-md hover:bg-muted"
                  ><Pencil aria-hidden="true" className="size-4" /></button>
                  <button
                    type="button"
                    aria-label={`${leave.name} 삭제`}
                    title="삭제"
                    onClick={() => removeReward(leave.id)}
                    className="grid size-9 place-items-center rounded-md text-destructive hover:bg-muted"
                  ><Trash2 aria-hidden="true" className="size-4" /></button>
                </div>
              </li>
            ))}
            {data.rewardLeaves.length === 0 && !isAddingReward && (
              <li className="py-6 text-center text-sm text-muted-foreground">등록된 포상휴가가 없습니다.</li>
            )}
          </ul>
        </section>

        <section aria-labelledby="other-title" className="border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Umbrella aria-hidden="true" className="size-5 text-muted-foreground" />
              <div>
                <h2 id="other-title" className="font-semibold">기타 휴가 상세</h2>
                <p className="text-sm text-muted-foreground">총 잔여 {formatDays(otherRemaining)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                cancelOtherEdit();
                setIsAddingOther(true);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <Plus aria-hidden="true" className="size-4" /> 기타 휴가 추가
            </button>
          </div>
          {isAddingOther && renderLeaveForm(
            otherDraft,
            setOtherDraft,
            otherError,
            saveOther,
            cancelOtherEdit,
            editingOtherId ? "수정 저장" : "휴가 저장",
          )}
          <ul className="mt-4 divide-y divide-border">
            {otherLeaves.map((leave) => (
              <li key={leave.id} className="flex items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{leave.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDays(leave.grantedDays)} 부여 · {formatDays(leave.usedDays)} 사용 · {formatDays(calculateRemainingLeave(leave.grantedDays, leave.usedDays))} 남음
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">부여일 {leave.grantedAt}</p>
                  {leave.memo && <p className="mt-2 whitespace-pre-wrap text-sm">{leave.memo}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`${leave.name} 수정`}
                    title="수정"
                    onClick={() => editOther(leave)}
                    className="grid size-9 place-items-center rounded-md hover:bg-muted"
                  ><Pencil aria-hidden="true" className="size-4" /></button>
                  <button
                    type="button"
                    aria-label={`${leave.name} 삭제`}
                    title="삭제"
                    onClick={() => removeOther(leave.id)}
                    className="grid size-9 place-items-center rounded-md text-destructive hover:bg-muted"
                  ><Trash2 aria-hidden="true" className="size-4" /></button>
                </div>
              </li>
            ))}
            {otherLeaves.length === 0 && !isAddingOther && (
              <li className="py-6 text-center text-sm text-muted-foreground">등록된 기타 휴가가 없습니다.</li>
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}