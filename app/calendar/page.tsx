import { CalendarDays } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function CalendarPage() {
  return (
    <PagePlaceholder
      icon={CalendarDays}
      eyebrow="SCHEDULE"
      title="캘린더"
      description="월간 일정"
      message="캘린더 화면이 준비 중입니다."
    />
  );
}