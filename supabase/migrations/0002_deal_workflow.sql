-- ============================================================
-- 곁에(yourside) deal_workflow 추가 마이그레이션
-- 공통 5단계 워크플로우 (수준 1 최소, 마스터 v3.3)
-- ============================================================

-- 새 enum 타입
create type workflow_step as enum ('intake','structure','generate','verify','deliver');
create type step_status   as enum ('pending','in_progress','done');

-- DEAL_WORKFLOW (공통 5단계 워크플로우 진행)
-- MVP: 도메인 구분 없는 공통 뼈대 1개. 거래당 5단계 상태 추적.
-- 도메인별 설정·도구 임베드는 Phase 2.
create table deal_workflow (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deal(id) on delete cascade,
  step        workflow_step not null,
  status      step_status not null default 'pending',
  note        text,
  done_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (deal_id, step)
);

-- updated_at 트리거
create trigger trg_deal_workflow_updated before update on deal_workflow
  for each row execute function set_updated_at();

-- 인덱스
create index idx_workflow_deal on deal_workflow(deal_id);

-- RLS 활성화
alter table deal_workflow enable row level security;
