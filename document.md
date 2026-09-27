# 공군 병사 휴가·일정 관리 웹앱

## 통합 개발 명세서 v1.0

---

## 1. 프로젝트 개요

### 1.1 목적

대한민국 공군 병사가 자신의 복무 기간, 휴가, 외박, 일정 및 주변 사람들과의 일정 제안을 간단하게 관리할 수 있는 **모바일 우선 개인용 웹앱**을 개발한다.

핵심 목적은 다음과 같다.

* 전역일까지 남은 날짜 확인
* 정기휴가/포상휴가 잔여일 관리
* 성과제외박 주기 및 사용 여부 관리
* 휴가/외박을 캘린더에 등록
* 일반 일정 등록
* 다른 사람이 제안한 일정 관리
* 일정 상태 관리
* 모든 주요 군 관련 수치를 **자동 계산하면서도 사용자가 직접 변경 가능**
* 서버/회원가입 없이 개인이 빠르게 사용할 수 있도록 구현

---

# 2. 핵심 설계 원칙

### 2.1 모바일 우선

주 사용 환경을 스마트폰으로 가정한다.

* 모바일 화면을 최우선으로 설계
* PC에서도 정상 사용 가능
* 하단 탭 또는 간단한 네비게이션 사용
* 터치하기 쉬운 버튼 크기
* 복잡한 테이블 최소화

### 2.2 개인용

MVP에서는 로그인과 회원가입을 구현하지 않는다.

* 사용자 1명이 자신의 기기에서 사용
* 다른 사람을 계정으로 관리하지 않음
* 일정 제안 시 이름을 직접 입력하여 구분

예:

* 엄마
* 친구 민수
* 여자친구
* 동기 철수

### 2.3 자동 계산 + 수동 변경

**자동 계산을 기본값으로 제공하되, 사용자가 언제든 수정할 수 있어야 한다.**

예:

```text
정기휴가 기본값: 28일
→ 사용자가 28일 그대로 사용

또는

정기휴가 실제 부여량: 30일
→ 사용자가 30일로 변경
```

같은 방식으로 다음 항목도 수정 가능해야 한다.

* 정기휴가 총일수
* 포상휴가 최대/관리 한도
* 성과제외박 주기
* 성과제외박 기간
* 성과제외박 기준일
* 전역일
* 기타 휴가 일수

앱은 군 행정 시스템의 공식 계산 결과를 대신하는 것이 아니라 **사용자가 입력한 실제 정보를 기준으로 계산하는 개인 일정 관리 도구**다.

---

# 3. 기술 스택

## 3.1 필수 기술

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* date-fns
* Lucide React

## 3.2 배포

* GitHub
* Vercel

구조:

```text
Local Development
      ↓
GitHub Repository
      ↓
Vercel
      ↓
Web App
```

GitHub의 main 브랜치에 push하면 Vercel에서 자동 배포되도록 구성한다.

Pull Request 생성 시 Vercel Preview Deployment를 사용할 수 있도록 한다.

---

# 4. 데이터 저장 방식

## 4.1 MVP

DB를 사용하지 않는다.

브라우저의 `localStorage`를 사용한다.

```text
Browser
└── localStorage
    └── airplanner-data
```

### 장점

* 서버 구축 불필요
* 로그인 불필요
* 구현이 매우 간단
* 개인용으로 충분
* Vercel에서 별도의 백엔드 없이 사용 가능

---

## 4.2 데이터 백업

설정 화면에서 다음 기능을 제공한다.

### JSON 내보내기

현재 데이터를 JSON 파일로 다운로드한다.

예:

```text
eta-backup-2026-09-26.json
```

### JSON 가져오기

백업한 JSON 파일을 다시 불러온다.

가져오기 전에:

```text
현재 데이터를 덮어쓸까요?

[취소] [가져오기]
```

확인창을 표시한다.

---

## 4.3 중요

Vercel의 서버 파일 시스템에 JSON을 저장하는 방식은 사용하지 않는다.

