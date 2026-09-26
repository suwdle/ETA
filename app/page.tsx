import { House } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function Home() {
  return (
    <PagePlaceholder
      icon={House}
      eyebrow="DASHBOARD"
      title="홈"
      description="복무와 개인 일정 요약"
      message="홈 화면이 준비 중입니다."
    />
  );
}
