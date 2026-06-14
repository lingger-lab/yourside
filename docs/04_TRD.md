# 곁에(yourside) — 기술 요구사항 문서 (TRD)

> **문서 버전**: 1.0 (마스터 v3.1 기반)
> **선행 문서**: `01_PRD.md`, `02_ARCHITECTURE.md`, `03_DB.md`
> **목적**: API 명세, 외부 연동, 보안·성능 등 기술적 구현 기준을 정의한다.

---

## 1. API 명세 (Next.js API Routes)

> 모든 응답 JSON. 인증은 Supabase 세션(쿠키) 기반. 관리자 전용은 service_role 또는 관리자 권한 체크.

### 1.1 의뢰 (사장님)
| 메서드 | 경로 | 설명 | 권한 |
|---|---|---|---|
| POST | `/api/requests` | 의뢰 등록(자유 서술) | 사장님 |
| GET | `/api/requests/:id` | 의뢰 현황 조회(진행 단계) | 본인 사장님 |
| GET | `/api/requests` | 내 의뢰 목록 | 본인 사장님 |

### 1.2 매칭 (관리자)
| 메서드 | 경로 | 설명 | 권한 |
|---|---|---|---|
| GET | `/api/matching/candidates?request_id=` | 키워드 추천 후보(적합도순) | 관리자 |
| POST | `/api/matching` | 파트너 선택→매칭 생성 | 관리자 |
| PATCH | `/api/matching/:id` | 파트너 수락/거절 반영 | 관리자/파트너 |

### 1.3 거래·견적
| 메서드 | 경로 | 설명 | 권한 |
|---|---|---|---|
| POST | `/api/deals` | 견적 책정(작업료 입력→매칭피 자동) | 관리자 |
| GET | `/api/deals/:id` | 견적/거래 조회 | 관련자 |
| PATCH | `/api/deals/:id/approve` | 사장님 승인 | 사장님 |
| POST | `/api/deals/:id/submit` | 파트너 결과물 제출 | 파트너 |
| PATCH | `/api/deals/:id/confirm` | 사장님 검수 완료 | 사장님 |
| GET | `/api/deals/:id/workflow` | 공통 5단계 진행 조회 | 관련자 |
| PATCH | `/api/deals/:id/workflow/:step` | 단계 상태 갱신(pending/in_progress/done) | 파트너 |

### 1.4 결제·정산
| 메서드 | 경로 | 설명 | 권한 |
|---|---|---|---|
| POST | `/api/payments/checkout` | 토스 결제위젯 세션 생성(에스크로 선입금) | 사장님 |
| POST | `/api/payments/webhook` | 토스 입금 확인 webhook | 토스(서명검증) |
| POST | `/api/settlements/:id/release` | **정산 실행(파트너 전달)** | 관리자만 |
| POST | `/api/settlements/:id/refund` | **사고·분쟁 환불(책임 적립금 충당)** | 관리자만 |
| GET | `/api/settlements/:id` | 정산 상태 조회 | 관련자 |
| GET | `/api/admin/guarantee-fund` | 책임 적립금 잔액·원장 조회 | 관리자만 |

### 1.5 평가 (곁에 검토진)
| 메서드 | 경로 | 설명 | 권한 |
|---|---|---|---|
| POST | `/api/reviews` | 곁에 검토 입력(별점·의견·내부기록) | 관리자 |
| POST | `/api/reviews/note` | 사장님/파트너 선택적 전할말 | 사장님/파트너 |

### 1.6 챗봇·문의
| 메서드 | 경로 | 설명 | 권한 |
|---|---|---|---|
| POST | `/api/chat` | 질문→FAQ 응답(또는 모듈 연동) | 공통 |
| POST | `/api/inquiry` | 못 푼 문의 기록(에스컬레이션) | 공통 |

### 1.7 문서 (PDF)
| 메서드 | 경로 | 설명 | 권한 |
|---|---|---|---|
| GET | `/api/docs/quote/:dealId` | 견적서 PDF(작업료·매칭비 분리) | 관련자 |
| GET | `/api/docs/statement/:dealId` | 거래명세서 PDF | 관련자 |

---

## 2. 견적 계산 로직 (`lib/pricing.ts`)

```ts
// 입력: 작업료(원). 출력: 매칭피·총액
function calcMatchFee(workFee: number): { matchFee: number; allowed: boolean } {
  if (workFee < 30000) return { matchFee: 0, allowed: false };       // 거래 불가
  if (workFee < 100000) return { matchFee: Math.max(Math.round(workFee*0.20), 10000), allowed: true };
  if (workFee < 300000) return { matchFee: Math.round(workFee*0.15), allowed: true };
  if (workFee < 500000) return { matchFee: 50000, allowed: true };
  if (workFee < 800000) return { matchFee: 70000, allowed: true };
  if (workFee < 3000000) return { matchFee: Math.round(workFee*0.07), allowed: true };
  return { matchFee: Math.round(workFee*0.05), allowed: true };       // 300만 초과 5%
}
// 총액 = workFee + matchFee (VAT 별도). 사장님엔 총액만, 서류엔 분리 표기.
```