MVP에서는:

```text
localStorage
+
JSON Backup/Restore
```

방식을 사용한다.

추후 여러 기기 동기화가 필요해질 경우 Supabase 등의 DB를 추가하는 것을 Phase 2로 고려한다.

---

# 5. 주요 화면

앱은 크게 다음 화면으로 구성한다.

```text
홈
캘린더
휴가/외박
일정
설정
```

---

# 6. 홈 화면

앱 실행 시 가장 먼저 표시되는 화면.

## 6.1 전역 D-Day

가장 크게 표시한다.

예:

```text
전역까지

D-183

2027년 3월 28일
```

전역일이 지나면:

```text
전역일

D+3
```

형태로 표시한다.

---

## 6.2 휴가 요약

```text
정기휴가
28일 중 10일 사용
잔여 18일

포상휴가
8일 사용 가능
총 부여 8일

성과제외박
다음 사용 가능
10월 15일
```

---

## 6.3 오늘 일정

오늘 등록된 일정을 표시한다.

예:

```text
오늘

09:00
일과

18:00
친구 만나기

20:00
복귀
```

---

## 6.4 빠른 추가

홈에서 바로 다음 항목을 추가할 수 있도록 한다.

```text
+ 일정
+ 휴가
+ 포상휴가
+ 외박
```

---

# 7. 캘린더

핵심 기능이다.

## 7.1 기본 기능

월간 캘린더를 기본으로 한다.

예:

```text
2026년 10월

일 월 화 수 목 금 토
          1  2  3
4  5  6  7  8  9 10
...
```

날짜를 누르면 해당 날짜의 일정을 표시한다.

---

## 7.2 일정 표시

일정의 상태와 종류를 색상/아이콘으로 구분한다.

예:

```text
10/15
🎖 성과제외박 가능일

10/20
🏖 정기휴가

10/25
📅 친구 약속
```

색상 자체에 의미를 과도하게 의존하지 않고 아이콘/텍스트도 함께 사용한다.

성과제외박 주기상 사용 가능일은 실제 외박 일정과 별도의 표시로 캘린더에 나타낸다.

---

# 8. 일정 관리

## 8.1 일정 생성

필드:

```ts
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
  overnightId?: string;

  proposer?: string;

  description?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

## 8.2 일정 상태

일정은 다음 4가지 상태를 가진다.

```text
제안
거절
확정
완료
```

### 제안

아직 확정되지 않은 일정.

### 거절

일정으로 채택하지 않은 경우.

### 확정

실제로 진행하기로 결정한 일정.

### 완료

실제로 진행한 일정.

---

## 8.3 일정 제안

로그인이나 친구 시스템 없이 다음과 같이 등록한다.

```text
제안자
[친구 민수]

일정
[10월 20일 저녁 식사]

상태
[제안]
```

다른 사람의 일정도 자유롭게 등록할 수 있다.

---

# 9. 휴가/외박 관리

휴가와 외박은 하나의 화면에서 관리한다.

```text
휴가 / 외박

정기휴가
잔여 18일

포상휴가
잔여 8일

성과제외박
다음 사용 가능일
10월 15일
```

---

# 10. 정기휴가

## 10.1 기본값

앱 최초 설정 시:

```text
정기휴가 = 28일
```

을 기본값으로 제공한다.

단, **28일을 고정값으로 취급하지 않는다.**

---

## 10.2 사용자가 수정 가능

설정 화면:

```text
정기휴가 총일수

[ 28 ] 일

        [저장]
```

사용자가 실제 부여받은 일수에 맞게 변경할 수 있다.

예:

```text
28 → 30
```

변경하면 자동으로 잔여일을 다시 계산한다.

---

## 10.3 사용

정기휴가를 일정에 연결할 수 있다.

예:

```text
10월 20일 ~ 10월 23일

정기휴가
4일 사용
```

휴가 등록 시:

```text
휴가 종류
[정기휴가 ▼]

