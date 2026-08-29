-- Legacy parity: reef-trade-flow's admin UserManagementTab could block/unblock
-- a user. Mirrored here on profiles (fast to query in the admin list, no N+1
-- per-row auth lookup) alongside Supabase's own auth.users ban (the actual
-- enforcement — banned_at is just a display/filter cache of that).
alter table profiles add column if not exists banned_at timestamptz;
