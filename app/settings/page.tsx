"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { format } from "date-fns";
import { CalendarDays, Download, Save, Trash2, Upload } from "lucide-react";
import { createDefaultAppData } from "@/data/defaults";
import { useAppData } from "@/hooks/use-app-data";
import { isValidDateString } from "@/lib/discharge";
import {
  clearAppData,
  exportAppData,
  importAppData,
  parseAppDataBackup,
} from "@/lib/storage";

export default function SettingsPage() {
  const { data, setData, isReady } = useAppData();
  const [dateError, setDateError] = useState("");
  const [leaveError, setLeaveError] = useState("");
  const [overnightError, setOvernightError] = useState("");
  const [regularLeaveDays, setRegularLeaveDays] = useState<string | null>(null);
  const [rewardLeaveLimit, setRewardLeaveLimit] = useState<string | null>(null);
  const [overnightCycleWeeks, setOvernightCycleWeeks] = useState<string | null>(null);
  const [overnightNights, setOvernightNights] = useState<string | null>(null);
  const [overnightDays, setOvernightDays] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [backupError, setBackupError] = useState("");
  const [backupStatus, setBackupStatus] = useState("");
  const [pendingBackupJson, setPendingBackupJson] = useState<string | null>(null);
  const [pendingBackupName, setPendingBackupName] = useState("");
  const [confirmation, setConfirmation] = useState<"import" | "reset" | null>(null);
  const [isReadingBackup, setIsReadingBackup] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const { serviceStartDate = "", dischargeDate } = data.settings;
  const regularLeaveDaysValue = regularLeaveDays ?? String(data.settings.regularLeaveDays);
  const rewardLeaveLimitValue = rewardLeaveLimit ?? String(data.settings.rewardLeaveLimit);
  const overnightCycleWeeksValue =
    overnightCycleWeeks ?? String(data.settings.performanceOvernightCycleWeeks);
  const overnightNightsValue =
    overnightNights ?? String(data.settings.performanceOvernightNights);
  const overnightDaysValue =
    overnightDays ?? String(data.settings.performanceOvernightDays);

  function updateDate(
    field: "serviceStartDate" | "dischargeDate" | "performanceOvernightBaseDate",
    value: string,
  ) {
    if (value && !isValidDateString(value)) {
      setDateError("올바른 날짜를 입력해 주세요.");
      return;
    }

    setDateError("");
    setOvernightError("");
    setIsSaved(false);
    setData((current) => ({
      ...current,
      settings: { ...current.settings, [field]: value },
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidDateString(dischargeDate)) {
      setDateError("전역일을 올바르게 입력해 주세요.");
      return;
    }

    const regularDays = Number(regularLeaveDaysValue);
    const rewardLimit = Number(rewardLeaveLimitValue);
    if (
      !regularLeaveDaysValue.trim() ||
      !rewardLeaveLimitValue.trim() ||
      !Number.isFinite(regularDays) ||
      !Number.isFinite(rewardLimit) ||
      regularDays < data.regularLeaveUsedDays ||
      regularDays < 0 ||
      rewardLimit < 0
    ) {
      setLeaveError(
        regularDays < data.regularLeaveUsedDays
          ? "정기휴가 총일수는 이미 사용한 일수보다 작을 수 없습니다."
          : "휴가 일수는 0 이상의 숫자로 입력해 주세요.",
      );
      return;
    }

    const cycleWeeks = Number(overnightCycleWeeksValue);
    const durationNights = Number(overnightNightsValue);
    const durationDays = Number(overnightDaysValue);
    if (
      !overnightCycleWeeksValue.trim() ||
      !overnightNightsValue.trim() ||
      !overnightDaysValue.trim() ||
      !Number.isInteger(cycleWeeks) ||
      !Number.isInteger(durationNights) ||
      !Number.isInteger(durationDays) ||
      cycleWeeks < 1 ||
      durationNights < 1 ||
      durationDays < 1
    ) {
      setOvernightError("주기, 숙박, 기간은 1 이상의 정수로 입력해 주세요.");
      return;
    }

    setIsSaved(true);
    setDateError("");
    setLeaveError("");
    setOvernightError("");
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        regularLeaveDays: regularDays,
        rewardLeaveLimit: rewardLimit,
        performanceOvernightCycleWeeks: cycleWeeks,
        performanceOvernightNights: durationNights,
        performanceOvernightDays: durationDays,
      },
    }));
    setRegularLeaveDays(null);
    setRewardLeaveLimit(null);
    setOvernightCycleWeeks(null);
    setOvernightNights(null);
    setOvernightDays(null);
  }

  function exportBackup() {
    const backup = exportAppData(data);
    const file = new Blob([backup], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `airplanner-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBackupError("");
    setBackupStatus("백업 파일을 저장했습니다.");
  }

  async function selectBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBackupError("");
    setBackupStatus("");
    setIsReadingBackup(true);
    try {
      const contents = await file.text();
      parseAppDataBackup(contents);
      setPendingBackupJson(contents);
      setPendingBackupName(file.name);
      setConfirmation("import");
    } catch {
      setBackupError("올바른 AirPlanner 백업 파일이 아닙니다.");
    } finally {
      setIsReadingBackup(false);
    }
  }

  function restoreBackup() {
    if (!pendingBackupJson) return;
    try {
      const restoredData = importAppData(pendingBackupJson);
      setData(restoredData);
      setBackupStatus("백업 데이터를 복원했습니다.");
      setBackupError("");
      setConfirmation(null);
      setPendingBackupJson(null);
      setPendingBackupName("");
    } catch {
      setBackupError("올바른 AirPlanner 백업 파일이 아닙니다.");
      setConfirmation(null);
    }
  }

  function resetAllData() {
    clearAppData();
    setData(createDefaultAppData());
    setConfirmation(null);
    setPendingBackupJson(null);
    setPendingBackupName("");
    setBackupError("");
    setBackupStatus("모든 데이터를 초기화했습니다.");
  }

  function cancelConfirmation() {
    setConfirmation(null);
    setPendingBackupJson(null);
    setPendingBackupName("");
  }

  return (
    <section aria-labelledby="settings-title" className="space-y-8">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-primary">PREFERENCES</p>
          <h1 id="settings-title" className="mt-1 text-2xl font-semibold">
            복무 정보
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">입대일과 전역일</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
        <div className="space-y-2">
          <label htmlFor="serviceStartDate" className="text-sm font-medium">
            입대일 <span className="text-muted-foreground">(선택)</span>
          </label>
          <input
            id="serviceStartDate"
            name="serviceStartDate"
            type="date"
            value={serviceStartDate}
            disabled={!isReady}
            onChange={(event) => updateDate("serviceStartDate", event.target.value)}
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="dischargeDate" className="text-sm font-medium">
            전역일 <span aria-hidden="true" className="text-destructive">*</span>
          </label>
          <input
            id="dischargeDate"
            name="dischargeDate"
            type="date"
            required
            value={dischargeDate}
            disabled={!isReady}
            aria-invalid={Boolean(dateError)}
            aria-describedby={dateError ? "dischargeDate-error" : undefined}
            onChange={(event) => updateDate("dischargeDate", event.target.value)}
            className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 aria-[invalid=true]:border-destructive"
          />
          {dateError && (
            <p id="dischargeDate-error" role="alert" className="text-sm text-destructive">
              {dateError}
            </p>
          )}
        </div>

        <fieldset className="space-y-5 border-t border-border pt-5">
          <legend className="text-base font-semibold">휴가 기준</legend>
          <div className="space-y-2">
            <label htmlFor="regularLeaveDays" className="text-sm font-medium">
              정기휴가 총일수
            </label>
            <div className="flex items-center gap-3">
              <input
                id="regularLeaveDays"
                name="regularLeaveDays"
                type="number"
                min={data.regularLeaveUsedDays}
                step="0.5"
                value={regularLeaveDaysValue}
                disabled={!isReady}
                onChange={(event) => {
                  setRegularLeaveDays(event.target.value);
                  setIsSaved(false);
                }}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
              <span className="text-sm text-muted-foreground">일</span>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="rewardLeaveLimit" className="text-sm font-medium">
              포상휴가 관리 한도
            </label>
            <div className="flex items-center gap-3">
              <input
                id="rewardLeaveLimit"
                name="rewardLeaveLimit"
                type="number"
                min="0"
                step="0.5"
                value={rewardLeaveLimitValue}
                disabled={!isReady}
                onChange={(event) => {
                  setRewardLeaveLimit(event.target.value);
                  setIsSaved(false);
                }}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
              <span className="text-sm text-muted-foreground">일</span>
            </div>
            <p className="text-xs text-muted-foreground">실제 부여량을 제한하지 않는 관리용 기준값입니다.</p>
          </div>
          {leaveError && (
            <p role="alert" className="text-sm text-destructive">
              {leaveError}
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-5 border-t border-border pt-5">
          <legend className="text-base font-semibold">성과제외박</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <label htmlFor="performanceOvernightCycleWeeks" className="space-y-2 text-sm font-medium">
              주기 (주)
              <input
                id="performanceOvernightCycleWeeks"
                type="number"
                min="1"
                step="1"
                value={overnightCycleWeeksValue}
                disabled={!isReady}
                onChange={(event) => {
                  setOvernightCycleWeeks(event.target.value);
                  setIsSaved(false);
                }}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
            </label>
            <label htmlFor="performanceOvernightNights" className="space-y-2 text-sm font-medium">
              숙박 (박)
              <input
                id="performanceOvernightNights"
                type="number"
                min="1"
                step="1"
                value={overnightNightsValue}
                disabled={!isReady}
                onChange={(event) => {
                  setOvernightNights(event.target.value);
                  setIsSaved(false);
                }}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
            </label>
            <label htmlFor="performanceOvernightDays" className="space-y-2 text-sm font-medium">
              기간 (일)
              <input
                id="performanceOvernightDays"
                type="number"
                min="1"
                step="1"
                value={overnightDaysValue}
                disabled={!isReady}
                onChange={(event) => {
                  setOvernightDays(event.target.value);
                  setIsSaved(false);
                }}
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              />
            </label>
          </div>
          <div className="space-y-2">
            <label htmlFor="performanceOvernightBaseDate" className="text-sm font-medium">
              성과제외박 기준일
            </label>
            <input
              id="performanceOvernightBaseDate"
              type="date"
              value={data.settings.performanceOvernightBaseDate ?? ""}
              disabled={!isReady}
              onChange={(event) => updateDate("performanceOvernightBaseDate", event.target.value)}
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
          </div>
          {overnightError && (
            <p role="alert" className="text-sm text-destructive">{overnightError}</p>
          )}
        </fieldset>

        <div className="flex min-h-11 items-center gap-3">
          <button
            type="submit"
            disabled={!isReady}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60"
          >
            <Save aria-hidden="true" className="size-4" />
            저장
          </button>
          {isSaved && <p role="status" className="text-sm text-muted-foreground">저장했습니다.</p>}
        </div>
      </form>

      <section aria-labelledby="backup-title" className="max-w-lg space-y-5 border-t border-border pt-6">
        <div>
          <h2 id="backup-title" className="font-semibold">데이터 관리</h2>
          <p className="mt-1 text-sm text-muted-foreground">이 브라우저의 localStorage 데이터를 백업하거나 복원합니다.</p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">데이터 백업</h3>
              <p className="text-xs text-muted-foreground">현재 일정과 설정을 JSON 파일로 저장합니다.</p>
            </div>
            <button
              type="button"
              onClick={exportBackup}
              disabled={!isReady}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              <Download aria-hidden="true" className="size-4" /> JSON 파일로 저장
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div>
              <h3 className="text-sm font-medium">데이터 복원</h3>
              <p className="text-xs text-muted-foreground">AirPlanner JSON 백업 파일을 선택합니다.</p>
            </div>
            <input
              ref={backupInputRef}
              type="file"
              accept=".json,application/json"
              onChange={selectBackup}
              className="sr-only"
              aria-label="JSON 백업 파일 선택"
            />
            <button
              type="button"
              onClick={() => backupInputRef.current?.click()}
              disabled={!isReady || isReadingBackup}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              <Upload aria-hidden="true" className="size-4" />
              {isReadingBackup ? "파일 확인 중" : "JSON 파일 선택"}
            </button>
          </div>
        </div>

        <div className="border-t border-destructive/30 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">모든 데이터 삭제</h3>
              <p className="text-xs text-muted-foreground">일정, 휴가 및 설정을 기본값으로 초기화합니다.</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmation("reset")}
              disabled={!isReady}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
            >
              <Trash2 aria-hidden="true" className="size-4" /> 전체 삭제
            </button>
          </div>
        </div>

        {backupError && <p role="alert" className="text-sm text-destructive">{backupError}</p>}
        {backupStatus && <p role="status" className="text-sm text-muted-foreground">{backupStatus}</p>}
      </section>

      {confirmation && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="data-confirmation-title"
            className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg"
          >
            {confirmation === "import" ? (
              <>
                <h2 id="data-confirmation-title" className="font-semibold">데이터 복원</h2>
                <p className="mt-3 text-sm">현재 데이터가 백업 데이터로 교체됩니다.</p>
                <p className="mt-1 text-sm">계속하시겠습니까?</p>
                <p className="mt-3 break-all text-xs text-muted-foreground">{pendingBackupName}</p>
              </>
            ) : (
              <>
                <h2 id="data-confirmation-title" className="font-semibold">모든 데이터를 삭제할까요?</h2>
                <p className="mt-3 text-sm">모든 일정과 휴가 데이터가 삭제됩니다.</p>
              </>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelConfirmation}
                className="min-h-10 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmation === "import" ? restoreBackup : resetAllData}
                className={`min-h-10 rounded-md px-3 text-sm font-medium text-white ${
                  confirmation === "import"
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-destructive hover:bg-destructive/90"
                }`}
              >
                {confirmation === "import" ? "복원" : "전체 삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}