### 2.1 곁에 책임 적립금 (`lib/pricing.ts`)
```ts
// 매칭피의 일부를 곁에 책임 적립금으로 적립 (기본 10%, 환경변수로 조정)
const GUARANTEE_RATE = Number(process.env.GUARANTEE_RATE ?? 0.10);
function calcReserveFee(matchFee: number): number {
  return Math.round(matchFee * GUARANTEE_RATE);
}
// 정산 시: settlement.guarantee_fee 저장 + 원장에 'accrue' 기록.
// 사고 시: 'payout' 기록 + settlement.refunded_amt 갱신.
// ※ 외부 보험사 아닌 내부 적립금. 곁에 매칭피 수입의 일부라 사장님·파트너 부담 증가 없음.
// ⚠️ 별도 계좌 보관. 에스크로 자금(작업료+매칭피, 파트너에게 갈 돈) 및 운영비와 분리.
```

---

## 3. 키워드 매칭 로직 (`lib/matching.ts`)

- 입력: request.title + request.detail
- 처리: 형태소/공백 분리 → partner.field + 소개 텍스트와 키워드 교집합 점수
- 출력: 점수 내림차순 파트너 후보(상위 N) + 적합도(%) 표시용
- **임베딩·외부 AI 호출 없음**. 순수 텍스트 매칭(MVP). 관리자 보조용, 고객 비노출.
- 향후: 손매칭 결과를 학습 데이터로 축적(별도 테이블/로그) → 추후 고도화.

## 3.5 공통 워크플로우 진행 (수준 1 최소)

- deal 생성(파트너 수락) 시 `deal_workflow`에 공통 5단계(intake·structure·generate·verify·deliver) 행을 자동 생성(모두 status='pending').
- 파트너가 작업현황에서 각 단계를 'in_progress'→'done'으로 갱신. PATCH /api/deals/:id/workflow/:step.
- 관리자 대시보드 '진행 중'에서 단계별 상태 조회.
- ⚠️ MVP는 도메인 구분 없는 공통 뼈대 1개. 단계별 AI 도구 임베드·도메인 설정은 Phase 2(수준 2). 즉 MVP는 '체크리스트 + 진행 추적'까지만.
- 검수(deal confirm)와의 관계: deliver 단계 done → 결과물 제출 → 사장님 검수 흐름과 연결.

---

## 4. 인증 (Supabase Auth)

- 소셜 로그인: 구글·카카오·네이버. `signInWithOAuth`.
- 콜백: `/auth/callback`에서 세션 수립 → `auth.users` 확인 → `client`/`partner` 레코드 없으면 생성(이메일·provider 복사).
- **역할 구분**: 가입 시 사장님/파트너 선택(랜딩 두 갈래). 한 계정이 양쪽이면 별도 처리(MVP는 단일 역할 가정).
- 관리자(3인): 별도 관리자 플래그 또는 허용 이메일 화이트리스트로 식별.

### 4.1 카카오·네이버 주의 (사전 작업 필요)
- **카카오**: 비즈앱 전환 + (이름·연락처 수집 시) 카카오싱크 신청. 사업자등록정보(엔터랩스) 필요. Redirect URI에 Supabase 콜백 등록.
- **네이버**: 네이버 개발자센터 앱 등록, Callback URL 등록.
- **구글**: GCP OAuth 동의화면·클라이언트 ID, Redirect URI 등록.
- 이 작업은 코드가 아닌 **외부 콘솔 설정**이므로 TASKS에 별도 작업으로 포함.

---

## 5. 결제 연동 (토스페이먼츠)

- **결제위젯** 방식. ₩3,800 같은 소액~수백만원 거래 모두 커버.
- 흐름: 사장님 승인 → checkout 세션 → 결제위젯 → 성공 시 redirect + webhook.
- **webhook 서명 검증** 필수(위조 방지).
- 입금 확인 → `settlement.escrow_status = deposited`, `payment_key` 저장.
- **에스크로 보관**: 곁에가 보관 상태로 유지. 정산 실행(release)은 관리자 버튼 → 파트너 전달.
- 환불(refund): 분쟁 시 관리자 처리 → `escrow_status = refunded`.
- **곁에 책임 적립금**: 정산 실행(release) 시 매칭피의 일부(기본 10%)를 원장에 'accrue' 적립. 파트너 귀책 사고 시 `/refund`로 적립금에서 'payout' 충당 → 사장님 환불·재매칭 비용. 외부 보험 아닌 곁에 내부 적립금이라 사장님·파트너 추가 부담 없음.
- ⚠️ **자금 분리 원칙**: ① 에스크로 자금(작업료+매칭피, 파트너에게 갈 돈)은 토스페이먼츠/별도 계좌로 분리해 곁에가 함부로 못 씀. ② 책임 적립금(곁에 수입 일부)도 운영비와 별도 계좌 구분해 사고 시 실제 가용. ③ 성장기엔 외부 보증보험(이행·신원보증) 전환 검토.
- Stripe 미사용(한국 법인·소액 부적합). 토스페이먼츠 확정.

---

## 6. RAG·챗봇 모듈 연동 인터페이스 (외부, 김동현 대표 관리)

