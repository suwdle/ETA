import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { calculateDDay, isValidDateString } from "@/lib/discharge";

interface DDayCardProps {
  dischargeDate: string;
  isReady: boolean;
}

export function DDayCard({ dischargeDate, isReady }: DDayCardProps) {
  const hasDischargeDate = isValidDateString(dischargeDate);

  return (
    <section
      aria-labelledby="dday-title"
      aria-busy={!isReady}
      className="overflow-hidden rounded-lg bg-primary px-6 py-7 text-primary-foreground sm:px-8 sm:py-9"
    >
      <p className="text-sm font-medium text-primary-foreground/75">전역까지</p>
      {isReady && hasDischargeDate ? (
        <>
          <h2 id="dday-title" className="mt-3 text-6xl font-semibold tabular-nums">
            {getDDayLabel(calculateDDay(dischargeDate))}
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80">
            {format(parseISO(dischargeDate), "yyyy년 M월 d일")}
          </p>
        </>
      ) : (
        <div className="mt-5">
          <h2 id="dday-title" className="text-xl font-semibold">
            {isReady ? "전역일을 입력해 주세요" : "불러오는 중"}
          </h2>
          {isReady && (
            <Link
              href="/settings"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4"
            >
              전역일 설정
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function getDDayLabel(daysRemaining: number): string {
  if (daysRemaining === 0) return "D-DAY";
  return daysRemaining > 0 ? `D-${daysRemaining}` : `D+${Math.abs(daysRemaining)}`;
}