사용 일수
[4일]
```

등록하면 정기휴가 사용량에 반영한다.

---

# 11. 포상휴가

## 11.1 기본값

포상휴가 관리 한도의 기본값:

```text
18일
```

단, 이것 역시 고정값이 아니다.

---

## 11.2 포상휴가는 개별 지급 기록으로 관리

포상휴가는 하나의 숫자만 저장하지 않는다.

각 포상을 별도로 기록한다.

예:

```text
포상휴가

체력검정 포상
2일

특별 포상
3일

대회 포상
2일
```

데이터 구조:

```ts
interface RewardLeave {
  id: string;
  name: string;
  grantedDays: number;
  usedDays: number;
  grantedAt: string;
  memo?: string;
}
```

---

## 11.3 포상휴가 추가

```text
+ 포상휴가 추가

포상명
[체력검정 포상]

부여일수
[2] 일

부여일
[2026-10-01]

메모
[ ]
```

저장한다.

---

## 11.4 포상휴가 사용

일정 추가 시:

```text
휴가 종류
[포상휴가]

어떤 포상?
[체력검정 포상 ▼]

사용 일수
[2]
```

사용한 만큼 해당 포상의 잔여량이 감소한다.

---

## 11.5 포상휴가 최대 관리값

설정에서 다음 값을 수정할 수 있다.

```text
포상휴가 관리 한도
[18] 일
```

주의:

이 값은 앱에서 사용하는 **관리용 기준값**이며, 실제 군 행정상의 법적/행정적 한도를 앱이 보증하는 것으로 해석하지 않는다.

---

# 12. 성과제외박

성과제외박은 일반적인 “휴가 일수”와 다르게 관리한다.

사용자가 제공한 기본값:

```text
주기: 6주
기간: 2박 3일
```

---

## 12.1 기본 설정

```text
성과제외박 주기
[6] 주

숙박
[2] 박

표시 기간
[3] 일
```

모두 수정 가능하게 한다.

---

## 12.2 기준일

사용자가 기준일을 입력한다.

```text
성과제외박 기준일
[2026-09-03]
```

앱은 기준일을 기준으로 다음 사용 가능일을 계산한다.

```text
2026-09-03
+
6주

=
2026-10-15
```

---

## 12.3 계산 공식

```ts
nextDate = addWeeks(baseDate, cycleWeeks);
```

기본값:

```ts
cycleWeeks = 6;
durationNights = 2;
durationDays = 3;
```

---

## 12.4 사용자가 직접 변경

예:

```text
기준일
2026-09-03

주기
6주

↓

기준일
2026-09-10

주기
5주
```

변경 즉시 다음 예정일을 다시 계산한다.

---

## 12.5 성과제외박 사용

캘린더에서:

```text
+ 외박
```

을 선택한다.

```text
종류
[성과제외박]

기간
10/15 ~ 10/17

2박 3일
```

등록하면 해당 성과제외박을 사용 처리한다.

```text
used = true
eventId = 연결된 일정 ID
```

---

## 12.6 캘린더 주기 표시

성과제외박의 주기상 사용 가능일은 실제 사용 여부와 관계없이 월간 캘린더에 반복 표시한다.

첫 표시일은 기준일에 주기를 더한 날짜이며, 이후에도 같은 주기로 표시한다.

```ts
firstAvailableDate = addWeeks(baseDate, cycleWeeks);
nextAvailableDate = addWeeks(previousAvailableDate, cycleWeeks);
```

예를 들어 기준일이 `2026-09-03`, 주기가 6주이면 다음 날짜를 표시한다.

```text
2026-10-15
2026-11-26
2027-01-07
...
```

표시 규칙:

* 주기상 날짜는 `성과제외박 가능일`로 표시하고 실제 사용 일정과 구분한다.
* 주기 표시는 설정의 기준일과 주기로 계산하며 별도의 `Event`로 저장하지 않는다.
* 실제 사용 일정은 사용자가 선택한 날짜 범위에 `성과제외박 사용 일정`으로 표시한다.
* 사용 일정이 주기상 가능일과 다른 날짜여도 주기 표시는 이동하지 않는다.
* 성과제외박을 사용 처리해도 이후 주기상 가능일을 숨기지 않는다.
* 사용 처리 시 다음 주기 기준은 실제 일정 시작일이 아니라 해당 회차의 주기상 가능일을 따른다.
* 주기, 기준일이 변경되면 캘린더의 주기 표시를 다시 계산한다.

# 13. 기타 휴가

사용자가 기본 유형에 포함되지 않는 휴가를 직접 추가할 수 있어야 한다.

예:

```text
기타 휴가

