# ETA
## Essential TimeTable for Airforce

공군 병사를 위한 개인용 휴가·외박·일정 관리 웹앱.

> 개인적인 일정 관리와 휴가 기록을 위한 플래너이며, 군 행정 시스템이나 공식 휴가 관리 시스템을 대체하지 않는다.

## 주요 기능

* 전역일 및 D-Day
* 정기휴가 관리
* 포상휴가 개별 관리
* 성과제외박 주기 관리
* 기타 휴가 관리
* 월간 캘린더
* 일반 일정 관리
* 일정 제안 / 거절 / 확정 / 완료
* 휴가와 캘린더 일정 연결
* 휴가 사용량 자동 계산
* 설정값 직접 수정
* JSON 데이터 백업 / 복원
* 모바일 우선 UI

---

## 기본 휴가 설정

앱 최초 설정에는 다음 값을 기본값으로 사용한다.

| 항목         |   기본값 | 수정 가능 |
| ---------- | ----: | ----- |
| 정기휴가       |   28일 | O     |
| 포상휴가 관리 한도 |   18일 | O     |
| 성과제외박 주기   |    6주 | O     |
| 성과제외박      | 2박 3일 | O     |

**중요:** 위 값들은 앱의 초기 기본값일 뿐이다. 사용자가 실제 본인에게 적용되는 값에 맞게 변경할 수 있어야 한다.

---

# 기술 스택

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* date-fns
* Lucide React
* localStorage
* GitHub
* Vercel

---

# 저장 방식

MVP에서는 서버 DB를 사용하지 않는다.

```text
Browser
  ↓
localStorage
  ↓
airplanner-data
```

데이터 백업이 필요한 경우 JSON으로 내보낼 수 있다.

```text
Export JSON
    ↓
airplanner-backup-YYYY-MM-DD.json
```

필요할 경우 다시 JSON을 가져올 수 있다.

---

# 프로젝트 구조

```text
app/
├── layout.tsx
├── page.tsx
├── calendar/
│   └── page.tsx
├── leave/
│   └── page.tsx
└── settings/
    └── page.tsx

components/
├── calendar/
├── dashboard/
├── events/
├── leave/
└── ui/

lib/
├── date.ts
├── discharge.ts
├── event.ts
├── leave.ts
├── storage.ts
└── validation.ts

data/
└── defaults.ts

types/
└── index.ts
```

---

# 실행

```bash
npm install
npm run dev
```

브라우저:

```text
http://localhost:3000
```

---

# 개발 원칙

## 1. 모바일 우선

스마트폰에서 가장 편하게 사용할 수 있어야 한다.

## 2. 단순하게

MVP에서는 다음을 사용하지 않는다.

* 로그인
* 회원가입
* DB
* 실시간 동기화
* 채팅
* 결제
* 푸시 알림
* 군 시스템 연동

## 3. 자동 계산 + 수동 수정

자동 계산을 제공하되 사용자가 실제 상황에 맞게 수정할 수 있어야 한다.

예:

```text
정기휴가 기본값: 28일

사용자가 실제 부여량을 30일로 변경

→ 총 휴가 = 30일
→ 잔여량 = 30 - 사용량
```

## 4. 데이터 일관성

휴가와 연결된 일정을 수정하거나 삭제하면 휴가 사용량도 함께 갱신한다.

## 5. 날짜

날짜만 필요한 데이터는 `YYYY-MM-DD` 문자열을 사용한다.

예:

```text
2026-10-15
```

날짜 계산은 `date-fns`를 사용한다.

---

# 데이터 모델

```ts
interface UserSettings {
  serviceStartDate?: string;
  dischargeDate: string;

  regularLeaveDays: number;
  rewardLeaveLimit: number;

  performanceOvernightCycleWeeks: number;
  performanceOvernightNights: number;
  performanceOvernightDays: number;
  performanceOvernightBaseDate?: string;
}

interface Leave {
  id: string;
  category: "REGULAR" | "OTHER";
  name: string;
  grantedDays: number;
  usedDays: number;
  grantedAt: string;
  memo?: string;
}

interface RewardLeave {
  id: string;
  name: string;
  grantedDays: number;
  usedDays: number;
  grantedAt: string;
  memo?: string;
}

interface PerformanceOvernight {
  id: string;
  availableFrom: string;
  cycleWeeks: number;
  durationNights: number;
  durationDays: number;
  used: boolean;
  eventId?: string;
  memo?: string;
}

interface Event {
  id: string;
  title: string;

  type:
    | "GENERAL"
    | "LEAVE"
    | "OUTING"
    | "OVERNIGHT"
    | "PROPOSAL";

  status:
    | "PROPOSED"
    | "REJECTED"
    | "CONFIRMED"
    | "COMPLETED";

  startDate: string;
  endDate: string;

  leaveId?: string;
  rewardLeaveId?: string;
  overnightId?: string;

  proposer?: string;
  description?: string;

  createdAt: string;
  updatedAt: string;
}

interface AppData {
  settings: UserSettings;
  leaves: Leave[];
  rewardLeaves: RewardLeave[];
  performanceOvernights: PerformanceOvernight[];
  events: Event[];
}
```

---

# 기본값

```ts
const DEFAULT_SETTINGS: UserSettings = {
  serviceStartDate: "",
  dischargeDate: "",

  regularLeaveDays: 28,
  rewardLeaveLimit: 18,

  performanceOvernightCycleWeeks: 6,
  performanceOvernightNights: 2,
  performanceOvernightDays: 3,

  performanceOvernightBaseDate: "",
};
```

---

# D-Day

```text
전역일까지 남은 날
```

예:

```text
D-183
```

전역일:

```text
D-DAY
```

전역일 이후:

```text
D+1
```

---

# 휴가

## 정기휴가

기본:

```text
28일
```

하지만 사용자가 수정할 수 있다.

## 포상휴가

각 포상을 개별적으로 기록한다.

예:

```text
체력검정 포상 2일
특별 포상 3일
대회 포상 2일
```

## 성과제외박

기본:

```text
6주 주기
2박 3일
```

기준일을 이용해 다음 사용 가능일을 계산한다.

## 기타

사용자가 직접 휴가 종류와 일수를 입력한다.

---

# Git Branch 전략

```text
main
```

항상 정상적으로 실행되어야 한다.

기능 개발:

```text
feature/project-setup
feature/data-layer
feature/service-dday
feature/leave-management
feature/performance-overnight
feature/calendar
feature/event-management
feature/backup-restore
feature/polish-and-vercel
```

각 branch에서 작업 완료 후 Pull Request를 생성하고 `main`에 merge한다.

---

# 완료 기준

MVP는 다음이 모두 동작하면 완료다.

* [ ] 전역일 입력
* [ ] D-Day 계산
* [ ] 전역일 수정
* [ ] 정기휴가 관리
* [ ] 포상휴가 관리
* [ ] 성과제외박 계산
* [ ] 모든 기본값 수정 가능
* [ ] 캘린더
* [ ] 일정 CRUD
* [ ] 일정 상태 관리
* [ ] 일정 제안자 관리
* [ ] 휴가와 일정 연결
* [ ] 사용량 자동 계산
* [ ] JSON 백업
* [ ] JSON 복원
* [ ] 모바일 UI
* [ ] Vercel 배포
