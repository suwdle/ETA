"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, Save } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { isValidDateString } from "@/lib/discharge";

export default function SettingsPage() {
  const { data, setData, isReady } = useAppData();
  const [dateError, setDateError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const { serviceStartDate = "", dischargeDate } = data.settings;

  function updateDate(field: "serviceStartDate" | "dischargeDate", value: string) {
    if (value && !isValidDateString(value)) {
      setDateError("올바른 날짜를 입력해 주세요.");
      return;
    }

    setDateError("");
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
    setIsSaved(true);
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
    </section>
  );
}