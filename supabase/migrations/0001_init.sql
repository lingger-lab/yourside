-- ============================================================
-- 곁에(yourside) MVP 스키마 v1.1 (마스터 v3.3)
-- Supabase (PostgreSQL). 한 번에 전체 실행 가능.
-- ============================================================

-- updated_at 자동 갱신 함수
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

-- enum 타입
create type auth_provider   as enum ('google','kakao','naver');
create type client_status   as enum ('active','inactive');
create type partner_status  as enum ('active','waiting','suspended');
create type partner_grade   as enum ('veteran','standard','new');
create type request_status  as enum ('open','matching','dealt','closed');
create type matching_status as enum ('proposed','accepted','rejected');
create type deal_status     as enum ('quoted','working','done');
create type escrow_status   as enum ('pending','deposited','reviewing','released','refunded');
create type review_author   as enum ('client','partner','gyeotae');
create type inquiry_status  as enum ('open','ai_answered','human_routed','closed');
create type manager_name    as enum ('park','brad','kim');

-- 1. CLIENT (사장님)
create table client (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  provider      auth_provider,
  email         text not null,
  contact       text,
  company       text,
  ceo_name      text,
  region        text,
  industry      text,
  status        client_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. PARTNER (파트너)
create table partner (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  provider      auth_provider,
  email         text not null,
  contact       text,
  name          text,
  field         text,
  career_yrs    int,
  grade         partner_grade not null default 'standard',
  status        partner_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. REQUEST (의뢰) - 1단계
create table request (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references client(id) on delete cascade,
  title       text not null,
  detail      text not null,
  req_type    text,
  scope       text,
  budget_hope int,
  status      request_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 5. MATCHING (매칭) - 2단계 — deal보다 먼저 생성 (FK 참조 순서)
create table matching (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references request(id) on delete cascade,
  partner_id  uuid not null references partner(id),
  manager     manager_name,
  status      matching_status not null default 'proposed',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. DEAL (거래) - 3~5단계
create table deal (
  id          uuid primary key default gen_random_uuid(),
  matching_id uuid unique references matching(id),
  request_id  uuid references request(id),
  partner_id  uuid references partner(id),
  work_fee    int not null,
  match_fee   int not null,
  total_pay   int not null,
  scope       text,
  due_date    date,
  status      deal_status not null default 'quoted',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 6. SETTLEMENT (정산) - 4·6단계
create table settlement (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null unique references deal(id) on delete cascade,
  escrow_status escrow_status not null default 'pending',
  payment_key   text,
  guarantee_fee int not null default 0,
  refunded_amt  int not null default 0,
  refund_reason text,
  deposited_at  timestamptz,
  released_at   timestamptz,
  refunded_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 6-b. GUARANTEE_FUND_LEDGER (곁에 책임 적립금 원장)
create table guarantee_fund_ledger (
  id            uuid primary key default gen_random_uuid(),
  settlement_id uuid references settlement(id),
  entry_type    text not null,
  amount        int not null,
  balance_after int,
  note          text,
  created_at    timestamptz not null default now()
);

-- 7. REVIEW (평가) - 7단계
create table review (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deal(id) on delete cascade,
  author_type review_author not null,
  rating      int check (rating between 1 and 5),
  comment     text,
  internal_note text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 8. INQUIRY (문의) - 챗봇 큐
create table inquiry (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid,
  author_type review_author,
  category    text,
  content     text not null,
  status      inquiry_status not null default 'open',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 트리거
do $$
declare t text;
begin
  foreach t in array array['client','partner','request','deal','matching','settlement','review','inquiry']
  loop
    execute format('create trigger trg_%I_updated before update on %I
      for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- 인덱스
create index idx_request_client    on request(client_id);
create index idx_request_status    on request(status);
create index idx_deal_request      on deal(request_id);
create index idx_deal_partner      on deal(partner_id);
create index idx_matching_request  on matching(request_id);
create index idx_matching_partner  on matching(partner_id);
create index idx_settlement_deal   on settlement(deal_id);
create index idx_review_deal       on review(deal_id);
create index idx_inquiry_status    on inquiry(status);

-- RLS 활성화
alter table client     enable row level security;
alter table partner    enable row level security;
alter table request    enable row level security;
alter table deal       enable row level security;
alter table matching   enable row level security;
alter table settlement enable row level security;
alter table review     enable row level security;
alter table inquiry    enable row level security;

-- RLS 정책 (핵심 골격)
-- 관리자(service_role)는 RLS 우회(기본).
-- 사장님: 자기 의뢰 조회/생성
create policy client_select_own_request on request for select
  using (client_id in (select id from client where auth_user_id = auth.uid()));
create policy client_insert_request on request for insert
  with check (client_id in (select id from client where auth_user_id = auth.uid()));
-- 파트너: 배정된 매칭 조회
create policy partner_select_matching on matching for select
  using (partner_id in (select id from partner where auth_user_id = auth.uid()));
-- INQUIRY: 본인 문의 생성(챗봇 경로)
create policy inquiry_insert on inquiry for insert
  with check (author_id is not null);
