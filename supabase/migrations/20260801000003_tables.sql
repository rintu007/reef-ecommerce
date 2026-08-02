-- Core schema. Field-level provenance: base44/entities/*.jsonc.
-- Structural changes vs. the Base44 model (see SYSTEM_ANALYSIS.md §5 / plan "Bug fixes"):
--   * real uuid FKs instead of loose email/id strings
--   * conversations + messages (was: Message with an unused conversation_id string)
--   * promo_code_redemptions join table (was: PromoCode.used_by text[])
--   * profiles.bonus_listing_slots is defined here and is actually read by the
--     listing-limit check in the Next.js backend (it was dead in Base44)

-- ============================================================== profiles
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null,
  role user_role not null default 'user',
  display_name text,
  avatar_url text,
  tank_photos text[] not null default '{}',
  bio text,
  location text,
  language language_code not null default 'en',
  country text,
  verified_seller boolean not null default false,
  completed_sales_count integer not null default 0 check (completed_sales_count >= 0),
  bonus_listing_slots integer not null default 0 check (bonus_listing_slots >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_idx on profiles (email);

-- ============================================================== listings
create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  market market_type not null default 'saltwater',
  listing_type listing_type not null,
  category text,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'USD',
  pickup_price numeric(10, 2) check (pickup_price >= 0),
  shipping_cost numeric(10, 2) not null default 0 check (shipping_cost >= 0),
  shipping_tiers jsonb not null default '[]'::jsonb,
  min_qty integer not null default 1 check (min_qty >= 1),
  min_order_amount numeric(10, 2) not null default 0 check (min_order_amount >= 0),
  photos text[] not null default '{}',
  wysiwyg boolean not null default false,
  quantity integer not null default 1 check (quantity >= 0),
  shipping_available boolean not null default false,
  local_pickup boolean not null default true,
  pickup_address text,
  pickup_times text[] not null default '{}',
  status listing_status not null default 'active',
  featured boolean not null default false,
  featured_fee boolean not null default false,
  location text,
  seller_country text,
  ships_to_countries text[] not null default '{}',
  frag_size text,
  light_requirement care_level,
  flow_requirement care_level,
  difficulty difficulty_level,
  care_notes text,
  species_name text,
  tank_size_recommendation text,
  temperament temperament_type,
  reef_safe boolean,
  brand text,
  model text,
  condition equipment_condition,
  equipment_notes text,
  equipment_market equipment_market,
  doa_policy doa_policy_type,
  doa_policy_custom text,
  views integer not null default 0 check (views >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_seller_id_idx on listings (seller_id);
create index listings_status_idx on listings (status);
create index listings_market_type_idx on listings (market, listing_type);
create index listings_category_idx on listings (category);
create index listings_created_at_idx on listings (created_at desc);

-- ============================================================== services
create table services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  service_type service_type not null,
  market market_type not null default 'both',
  price_range text,
  location text,
  service_area text,
  ships_nationwide boolean not null default false,
  photos text[] not null default '{}',
  contact_info text,
  status service_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_provider_id_idx on services (provider_id);
create index services_status_idx on services (status);

-- ============================================================== orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings (id) on delete set null,
  buyer_id uuid not null references profiles (id) on delete restrict,
  seller_id uuid not null references profiles (id) on delete restrict,
  -- snapshots at purchase time — intentionally NOT joined live, see SYSTEM_ANALYSIS.md §2
  listing_title text not null,
  listing_photo text,
  price numeric(10, 2) not null check (price >= 0),
  total_charged numeric(10, 2) check (total_charged >= 0),
  sales_tax numeric(10, 2) not null default 0 check (sales_tax >= 0),
  buyer_service_fee numeric(10, 2) not null default 0 check (buyer_service_fee >= 0),
  quantity integer not null default 1 check (quantity >= 1),
  shipping_method order_shipping_method not null,
  status order_status not null default 'pending',
  tracking_number text,
  carrier text,
  shipping_date date,
  notes text,
  buyer_protection boolean not null default false,
  payment_intent_id text,
  pickup_address text,
  pickup_time text,
  seller_marked_picked_up boolean not null default false,
  seller_marked_picked_up_at timestamptz,
  buyer_confirmed_pickup boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_buyer_id_idx on orders (buyer_id);
create index orders_seller_id_idx on orders (seller_id);
create index orders_status_idx on orders (status);
create index orders_listing_id_idx on orders (listing_id);
-- DB-level guard against duplicate concurrent orders for the same listing+buyer
-- (app-level dedupe existed in Base44 via a filter query; this backstops it).
create unique index orders_no_duplicate_active_idx on orders (listing_id, buyer_id)
  where status in ('pending', 'confirmed');

-- ============================================================== conversations / messages
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references profiles (id) on delete cascade,
  user_b_id uuid not null references profiles (id) on delete cascade,
  user_lo uuid generated always as (least(user_a_id, user_b_id)) stored,
  user_hi uuid generated always as (greatest(user_a_id, user_b_id)) stored,
  listing_id uuid references listings (id) on delete set null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  check (user_a_id <> user_b_id)
);
create unique index conversations_pair_unique on conversations (user_lo, user_hi);
create index conversations_user_a_idx on conversations (user_a_id);
create index conversations_user_b_idx on conversations (user_b_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  listing_id uuid references listings (id) on delete set null,
  sender_id uuid not null references profiles (id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_conversation_id_idx on messages (conversation_id, created_at);
create index messages_sender_id_idx on messages (sender_id);

-- ============================================================== reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings (id) on delete set null,
  seller_id uuid not null references profiles (id) on delete cascade,
  reviewer_id uuid not null references profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  type review_type not null default 'seller_review',
  created_at timestamptz not null default now()
);
create index reviews_seller_id_idx on reviews (seller_id);
-- Assumption pending confirmation against the real submitReview validation logic
-- (SYSTEM_ANALYSIS.md §3.10 flags this as unverified): one review per reviewer
-- per listing per type. Relax if that turns out to be wrong.
create unique index reviews_one_per_listing_idx on reviews (listing_id, reviewer_id, type)
  where listing_id is not null;

-- ============================================================== watchlists / saved_searches
create table watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type watchlist_type not null,
  listing_id uuid references listings (id) on delete cascade,
  keyword text,
  market market_type,
  notify_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (type = 'listing' and listing_id is not null and keyword is null) or
    (type = 'keyword' and keyword is not null and listing_id is null)
  )
);
create unique index watchlists_listing_unique on watchlists (user_id, listing_id) where type = 'listing';
create unique index watchlists_keyword_unique on watchlists (user_id, keyword) where type = 'keyword';
create index watchlists_user_id_idx on watchlists (user_id);

create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text,
  listing_type listing_type,
  category text,
  keyword text,
  max_price numeric(10, 2) check (max_price >= 0),
  shipping_available boolean,
  local_pickup boolean,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index saved_searches_user_id_idx on saved_searches (user_id);
create index saved_searches_active_idx on saved_searches (is_active) where is_active;

-- ============================================================== reports / blocked_users
create table reports (
  id uuid primary key default gen_random_uuid(),
  report_type report_type not null,
  listing_id uuid references listings (id) on delete set null,
  reported_id uuid references profiles (id) on delete set null,
  reporter_id uuid not null references profiles (id) on delete cascade,
  reason text not null,
  details text,
  status report_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_status_idx on reports (status);

create table blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  check (blocker_id <> blocked_id)
);
create unique index blocked_users_pair_unique on blocked_users (blocker_id, blocked_id);

-- ============================================================== membership / subscriptions / promo
create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  slug plan_slug not null unique,
  name text not null,
  price_monthly numeric(10, 2) not null default 0 check (price_monthly >= 0),
  max_active_listings integer not null check (max_active_listings = -1 or max_active_listings >= 0),
  description text,
  features text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  plan_slug plan_slug not null default 'free',
  status subscription_status not null default 'active',
  current_period_start date,
  current_period_end date,
  payment_provider payment_provider_type,
  external_subscription_id text,
  external_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_subscriptions_user_id_idx on user_subscriptions (user_id);
-- Mirrors the app-level "cancel existing active/trialing sub, then create a new one" pattern.
create unique index user_subscriptions_one_active_idx on user_subscriptions (user_id)
  where status in ('active', 'trialing');

create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  type promo_type not null,
  bonus_listings integer check (bonus_listings >= 0),
  max_uses integer not null default 1 check (max_uses >= 1),
  uses integer not null default 0 check (uses >= 0),
  expires_at date,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table promo_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references promo_codes (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique (promo_code_id, user_id)
);

-- ============================================================== credits / payouts
create table user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  reason text not null,
  order_id uuid references orders (id) on delete set null,
  issued_by text,
  status credit_status not null default 'available',
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_credits_user_id_idx on user_credits (user_id);

create table seller_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles (id) on delete cascade,
  stripe_account_id text,
  onboarding_complete boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================== content / cms
create table announcements (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  message text not null,
  is_active boolean not null default true,
  max_views integer not null default 1 check (max_views >= 0),
  show_to_guests boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table help_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content_type help_content_type not null,
  market market_type not null default 'both',
  category help_category not null,
  categories text[] not null default '{}',
  youtube_url text,
  body text,
  thumbnail_url text,
  display_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index help_content_published_idx on help_content (published) where published;
