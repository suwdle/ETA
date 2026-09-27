"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ko } from "date-fns/locale";
import {
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Umbrella,
} from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/hooks/use-app-data";
import { calculatePerformanceOvernightDates } from "@/lib/calendar";
import { isValidDateString } from "@/lib/discharge";
import type { Event } from "@/types";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

type EventKind = "leave" | "overnight" | "general";

function getEventKind(event: Event): EventKind {
  if (event.type === "OVERNIGHT" || event.overnightId) return "overnight";
  if (event.type === "LEAVE" || event.leaveId || event.rewardLeaveId) return "leave";
  return "general";
}

function formatDisplayDate(dateString: string): string {
  return isValidDateString(dateString)
    ? format(parseISO(dateString), "yyyy.MM.dd")
    : dateString;
}

function getEventTypeLabel(event: Event): string {
  switch (getEventKind(event)) {
    case "leave":
      return "휴가";
    case "overnight":
      return "외박";
    default:
      return event.type === "PROPOSAL" ? "일정 제안" : "일반 일정";
  }
}

function getEventStatusLabel(status: Event["status"]): string {
  switch (status) {
    case "PROPOSED":
      return "제안";
    case "REJECTED":
      return "거절";
    case "CONFIRMED":
      return "확정";
    case "COMPLETED":
      return "완료";
  }
}

function getEventIcon(kind: EventKind) {
  if (kind === "leave") return Umbrella;
  if (kind === "overnight") return BedDouble;
  return CalendarDays;
}

function getEventTone(kind: EventKind) {
  if (kind === "leave") {
    return {
      text: "text-primary",
      dot: "bg-primary",
      background: "bg-primary/10",
    };
  }
  if (kind === "overnight") {
    return {
      text: "text-accent-foreground",
      dot: "bg-accent-foreground",
      background: "bg-accent",
    };
  }
  return {
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    background: "bg-muted",
  };
}

