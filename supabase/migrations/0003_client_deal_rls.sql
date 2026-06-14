-- ============================================================
-- 곁에(yourside) Phase 3: 사장님 deal/settlement/workflow 조회 RLS
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 사장님이 자기 의뢰에 연결된 deal 조회
create policy client_select_own_deal on deal for select
  using (request_id in (
    select id from request where client_id in (
      select id from client where auth_user_id = auth.uid()
    )
  ));

-- 사장님이 자기 deal의 settlement 조회
create policy client_select_own_settlement on settlement for select
  using (deal_id in (
    select id from deal where request_id in (
      select id from request where client_id in (
        select id from client where auth_user_id = auth.uid()
      )
    )
  ));

-- 사장님이 자기 deal의 workflow 조회
alter table deal_workflow enable row level security;

create policy client_select_deal_workflow on deal_workflow for select
  using (deal_id in (
    select id from deal where request_id in (
      select id from request where client_id in (
        select id from client where auth_user_id = auth.uid()
      )
    )
  ));
