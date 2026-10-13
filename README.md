# Today Pick (투데이픽)

하이퍼로컬 공익 정보 & 링크픽(LinkPick) 커머스 & 10X 상생 수익 공유 플랫폼

전국 행정동 단위의 로컬 정보(축제/명소/맛집/체험/복지/수리/소상공인)를 GPS와 카카오톡 채널 2개의 경로로 수집하고, 링크픽형 제휴 커머스와 착한소비 나눔 펀딩을 연동하며, 10X(텐엑스) 연계 10단계 추천인 수당 정산 엔진으로 상생 구조를 구현하는 Next.js 기반 플랫폼입니다.

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Cache Components, Turbopack)
- React 19 / TypeScript (strict)
- Tailwind CSS 4
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)

## 핵심 아키텍처

### Phase 1 — 데이터 모델 및 스키마

전국 로컬 피드, 링크픽 커머스, 카카오 간편가입/10단계 추천인 계층의 타입 정의와 목업 시드 데이터.

| 파일 | 설명 |
| --- | --- |
| `types/local.ts` | `Region`(행정동), `LocalPickCategory`, `LocalPost` |
| `types/commerce.ts` | `ProductType`, `LinkPickProduct`, `DonationCampaign`, `DonationCompletedReport` |
| `types/auth.ts` | `UserProfile`(10단계 `pathHierarchy`, 동의 항목), `CommissionLedgerEntry` |
| `lib/db/mockSeed.ts` | 서울 노원구 상계동 / 전남 여수시 돌산읍 기반 목업 데이터 |
| `lib/db/store.ts` | 인메모리 조회/적재/정산 로직 (목업 DB 레이어) |

### Phase 2 — GPS / 카카오톡 2-트랙 로컬 피드

- **2-트랙 수집**: 모바일 웹 직접등록(`mobile_web`)과 카카오톡 채널 제보(`kakao_channel`) 두 경로로 동일한 피드에 적재
- **자동 블라인드**: 신고(`reportCount`) 누적 3회 도달 시 `isBlinded: true`로 전환되어 피드에서 즉시 제외
- **금칙어 1차 필터링**: 성인/대출/도박 등 기본 금칙어 포함 시 등록 차단 (`lib/moderation.ts`)
- **GPS 역지오코딩**: 좌표 → 최근접 행정동 변환 (Haversine 거리 계산, `lib/geo.ts`)

### Phase 3 — 링크픽형 제휴 커머스 & 착한소비 나눔 펀딩

- **링크픽 상품**: 쿠팡 제휴(`coupang_affiliate`) / 지역 특산물(`local_specialty`) / 복지기기(`welfare_device`) 3종, `priceDisplayMode`(가격노출/최저가버튼/특가버튼) 지원
- **착한소비 펀딩**: 건당 기부 적립금(`donationPerSale`, 예: 반건조 생선 1박스당 3,000원)이 지역 펀딩 캠페인의 `currentAmount`에 누적
- **목표 달성 자동화**: `targetAmount` 도달 시 `isAchieved` 플래그 전환과 함께 설치 예정 알림(`installNotice`) 생성
- **투명 설치 인증 리포트**: 기부 집행 완료 현장(리포트 번호, 설치일자, 협회 대리점 바이라인)을 캠페인별로 투명하게 공개

### Phase 4 — 10X 연계 10단계 수당 정산 엔진 & 5대 전문직 DB

- **카카오 간편가입 & 추천인 트리**: 가입 시 입력한 `referrerCode` 소유자를 조회해 그 상위 추천인 배열(`pathHierarchy`)에 자신을 이어 붙여 최대 10단계까지 자동 생성
- **10단계 수당 분배**: 실적 발생자의 `pathHierarchy`를 역순으로 추적하여 1~10단계 추천인 각각에게 실적 금액의 2%를 '10X 상생 기여 포인트'로 적립
- **추천 조직도 대시보드**: 산하 조직 규모, 누적 포인트, 단계(1~10)별 기여 내역 조회
- **5대 전문직 리드 DB**: 보험/자동차/부동산/결혼정보/정책자금 제휴 리드 동의(`thirdPartyFinancialLead`) 완료 회원을 지역/연령 조건으로 추출 (관리자용)

> ⚠️ **컴플라이언스 참고**: 현재 `POST /api/auth/register`는 `thirdPartyFinancialLead` 동의가 `false`이면 가입 자체를 차단하도록 구현되어 있습니다. 서비스 이용에 필수가 아닌 제3자 데이터 제공 동의를 필수 동의로 묶는 것은 개인정보보호법상 문제 소지가 있어, 실제 운영 전 법률 검토가 필요합니다. 또한 `GET /api/admin/leads`는 현재 별도 인증/인가 없이 접근 가능하므로 운영 전 접근 제어가 반드시 추가되어야 합니다.

## API 엔드포인트

