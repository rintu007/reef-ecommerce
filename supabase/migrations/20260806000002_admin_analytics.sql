-- Backing aggregates for the admin Sales/App Analytics tabs (M3+ legacy-parity
-- gap). Legacy computed all of this in a single opaque Base44 serverless
-- function ("getAdminAnalytics") not present in this repo, so it's
-- reimplemented here as small SQL aggregate functions rather than one big
-- one — each is independently reusable and keeps the aggregation (in
-- particular, session-level DISTINCT counts and per-day/per-path GROUP BY)
-- in Postgres instead of pulling every visitor_logs row over the wire.

create or replace function get_visitor_analytics()
returns table (
  total bigint,
  today bigint,
  last_7_days bigint,
  last_30_days bigint,
  unique_sessions bigint,
  auth_sessions bigint,
  guest_sessions bigint
)
language sql
stable
as $$
  select
    count(*) as total,
    count(*) filter (where created_at >= date_trunc('day', now())) as today,
    count(*) filter (where created_at >= now() - interval '7 days') as last_7_days,
    count(*) filter (where created_at >= now() - interval '30 days') as last_30_days,
    count(distinct session_id) as unique_sessions,
    count(distinct session_id) filter (where is_guest = false) as auth_sessions,
    count(distinct session_id) filter (where is_guest = true) as guest_sessions
  from visitor_logs;
$$;

create or replace function get_visits_by_day(days_back int default 30)
returns table (day date, count bigint)
language sql
stable
as $$
  select date_trunc('day', created_at)::date as day, count(*) as count
  from visitor_logs
  where created_at >= now() - (days_back || ' days')::interval
  group by 1
  order by 1;
$$;

create or replace function get_top_pages(limit_count int default 10)
returns table (path text, count bigint)
language sql
stable
as $$
  select path, count(*) as count
  from visitor_logs
  group by path
  order by count(*) desc
  limit limit_count;
$$;

-- revenue = completed orders only (pending/cancelled charges aren't realized revenue yet).
create or replace function get_order_revenue_summary()
returns table (
  total_orders bigint,
  completed_orders bigint,
  pending_orders bigint,
  revenue_completed numeric,
  revenue_avg numeric,
  revenue_pending numeric,
  revenue_cancelled numeric
)
language sql
stable
as $$
  select
    count(*) as total_orders,
    count(*) filter (where status = 'completed') as completed_orders,
    count(*) filter (where status = 'pending') as pending_orders,
    coalesce(sum(total_charged) filter (where status = 'completed'), 0) as revenue_completed,
    coalesce(avg(total_charged) filter (where status = 'completed'), 0) as revenue_avg,
    coalesce(sum(total_charged) filter (where status = 'pending'), 0) as revenue_pending,
    coalesce(sum(total_charged) filter (where status = 'cancelled'), 0) as revenue_cancelled
  from orders;
$$;

create or replace function get_review_summary()
returns table (total bigint, avg_rating numeric)
language sql
stable
as $$
  select count(*) as total, coalesce(avg(rating), 0) as avg_rating from reviews;
$$;
