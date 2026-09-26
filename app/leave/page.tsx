import { Umbrella } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function LeavePage() {
  return (
    <PagePlaceholder
      icon={Umbrella}
      eyebrow="TIME OFF"
      title="휴가"
      description="휴가 및 외박 기록"
      message="휴가 관리 화면이 준비 중입니다."
    />
  );
}