휴가명
[특별휴가]

일수
[2일]
```

데이터 구조:

```ts
type LeaveCategory =
  | "REGULAR"
  | "REWARD"
  | "OTHER";
```

---

# 14. 휴가와 캘린더 연결

휴가를 단순한 숫자로만 관리하지 않는다.

반드시 실제 일정과 연결할 수 있어야 한다.

예:

```text
10월 20일 ~ 10월 23일

정기휴가
4일
```

이 일정은:

```text
Event
   ↓
leaveId
   ↓
Regular Leave
```

형태로 연결한다.

이를 통해:

* 휴가 사용량 자동 계산
* 캘린더 표시
* 휴가 삭제 시 사용량 복구
* 휴가 일정 수정 시 사용량 재계산

이 가능하도록 한다.

---

# 15. 휴가 사용량 계산

## 정기휴가

```text
잔여 = 총 부여량 - 사용량
```

예:

```text
총 28일
사용 10일
잔여 18일
```

---

## 포상휴가

각 포상별로:

```text
잔여 = 부여량 - 사용량
```

전체 포상휴가 잔여량:

```text
각 포상 잔여량의 합
```

---

## 성과제외박

일수 잔액으로 계산하지 않는다.

```text
다음 가능일
+
사용 여부
+
연결된 일정
```

으로 관리한다.

---

# 16. 전역일 및 D-Day

## 16.1 기본 정보

설정에서:

```text
입대일
[YYYY-MM-DD]

전역일
[YYYY-MM-DD]
```

을 입력한다.

전역일을 직접 입력할 수 있도록 한다.

---

## 16.2 D-Day

현재 날짜와 전역일의 차이를 계산한다.

```ts
differenceInCalendarDays(dischargeDate, today)
```

예:

```text
전역일: 2027-03-28
현재: 2026-09-26

D-183
```

전역일 당일:

```text
D-DAY
```

전역일 이후:

```text
D+1
```

---

# 17. 날짜 계산 원칙

날짜 계산에는 `date-fns`를 사용한다.

예:

```ts
addDays()
addWeeks()
differenceInCalendarDays()
isBefore()
isAfter()
isSameDay()
```

시간대 문제를 최소화하기 위해 날짜 데이터는 가능한 한:

```text
YYYY-MM-DD
```

형식으로 저장한다.

예:

```text
2026-10-15
```

시간이 필요한 일정만 별도의 datetime 형식을 사용한다.

---

# 18. 전체 데이터 구조

```ts
interface AppData {
  settings: UserSettings;

  leaves: Leave[];

  rewardLeaves: RewardLeave[];

  performanceOvernights: PerformanceOvernight[];

  events: Event[];
}
```

---

## UserSettings

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
```

---

## Leave

```ts
interface Leave {
  id: string;

  category:
    | "REGULAR"
    | "OTHER";

  name: string;

  grantedDays: number;

  usedDays: number;

  grantedAt: string;

  memo?: string;
}
```

정기휴가는 기본적으로 하나의 관리 항목으로 생성한다.

---

## RewardLeave

```ts
interface RewardLeave {
  id: string;

  name: string;

  grantedDays: number;

  usedDays: number;

  grantedAt: string;

  memo?: string;
}
```

---

## PerformanceOvernight

