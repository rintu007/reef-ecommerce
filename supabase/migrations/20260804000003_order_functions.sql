-- Atomic helpers for order fulfillment (apps/web/src/lib/server/orders.ts).
-- Plain read-then-write from the app layer would race under concurrent
-- webhook deliveries / simultaneous order completions for the same
-- listing/seller — these do the read-modify-write as a single statement
-- inside Postgres instead.

create or replace function decrement_listing_quantity(p_listing_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_qty integer;
begin
  update listings
  set quantity = greatest(quantity - p_amount, 0), updated_at = now()
  where id = p_listing_id
  returning quantity into new_qty;

  if new_qty = 0 then
    update listings set status = 'sold' where id = p_listing_id and status = 'active';
  end if;

  return new_qty;
end;
$$;

-- Mirrors checkAndGrantVerifiedSeller (SYSTEM_ANALYSIS.md SS3.5): one-way grant
-- at 10 completed sales, never revoked.
create or replace function increment_completed_sales(p_seller_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update profiles
  set completed_sales_count = completed_sales_count + 1,
      verified_seller = case when completed_sales_count + 1 >= 10 then true else verified_seller end,
      updated_at = now()
  where id = p_seller_id
  returning completed_sales_count into new_count;

  return new_count;
end;
$$;
