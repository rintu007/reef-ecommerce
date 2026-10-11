-- Expo push tokens, one row per (user, device) — a user can have several
-- devices registered at once. No RLS write policy for clients: registration
-- goes through the service-role API route only (see api/push-tokens), same
-- pattern as every other server-only table in this app.
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  token text not null,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);
create index push_tokens_user_id_idx on push_tokens (user_id);

alter table push_tokens enable row level security;