```ts
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
```

---

## Event

```ts
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
```

---

# 19. 데이터 일관성

휴가 데이터와 일정 데이터가 서로 충돌하지 않도록 한다.

예:

정기휴가가:

```text
총 28일
사용 4일
```

인 상태에서 해당 4일짜리 일정을 삭제하면:

```text
사용 0일
잔여 28일
```

로 복구되어야 한다.

---

## 일정 수정

기존:

```text
10/20 ~ 10/23
4일
```

수정:

```text
10/20 ~ 10/25
6일
```

이면 사용량도:

```text
4 → 6
```

으로 다시 계산한다.

---

## 일정 삭제

휴가와 연결된 일정을 삭제할 경우:

```text
Event 삭제
↓
연결된 휴가 사용량 복구
```

한다.

---

# 20. 잘못된 데이터 방지

다음 상황을 방지한다.

### 휴가 잔여량보다 많이 사용

예:

```text
잔여 2일

사용 5일
```

입력 시:

```text
사용 가능한 휴가가 부족합니다.
```

표시한다.

단, 사용자가 실제 상황을 기록하기 위해 필요한 경우 설정에서 잔여량을 직접 조정할 수 있는 방법을 제공한다.

---

### 음수 방지

일반적인 경우:

```text
grantedDays >= 0
usedDays >= 0
```

을 유지한다.

---

# 21. 설정 화면

설정은 단순한 환경설정이 아니라 **실제 휴가/복무 정보를 수정하는 핵심 화면**으로 사용한다.

구성:

```text
설정

[복무 정보]
입대일
전역일

[정기휴가]
총 부여일수

[포상휴가]
관리 한도

[성과제외박]
주기
숙박일수
표시기간
기준일

[데이터]
백업
복원
전체 초기화
```

---

# 22. 기본값

앱 최초 실행 시 기본값:

```ts
{
  regularLeaveDays: 28,

  rewardLeaveLimit: 18,

  performanceOvernightCycleWeeks: 6,

  performanceOvernightNights: 2,

  performanceOvernightDays: 3
}
```

단, 이 값들은 **사용자가 변경 가능한 초기값**이다.

앱의 코드에서 영구적으로 고정하지 않는다.

---

# 23. 휴가 추가 UX

휴가 버튼을 누르면:

```text
휴가 추가

┌───────────────┐
│ 정기휴가       │
│ 포상휴가       │
│ 기타 휴가      │
└───────────────┘
```

선택한다.

---

## 정기휴가 선택

```text
기간
10/20 ~ 10/23

사용일수
4일

메모
```

---

## 포상휴가 선택

```text
포상 선택
체력검정 포상 ▼

기간
10/20 ~ 10/21

사용일수
2일
```

---

## 기타 휴가

```text
휴가명
[특별휴가]

일수
[2]

기간
10/20 ~ 10/21
```

---

# 24. UI 구성

모바일 기준으로 다음과 같이 구성한다.

```text
┌─────────────────────┐
│ 공군 플래너          │
├─────────────────────┤
│                     │
│       D-183         │
│   2027.03.28 전역   │
│                     │
│ 정기휴가   18일      │
│ 포상휴가    8일      │
│ 외박      10/15      │
│                     │
│ 오늘 일정            │
│ ─────────────────   │
│ 18:00 친구 만나기    │
│                     │
├─────────────────────┤
│ 홈 캘린더 휴가 설정  │
└─────────────────────┘
```

하단 네비게이션:

```text
홈 | 캘린더 | 휴가 | 설정
```

---

# 25. 프로젝트 구조

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
│   ├── Calendar.tsx
│   ├── CalendarDay.tsx
│   └── EventList.tsx
│
├── events/
│   ├── EventForm.tsx
│   ├── EventCard.tsx
│   └── EventStatus.tsx
│
├── leave/
│   ├── LeaveSummary.tsx
│   ├── LeaveForm.tsx
│   ├── RewardLeaveForm.tsx
│   └── PerformanceOvernight.tsx
│
├── dashboard/
│   ├── DDayCard.tsx
│   └── TodayEvents.tsx
│
└── ui/