> **MVP 1단계는 FAQ 14개 정적 응답으로 구현**. 아래는 2단계 연동 계약(모듈 완성 시 확정). 곁에는 인터페이스만 정의, 내부 구현 비의존.

### 6.1 요청 (곁에 → 모듈)
```json
POST {MODULE_URL}/chat
{
  "question": "수수료가 어떻게 되나요?",
  "context": {
    "user_type": "client|partner",
    "user_id": "uuid (optional)",
    "deal_id": "uuid (optional)"
  }
}
```

### 6.2 응답 (모듈 → 곁에)
```json
{
  "answer": "작업료 규모에 따른 매칭비입니다 ...",
  "escalate": false,                  // true면 사람 연결 필요
  "escalate_to": "park|brad|kim|null", // 담당 라우팅
  "category": "FAQ|정부지원|진단|기술|분쟁"
}
```

### 6.3 연동 원칙
- 모듈 응답이 `escalate:true`면 곁에는 inquiry 기록 + 카카오 단일 채널 안내.
- 모듈 장애 시 폴백: 곁에 FAQ 14개 정적 응답으로 자동 강등(graceful degradation).
- 챗봇은 **읽기 + inquiry 기록만**. 거래·정산 상태 변경 호출 불가(권한 분리).
- 지식 적재: FAQ 14개 → 모듈 지식베이스로 이관. 거래·문의 데이터 점진 적재(개인정보 비식별).

---

## 7. 보안·권한

- **RLS**: 모든 테이블 활성화. 사용자 데이터는 본인 것만(03_DB §6).
- **돈·계약 보호**: 정산 release·refund, 매칭 확정은 관리자(service_role)만. 클라이언트에서 직접 호출 불가.
- **파트너 연락처**: deal 성사 전 사장님 응답에서 제외(서버에서 필터).
- **결제 webhook**: 서명 검증. 멱등 처리(중복 방지).
- **개인정보 최소 수집**: 이메일·연락처만 필수. 민감정보 저장 안 함.
- **환경변수**: Supabase 키·토스 시크릿·모듈 URL은 Vercel/Supabase 환경변수로(코드 비포함).
- **책임 적립금 무결성**: guarantee_fund_ledger는 append-only(수정·삭제 금지). 적립·출금은 관리자 작업만. 별도 계좌 잔액과 원장 합계가 일치하도록 정기 대사(reconciliation).

## 7.5 법적 지위 및 약관 (준수 사항)

> ⚠️ 아래는 설계 방향이며, **서비스 오픈 전 노무사·변호사 확인 필수**(TASKS T0.6). 곁에는 방향을 명문화하되 최종 판단은 전문가에 위임.

- **포지션**: 곁에는 '고용·파견'이 아니라 **건별 용역 중개(도급 중개)**다. 파트너는 독립 사업자로서 *특정 결과물*을 책임지고 납품하며, 사장님-파트너 간 근로·파견 관계가 성립하지 않는다.
- **매칭피 성격**: **중개 수수료**(곁에가 건별 거래를 중개한 대가). 약관에 명시.
- **약관 명문화 항목**:
  - 곁에는 거래 당사자가 아닌 *중개자*이며, 결과물 책임은 파트너에 있다(단, 곁에 책임 적립금이 2차 안전망).
  - 사장님은 파트너에게 *지휘·감독*하지 않으며, 건별 결과물을 의뢰·검수한다.
  - 파트너는 독립적으로 작업하며 곁에·사장님의 근로자가 아니다.
- **운영 원칙(파견법 리스크 회피)**: 화면·정책에서 *시간제 상주·출퇴근·지속 지시* 표현을 쓰지 않고 '결과물 납품'을 일관 강조. 장기·상주형 의뢰는 MVP에서 받지 않거나 별도 검토.
- **확인 필요 항목(법무)**: ① 직업안정법상 유료직업소개사업 신고 대상 여부, ② 파견법 적용 여부, ③ 집출 자문형 서비스(경영진단·코칭)의 도급 성격 유지 가능성, ④ 통신판매중개업 신고.

---

## 8. 성능·품질

- **모바일 우선**: Lighthouse 모바일 성능 고려. 이미지 최소(단순화 헌법).
- **응답 목표**: 화면 전환 즉시, API 일반 < 500ms(매칭 후보 계산 포함).
- **접근성**: 시니어 배려(큰 글씨·명확 버튼·대비). 폼 최소.
- **에러 처리**: 결제·정산 실패 시 명확한 안내 + 매니저 연결.
- **로깅**: 거래 상태 변경·정산 실행은 감사 로그(누가·언제).

---

## 9. 환경변수 목록 (예시)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # 서버 전용(관리자 작업)
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_WEBHOOK_SECRET=
CHAT_MODULE_URL=                   # 공용 RAG·챗봇 모듈(2단계)
KAKAO_REST_API_KEY=                # 소셜 로그인(Supabase 설정에도 등록)
GUARANTEE_RATE=0.10                # 곁에 책임 적립금 적립률(매칭피 대비)
```

> 다음: `05_TASKS.md`
