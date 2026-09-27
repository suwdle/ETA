import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plane } from "lucide-react";
import { BottomNavigation } from "@/components/bottom-navigation";
import { AppDataProvider } from "@/hooks/use-app-data";
import "./globals.css";

export const metadata: Metadata = {
  title: "ETA | Essential Timetable for Airforce",
  description: "ETA는 공군 병사를 위한 개인 휴가 및 일정 관리 플래너입니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-svh bg-background text-foreground">
        <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col border-x border-border/70 bg-background">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-5 sm:px-8">
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Plane aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-5">ETA</p>
                <p className="text-xs text-muted-foreground">Essential Timetable for Airforce</p>
              </div>
            </div>
          </header>
          <AppDataProvider>
            <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-28 pt-8 sm:px-8">
              {children}
            </main>
          </AppDataProvider>
          <BottomNavigation />
        </div>
      </body>
    </html>
  );
}
