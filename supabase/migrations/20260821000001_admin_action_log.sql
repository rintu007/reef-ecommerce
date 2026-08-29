-- Any admin can refund an order, delete a listing, or grant another user
-- admin access with zero trace of who did it or when — the only fragment of
-- an audit trail anywhere was user_credits.issued_by, a side effect of one
-- specific action with no screen to even view it. This is the real thing:
-- every sensitive admin mutation writes a row here.

create table admin_action_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index admin_action_log_admin_id_idx on admin_action_log (admin_id);
create index admin_action_log_created_at_idx on admin_action_log (created_at desc);
create index admin_action_log_target_idx on admin_action_log (target_type, target_id);

alter table admin_action_log enable row level security;
create policy admin_action_log_select_admin on admin_action_log for select using (is_admin());
-- No insert/update/delete policy — every write goes through the service-role
-- client (see lib/server/admin-log.ts), never a user-scoped session.
