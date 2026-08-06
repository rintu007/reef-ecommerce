-- Buyer-initiated DOA (dead-on-arrival) claim filing (M3 legacy-parity).
-- orders.status already has a `doa_claim` value, but it's set by
-- refundOrder() as the RESOLVED outcome (a refund/credit was issued) — it
-- can't double as "claim pending review" without breaking that meaning. This
-- adds a separate, nullable claim-review lane that doesn't touch order.status
-- until an admin actually resolves it (approve keeps using the existing
-- refundOrder path; deny is new).
create type doa_claim_review_status as enum ('pending', 'approved', 'denied');

alter table orders
  add column doa_claim_status doa_claim_review_status,
  add column doa_claim_reason text,
  add column doa_claim_photos text[] not null default '{}',
  add column doa_claim_filed_at timestamptz;

create index orders_doa_claim_pending_idx on orders (doa_claim_status) where doa_claim_status = 'pending';
