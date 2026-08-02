-- Enums, mapped 1:1 from base44/entities/*.jsonc `enum` fields.
-- See SYSTEM_ANALYSIS.md for the source business rules.

create type user_role as enum ('admin', 'user');
create type language_code as enum ('en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh');

create type market_type as enum ('saltwater', 'freshwater', 'both');
create type listing_type as enum (
  'coral', 'fish', 'sw_invert', 'equipment',
  'fw_fish', 'fw_amphibian', 'fw_turtle', 'fw_other', 'fw_equipment'
);
create type listing_status as enum ('active', 'sold', 'pending_approval', 'removed');
create type care_level as enum ('low', 'medium', 'high');
create type difficulty_level as enum ('beginner', 'intermediate', 'expert');
create type temperament_type as enum ('peaceful', 'semi-aggressive', 'aggressive');
create type equipment_condition as enum ('new', 'like_new', 'good', 'fair', 'parts_only');
create type equipment_market as enum ('saltwater_only', 'freshwater_only', 'both');
create type doa_policy_type as enum ('full_refund', 'store_credit', 'no_refund', 'custom', 'not_applicable');

create type service_type as enum (
  'tank_building', 'tank_cleaning_sw', 'tank_cleaning_fw', 'aquascaping', 'maintenance',
  'water_testing', 'coral_fragging', 'fish_sitting', 'equipment_repair', 'tank_teardown',
  'consultation', 'other'
);
create type service_status as enum ('active', 'paused', 'removed');

create type order_shipping_method as enum ('shipping', 'local_pickup');
create type order_status as enum (
  'pending', 'confirmed', 'shipped', 'delivered', 'completed',
  'cancelled', 'doa_claim', 'awaiting_pickup', 'pickup_confirmed'
);

create type review_type as enum ('seller_review', 'buyer_review');
create type watchlist_type as enum ('listing', 'keyword');
create type report_type as enum ('listing', 'seller');
create type report_status as enum ('pending', 'reviewed', 'resolved', 'dismissed');

create type plan_slug as enum ('free', 'pro', 'business');
create type subscription_status as enum ('active', 'cancelled', 'past_due', 'trialing');
create type payment_provider_type as enum ('stripe', 'manual', 'promo');

create type promo_type as enum ('free_membership_6mo', 'free_membership_1yr', 'bonus_listings');
create type credit_status as enum ('available', 'used', 'expired');

create type help_content_type as enum ('video', 'article', 'tip', 'faq');
create type help_category as enum (
  'beginner_setup', 'coral_care', 'fish_care', 'fragging_tips', 'lighting_flow',
  'water_chemistry', 'pest_prevention', 'shipping_acclimation', 'maintenance'
);
