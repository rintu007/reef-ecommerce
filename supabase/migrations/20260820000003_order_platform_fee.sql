-- Platform's actual take per order (platformFeeCents + featuredFeeCents from
-- packages/shared/src/fees.ts, captured at checkout time) was never
-- persisted — admin's "Total Revenue" stat is GMV (sum(total_charged), what
-- buyers paid), not what the platform actually kept. This was surfaced by
-- the user asking whether admin can show platform earnings — it couldn't.

alter table orders
  add column platform_fee numeric(10, 2) not null default 0 check (platform_fee >= 0);

comment on column orders.platform_fee is
  'Platform''s cut captured at checkout: 5% of item subtotal + $0.99 if featured. Snapshot, not recomputed — matches the application_fee_amount actually sent to Stripe.';

-- Best-effort backfill for existing rows: 5% of price*quantity. Can't
-- recover whether a given historical order's listing was featured at
-- purchase time, so the $0.99 add-on is omitted for backfilled rows —
-- an acceptable small undercount for historical data only.
update orders
set platform_fee = round(price * quantity * 0.05, 2)
where platform_fee = 0;

drop function if exists get_order_revenue_summary();

create function get_order_revenue_summary()
returns table (
  total_orders bigint,
  completed_orders bigint,
  pending_orders bigint,
  revenue_completed numeric,
  revenue_avg numeric,
  revenue_pending numeric,
  revenue_cancelled numeric,
  platform_fee_completed numeric
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
    coalesce(sum(total_charged) filter (where status = 'cancelled'), 0) as revenue_cancelled,
    coalesce(sum(platform_fee) filter (where status = 'completed'), 0) as platform_fee_completed
  from orders;
$$;