lib/
├── storage.ts
├── date.ts
├── discharge.ts
├── leave.ts
├── event.ts
└── validation.ts

data/
└── defaults.ts

types/
└── index.ts
```

---

# 26. 핵심 함수

## 전역 D-Day

```ts
calculateDDay(dischargeDate: string): number
```

---

## 휴가 잔여량

```ts
calculateRemainingLeave(
  grantedDays: number,
  usedDays: number
): number
```

---

## 포상휴가 총 잔여량

```ts
calculateRewardLeaveRemaining(
  rewardLeaves: RewardLeave[]
): number
```

---

## 다음 성과제외박

```ts
calculateNextPerformanceOvernight(
  baseDate: string,
  cycleWeeks: number
): string
```

---

## 일정 기간 계산

```ts
calculateDuration(
  startDate: string,
  endDate: string
): number
```

---

# 27. localStorage 관리

`lib/storage.ts`

```ts
const STORAGE_KEY = "airplanner-data";
```

함수:

```ts
loadAppData()
saveAppData(data)
clearAppData()
exportAppData()
importAppData()
```

---

# 28. 상태 관리

별도의 Redux는 사용하지 않는다.

MVP에서는:

* React state
* Context API 또는 간단한 custom hook

정도로 구현한다.

예:

```ts
useAppData()
```

를 만들어 데이터 접근을 통일한다.

---

# 29. 개발 우선순위

## Phase 1 — 기본 구조

* Next.js 프로젝트
* TypeScript
* Tailwind
* shadcn/ui
* 기본 레이아웃
* 모바일 네비게이션

---

## Phase 2 — 데이터

* Type 정의
* localStorage
* 기본값
* 데이터 로드/저장

---

## Phase 3 — 복무 정보

* 입대일
* 전역일
* D-Day
* 수정 기능

---

## Phase 4 — 휴가

* 정기휴가
* 포상휴가
* 기타 휴가
* 잔여량 계산
* 휴가 수정/삭제

---

## Phase 5 — 성과제외박

* 6주 기본 주기
* 2박 3일 기본값
* 기준일
* 다음 가능일 계산
* 수정 가능
* 사용 처리
* 일정 연결

---

## Phase 6 — 캘린더

* 월간 캘린더
* 일정 생성
* 일정 수정
* 일정 삭제
* 휴가 연결

---

## Phase 7 — 일정 제안

* 제안자 입력
* 제안/거절/확정/완료 상태
* 상태 변경

---

## Phase 8 — 백업

* JSON Export
* JSON Import
* 데이터 초기화

---

# 30. MVP에서 제외할 기능

다음 기능은 구현하지 않는다.

* 회원가입
* 로그인
* 친구 시스템
* 서버 DB
* 실시간 동기화
* 채팅
* 푸시 알림
* 결제
* 광고
* 군 행정 시스템 연동
* 군 내부 시스템 접근
* 위치 추적
* 부대 정보 관리
* 복잡한 권한 시스템

목적은 **혼자 사용하는 개인용 플래너를 빠르게 완성하는 것**이다.

---

# 31. 보안 및 개인정보 원칙

가능한 한 군 관련 민감정보를 저장하지 않는다.

저장하지 않는 것을 권장:

* 부대 위치
* 군사시설 위치
* 작전 정보
* 경계/당직 정보
* 군사 기밀
* 상세 보직 정보
* 군 내부 시스템 인증정보

이 앱은 휴가와 개인 일정을 기록하는 도구로 한정한다.

---

# 32. Vercel 배포

GitHub Repository 생성:

```text
eta
```

Vercel에서 GitHub Repository 연결.

```text
GitHub
   ↓ push
Vercel Build
   ↓
