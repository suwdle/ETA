"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, Settings, Umbrella } from "lucide-react";

const navigationItems = [
  { href: "/", label: "홈", icon: House },
  { href: "/calendar", label: "캘린더", icon: CalendarDays },
  { href: "/leave", label: "휴가", icon: Umbrella },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-border/90 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <nav aria-label="주요 메뉴" className="mx-auto grid h-16 max-w-3xl grid-cols-4 px-2">
        {navigationItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ring ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon aria-hidden="true" className="size-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}