### 로컬 피드 (Phase 2)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/feed` | 동네별 로컬 피드 조회 (`sido`, `gugun`, `dong`, `category` 쿼리 지원, 블라인드 글 제외) |
| `POST` | `/api/feed` | 모바일 웹 간편 등록 (금칙어 필터링, `sourceChannel: mobile_web` 자동 태깅) |
| `POST` | `/api/feed/kakao-webhook` | 카카오 i 오픈빌더 스킬 서버 웹훅 수신, 이미지/지역 파싱 후 피드 자동 적재 |
| `POST` | `/api/feed/[id]/report` | 주민 신고 접수 (`reportCount` 증가, 3회 도달 시 자동 블라인드) |
| `GET` | `/api/location/reverse-geocode` | GPS 좌표(`lat`, `lng`) → 최근접 행정동 변환 |

### 커머스 & 펀딩 (Phase 3)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `GET` | `/api/commerce/products` | 링크픽 상품 목록 조회 (`type`, `sellerId` 필터) |
| `POST` | `/api/commerce/products` | 내 링크에 상품 담기(등록) |
| `GET` | `/api/commerce/funding` | 진행 중인 착한소비 펀딩 캠페인 및 달성률 조회 |
| `POST` | `/api/commerce/funding` | 가상 구매/적립 트리거 (`donationPerSale` 누적, 목표 달성 시 설치 알림 생성) |
| `GET` | `/api/commerce/funding/reports` | 투명 설치 인증 리포트 조회 |

### 인증 & 10X 수당 (Phase 4)

| Method | Endpoint | 설명 |
| --- | --- | --- |
| `POST` | `/api/auth/register` | 카카오 간편가입 및 추천인 코드 기반 10단계 `pathHierarchy` 생성 |
| `POST` | `/api/mlm/commission/distribute` | 실적 발생 시 10단계 추천인에게 각 2% 수당 자동 배분 |
| `GET` | `/api/mlm/commission/[userId]` | 추천 조직도, 누적 수당, 단계별 기여 내역 대시보드 조회 |
| `GET` | `/api/admin/leads` | 5대 전문직 제휴 리드 동의 완료 회원 추출 (지역/연령 필터, 관리자용) |

## 로컬 실행 및 빌드

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 앱 실행
npm run start

# 타입 정합성 검증
npx tsc --noEmit

# 린트
npm run lint
```

```

## Today. & t.note 핵심 모듈 (Core OS)

1. **카카오 1초 간편 로그인 (Kakao OAuth & Supabase Auth)**
   - `lib/auth/kakaoAuth.ts`, `app/auth/callback/route.ts`
   - Pure White 모듈러 카드 모달 (`components/auth/KakaoLoginModal.tsx`)
   - `profiles` 테이블 자동 sync/upsert, 메인 헤더 및 워크스페이스 프로필 연동
2. **티노트(t.note) & 티단노트(t.단노트) 구글 캘린더 동기화**
   - `lib/calendar/googleCalendar.ts`, `app/api/auth/google/`
   - 개인/단지 듀얼 워크스페이스 (`app/workspace/page.tsx`)
   - 원클릭 구글 캘린더 실시간 일정 생성 및 연동 토큰 관리
3. **취급제품 쇼룸 및 최고관리자 노출 제어 바**
   - `app/products/page.tsx`, `components/products/`
   - 원클릭 공개/비공개 토글, 파트너 최소 등급 및 공급 카테고리 실시간 제어
4. **한글 행정동 URL 라우팅 및 스마트 검색**
   - `app/[dong]/page.tsx`, `components/home/DistrictSearchBar.tsx`
   - 행정동명 직접 접근 (`today.or.kr/[동이름]`) 및 지역별 고시 우선 정렬
5. **아파트링크 입주민 인증 이벤트 게이트**
   - `components/apt/ResidentVerifyModal.tsx`, `app/api/resident-verify/`
   - 아파트아이 앱 캡처 및 관리비 고지서 사진 검증

---

## Vercel 배포 환경변수 체크리스트

Vercel 대시보드 (`Settings` -> `Environment Variables`)에 아래 변수들을 등록합니다:

| 환경변수 키 | 필수 여부 | 설명 |
| --- | :---: | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | **필수** | Supabase 프로젝트 URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **필수** | Supabase Anon/Public API Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | Supabase Service Role Key (서버측 관리자용) |
| `KAKAO_CLIENT_ID` | **필수** | 카카오 REST API 키 (카카오 로그인 및 OAuth 연동) |
| `KAKAO_CLIENT_SECRET` | 선택 | 카카오 Client Secret |
| `GOOGLE_CLIENT_ID` | **필수** | 구글 Cloud OAuth 2.0 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | **필수** | 구글 Cloud OAuth 2.0 클라이언트 보안 비밀 |
| `NEXT_PUBLIC_BASE_URL` | 선택 | 프로덕션 도메인 URL (`https://today.or.kr`) |