Production Deployment
```

기본 branch:

```text
main
```

개발:

```text
feature/*
```

Pull Request:

```text
feature/*
    ↓
Pull Request
    ↓
Vercel Preview
    ↓
확인
    ↓
main merge
```

---

# 33. 완료 기준

다음 항목을 모두 만족하면 MVP 완료로 본다.

### 복무

* [ ] 전역일 입력 가능
* [ ] 전역일 수정 가능
* [ ] D-Day 자동 계산

### 정기휴가

* [ ] 기본값 28일
* [ ] 총일수 수정 가능
* [ ] 사용량 계산
* [ ] 잔여량 계산
* [ ] 일정 연결
* [ ] 일정 삭제 시 복구

### 포상휴가

* [ ] 기본 관리값 18일
* [ ] 관리값 수정 가능
* [ ] 개별 포상 등록
* [ ] 포상별 일수 관리
* [ ] 포상휴가 사용
* [ ] 잔여량 계산

### 성과제외박

* [ ] 기본 주기 6주
* [ ] 기본 2박 3일
* [ ] 주기 수정 가능
* [ ] 기간 수정 가능
* [ ] 기준일 설정
* [ ] 다음 가능일 자동 계산
* [ ] 사용 처리
* [ ] 캘린더 연결

### 일정

* [ ] 일정 추가
* [ ] 일정 수정
* [ ] 일정 삭제
* [ ] 제안
* [ ] 거절
* [ ] 확정
* [ ] 완료
* [ ] 제안자 기록

### 데이터

* [ ] localStorage 저장
* [ ] 자동 저장
* [ ] JSON 백업
* [ ] JSON 복원
* [ ] 전체 초기화

### UI

* [ ] 모바일 최적화
* [ ] PC에서도 사용 가능
* [ ] 터치 UI
* [ ] 직관적인 캘린더
* [ ] 휴가 잔여량을 홈에서 즉시 확인

---

# 34. AI 코딩 에이전트 구현 지침

이 프로젝트를 구현하는 AI 코딩 에이전트는 다음 원칙을 따른다.

1. **MVP 범위를 임의로 확장하지 않는다.**
2. DB를 추가하지 않는다.
3. 인증 시스템을 추가하지 않는다.
4. 모든 휴가 관련 기본값은 사용자가 수정할 수 있게 한다.
5. 계산 결과와 저장된 실제 데이터를 구분한다.
6. 휴가 일정과 휴가 사용량의 데이터 일관성을 유지한다.
7. 삭제/수정 시 관련 사용량을 정확하게 되돌리거나 재계산한다.
8. 날짜 계산은 `date-fns`를 사용한다.
9. TypeScript strict mode를 사용한다.
10. 모바일 화면을 우선 구현한다.
11. 복잡한 상태관리 라이브러리를 사용하지 않는다.
12. 군 행정 규정을 코드에 하드코딩하여 공식적인 권리/의무를 보장하는 것처럼 만들지 않는다.
13. 기본값은 사용자의 초기 설정을 돕기 위한 값이며 수정 가능해야 한다.
14. 모든 주요 데이터는 JSON으로 직렬화 가능해야 한다.
15. 새 라이브러리를 추가하기 전에 기존 라이브러리로 구현 가능한지 확인한다.

---

# 35. 최종 제품 정의

이 프로젝트의 최종 형태는 다음과 같다.

```text
                    공군 플래너
                         │
        ┌────────────────┼────────────────┐
        │                │                │
      복무              휴가             일정
        │                │                │
     전역일          정기휴가          일반 일정
     D-Day           포상휴가          일정 제안
                     성과제외박         상태 관리
                     기타 휴가
        │                │                │
        └────────────────┼────────────────┘
                         │
                       캘린더
                         │
                     localStorage
                         │
                   JSON Backup
                         │
                      GitHub
                         │
                      Vercel
```

핵심은 **“자동으로 계산해 주지만, 실제 상황과 다르면 사용자가 직접 수정할 수 있는 개인용 공군 일정/휴가 플래너”**로 정의한다.
