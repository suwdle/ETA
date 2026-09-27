"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Clock3 } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { DDayCard } from "@/components/dashboard/dday-card";
import { isValidDateString } from "@/lib/discharge";

function getEventTypeLabel(type: string): string {
  if (type === "LEAVE") return "휴가";
  if (type === "OVERNIGHT") return "외박";
  if (type === "OUTING") return "외출";
  if (type === "PROPOSAL") return "일정 제안";
  return "일반 일정";
}

export default function Home() {
  const { data, isReady } = useAppData();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayEvents = data.events
    .filter(
      (event) =>
        isValidDateString(event.startDate) &&
        isValidDateString(event.endDate) &&
        event.startDate <= today &&
        event.endDate >= today,
    )
    .sort((first, second) => (first.startTime ?? "").localeCompare(second.startTime ?? ""));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase text-primary">DASHBOARD</p>
        <h1 className="mt-1 text-2xl font-semibold">홈</h1>
      </header>
      <DDayCard
        dischargeDate={data.settings.dischargeDate}
        isReady={isReady}
      />
      <section aria-labelledby="today-events-title" className="border-t border-border pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="today-events-title" className="font-semibold">오늘 일정</h2>
          <Link href="/events" className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            전체 일정 <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
        {!isReady ? (
          <p className="py-5 text-sm text-muted-foreground">일정을 불러오는 중입니다.</p>
        ) : todayEvents.length === 0 ? (
          <p className="py-5 text-sm text-muted-foreground">오늘 등록된 일정이 없습니다.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {todayEvents.map((event) => (
              <li key={event.id} className="flex items-start gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <Clock3 aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.startTime ? `${event.startTime} · ` : ""}{getEventTypeLabel(event.type)}
                    {event.proposer ? ` · ${event.proposer} 제안` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
