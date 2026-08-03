-- Messages is the one deliberate exception to "everything goes through the
-- Next.js API" (see packages/shared/src/api-client.ts, apps/web's
-- supabase-browser.ts): clients subscribe directly via Supabase Realtime for
-- instant delivery, authorized by the existing messages_select_participant
-- RLS policy.
alter publication supabase_realtime add table messages;