export default function CalendarPage() {
  const { data, isReady } = useAppData();
  const [displayedMonth, setDisplayedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const today = startOfDay(new Date());

  const gridStart = startOfWeek(startOfMonth(displayedMonth), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(displayedMonth), { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const monthRangeStart = format(gridStart, "yyyy-MM-dd");
  const monthRangeEnd = format(gridEnd, "yyyy-MM-dd");
  const performanceOvernightDates = new Set(
    calculatePerformanceOvernightDates(
      data.settings.performanceOvernightBaseDate ?? "",
      data.settings.performanceOvernightCycleWeeks,
      monthRangeStart,
      monthRangeEnd,
    ),
  );
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDateEvents = data.events
    .filter(
      (event) =>
        isValidDateString(event.startDate) &&
        isValidDateString(event.endDate) &&
        event.startDate <= selectedDateKey &&
        event.endDate >= selectedDateKey,
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate));
  const hasPerformanceOvernight = performanceOvernightDates.has(selectedDateKey);

  function showMonth(month: Date) {
    const firstDay = startOfMonth(month);
    setDisplayedMonth(firstDay);
    setSelectedDate(firstDay);
  }

  function selectDay(day: Date) {
    if (!isSameMonth(day, displayedMonth)) {
      setDisplayedMonth(startOfMonth(day));
    }
    setSelectedDate(day);
  }

  function getEventsOnDay(day: Date): Event[] {
    const dateKey = format(day, "yyyy-MM-dd");
    return data.events
      .filter(
        (event) =>
          isValidDateString(event.startDate) &&
          isValidDateString(event.endDate) &&
          event.startDate <= dateKey &&
          event.endDate >= dateKey,
      )
      .sort((first, second) => first.startDate.localeCompare(second.startDate));
  }

  return (
    <section aria-labelledby="calendar-title" className="space-y-5">
      <header className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <CalendarDays aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-primary">SCHEDULE</p>
          <h1 id="calendar-title" className="mt-1 text-2xl font-semibold">캘린더</h1>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="이전 달"
            title="이전 달"
            onClick={() => showMonth(subMonths(displayedMonth, 1))}
            className="grid size-10 place-items-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <h2 aria-live="polite" className="min-w-32 text-center text-lg font-semibold">
            {format(displayedMonth, "yyyy년 M월", { locale: ko })}
          </h2>
          <button
            type="button"
            aria-label="다음 달"
            title="다음 달"
            onClick={() => showMonth(addMonths(displayedMonth, 1))}
            className="grid size-10 place-items-center rounded-md hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            const currentDate = startOfDay(new Date());
            setDisplayedMonth(startOfMonth(currentDate));
            setSelectedDate(currentDate);
          }}
          className="min-h-10 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        >
          오늘
        </button>
      </div>

      <div role="grid" aria-label={`${format(displayedMonth, "yyyy년 M월", { locale: ko })} 일정`}>
        <div role="row" className="grid grid-cols-7 border-b border-border pb-2 text-center text-xs font-medium text-muted-foreground">
          {weekdays.map((weekday) => (
            <div key={weekday} role="columnheader" className="py-1">{weekday}</div>
          ))}
        </div>
        {Array.from({ length: calendarDays.length / 7 }, (_, weekIndex) => {
          const week = calendarDays.slice(weekIndex * 7, weekIndex * 7 + 7);
          return (
            <div key={format(week[0], "yyyy-MM-dd")} role="row" className="grid grid-cols-7 border-b border-border">
              {week.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayEvents = getEventsOnDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, displayedMonth);
                const hasOvernightAvailability = performanceOvernightDates.has(dayKey);
                const visibleEvents = dayEvents.slice(0, hasOvernightAvailability ? 1 : 2);
                const hiddenCount = dayEvents.length - visibleEvents.length;
                const accessibilityLabel = [
                  format(day, "M월 d일 EEEE", { locale: ko }),
                  `${dayEvents.length}개 일정`,
                  hasOvernightAvailability ? "성과제외박 가능일" : "",
                ].filter(Boolean).join(", ");

                return (
                  <div key={dayKey} role="gridcell" aria-selected={isSelected} className="min-w-0 border-r border-border last:border-r-0">
                    <button
                      type="button"
                      aria-label={accessibilityLabel}
                      aria-pressed={isSelected}
                      aria-current={isSameDay(day, today) ? "date" : undefined}
                      onClick={() => selectDay(day)}
                      className={`flex min-h-[4.5rem] w-full min-w-0 flex-col items-start gap-0.5 p-1 text-left transition-colors focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-ring sm:min-h-20 sm:p-2 ${
                        isSelected ? "bg-secondary" : "bg-background hover:bg-muted/70"
                      } ${isCurrentMonth ? "" : "text-muted-foreground/55"}`}
                    >
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${
                        isSameDay(day, today)
                          ? "bg-primary font-semibold text-primary-foreground"
                          : "font-medium"
                      }`}>
                        {format(day, "d")}
                      </span>
                      <span className="w-full min-w-0 space-y-0.5">
                        {hasOvernightAvailability && (
                          <span className="flex min-w-0 items-center gap-1 text-[10px] leading-3 text-accent-foreground">
                            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent-foreground" />
                            <BedDouble aria-hidden="true" className="size-3 shrink-0" />
                            <span className="truncate">성과제</span>
                          </span>
                        )}
                        {visibleEvents.map((calendarEvent) => {
                          const kind = getEventKind(calendarEvent);
                          const Icon = getEventIcon(kind);
                          const tone = getEventTone(kind);
                          return (
                            <span key={calendarEvent.id} title={calendarEvent.title} className={`flex min-w-0 items-center gap-1 text-[10px] leading-3 ${tone.text}`}>
                              <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${tone.dot}`} />
                              <Icon aria-hidden="true" className="size-3 shrink-0" />
                              <span className="truncate">{calendarEvent.title || getEventTypeLabel(calendarEvent)}</span>
                            </span>
                          );
                        })}
                        {hiddenCount > 0 && (
                          <span className="block truncate pl-1 text-[10px] leading-3 text-muted-foreground">+{hiddenCount}개</span>
                        )}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <section aria-labelledby="selected-date-title" aria-busy={!isReady} className="border-t border-border pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="selected-date-title" className="text-lg font-semibold">
            {format(selectedDate, "M월 d일 (EEEE)", { locale: ko })}
          </h2>
          {isSameDay(selectedDate, today) && (
            <span className="text-xs font-medium text-primary">오늘</span>
          )}
        </div>

        {hasPerformanceOvernight && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
            <BedDouble aria-hidden="true" className="size-4 shrink-0" />
            <span>성과제외박 주기상 가능일</span>
          </div>
        )}

        {!isReady ? (
          <p className="py-5 text-center text-sm text-muted-foreground">일정을 불러오는 중입니다.</p>
        ) : selectedDateEvents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-5 text-center">
            <p className="text-sm text-muted-foreground">등록된 일정이 없습니다.</p>
            <Link
              href="/events"
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
            >
              <Plus aria-hidden="true" className="size-4" /> 일정 추가
            </Link>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {selectedDateEvents.map((event) => {
              const kind = getEventKind(event);
              const Icon = getEventIcon(kind);
              const tone = getEventTone(kind);
              const dateRange = event.startDate === event.endDate
                ? formatDisplayDate(event.startDate)
                : `${formatDisplayDate(event.startDate)} ~ ${formatDisplayDate(event.endDate)}`;
              return (
                <li key={event.id} className="flex items-start gap-3 py-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-md ${tone.background} ${tone.text}`}>
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="break-words text-sm font-medium">{event.title || getEventTypeLabel(event)}</h3>
                      <span className="text-xs text-muted-foreground">{getEventStatusLabel(event.status)}</span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 aria-hidden="true" className="size-3 shrink-0" />
                      {getEventTypeLabel(event)} · {dateRange}
                    </p>
                    {event.description && (
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}