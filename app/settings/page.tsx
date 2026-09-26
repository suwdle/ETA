import { Settings } from "lucide-react";
import { PagePlaceholder } from "@/components/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      icon={Settings}
      eyebrow="PREFERENCES"
      title="설정"
      description="복무 및 앱 설정"
      message="설정 화면이 준비 중입니다."
    />
  );
}