"use client";

import { useAppData } from "@/hooks/use-app-data";
import { DDayCard } from "@/components/dashboard/dday-card";

export default function Home() {
  const { data, isReady } = useAppData();

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
    </div>
  );
}
