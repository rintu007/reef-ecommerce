-- Visitor page-view logging. Listed as an entity in SYSTEM_ANALYSIS.md §2/§3.12
-- but missed in the original schema migrations. A loose `user_email` field
-- (not a profiles FK) is intentional here: this is analytics/log data, not
-- core relational data, and should keep working for guest sessions too.
create table visitor_logs (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  session_id text not null,
  user_email citext,
  is_guest boolean not null default true,
  created_at timestamptz not null default now()
);
create index visitor_logs_session_id_idx on visitor_logs (session_id);
create index visitor_logs_created_at_idx on visitor_logs (created_at desc);

alter table visitor_logs enable row level security;
create policy visitor_logs_select_admin on visitor_logs for select using (is_admin());
