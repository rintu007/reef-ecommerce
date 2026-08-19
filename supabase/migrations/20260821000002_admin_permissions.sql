-- Additive permissions layer on top of the existing binary role. role='admin'
-- still gates the whole admin panel and every RLS policy, unchanged — this
-- only further restricts which money-moving actions a given admin can take
-- (refund orders / issue store credit), so a full admin roster doesn't mean
-- every admin can move money. A plain text[] rather than a Postgres enum so
-- adding a new permission later doesn't need a type migration.

alter table profiles
  add column admin_permissions text[] not null default '{}';
