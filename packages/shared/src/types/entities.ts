// Row shapes + create-input schemas for the Postgres tables in
// supabase/migrations/20260801000003_tables.sql. Kept by hand until
// `supabase gen types typescript` is wired up (Step 1 follow-up).
import { z } from "zod";
import {
  careLevelSchema,
  creditStatusSchema,
  difficultyLevelSchema,
  doaClaimReviewStatusSchema,
  doaPolicyTypeSchema,
  equipmentConditionSchema,
  equipmentMarketSchema,
  helpCategorySchema,
  helpContentTypeSchema,
  languageCodeSchema,
  listingStatusSchema,
  listingTypeSchema,
  marketTypeSchema,
  orderShippingMethodSchema,
  orderStatusSchema,
  paymentProviderTypeSchema,
  photoTypeSchema,
  planSlugSchema,
  promoTypeSchema,
  reportStatusSchema,
  reportTypeSchema,
  reviewTypeSchema,
  serviceStatusSchema,
  serviceTypeSchema,
  subscriptionStatusSchema,
  temperamentTypeSchema,
  userRoleSchema,
  watchlistTypeSchema,
} from "./enums";

const uuid = () => z.string().uuid();
const isoDateTime = () => z.string();
const isoDate = () => z.string();
const money = () => z.number().nonnegative();

// ============================================================== profiles
export const profileSchema = z.object({
  id: uuid(),
  email: z.string().email(),
  role: userRoleSchema,
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  tank_photos: z.array(z.string()),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  language: languageCodeSchema,
  country: z.string().nullable(),
  verified_seller: z.boolean(),
  completed_sales_count: z.number().int().nonnegative(),
  bonus_listing_slots: z.number().int().nonnegative(),
  seller_agreed: z.boolean(),
  eula_accepted: z.boolean(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type Profile = z.infer<typeof profileSchema>;

export const profileUpdateSchema = profileSchema
  .pick({
    display_name: true,
    avatar_url: true,
    tank_photos: true,
    bio: true,
    location: true,
    language: true,
    country: true,
  })
  .partial();
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// Public-safe subset for seller storefronts — no email/role/bonus_listing_slots.
export const publicProfileSchema = profileSchema.omit({ email: true, role: true, bonus_listing_slots: true });
export type PublicProfile = z.infer<typeof publicProfileSchema>;

// ============================================================== listings
export const shippingTierSchema = z.object({
  up_to_qty: z.number().int().positive(),
  price: money(),
});
export type ShippingTier = z.infer<typeof shippingTierSchema>;

export const listingSchema = z.object({
  id: uuid(),
  seller_id: uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  market: marketTypeSchema,
  listing_type: listingTypeSchema,
  category: z.string().nullable(),
  price: money(),
  currency: z.string().length(3),
  pickup_price: money().nullable(),
  shipping_cost: money(),
  shipping_tiers: z.array(shippingTierSchema),
  min_qty: z.number().int().positive(),
  min_order_amount: money(),
  photos: z.array(z.string()),
  photo_type: photoTypeSchema.nullable(),
  wysiwyg: z.boolean(),
  quantity: z.number().int().nonnegative(),
  shipping_available: z.boolean(),
  local_pickup: z.boolean(),
  pickup_address: z.string().nullable(),
  pickup_times: z.array(z.string()),
  status: listingStatusSchema,
  featured: z.boolean(),
  featured_fee: z.boolean(),
  location: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  seller_country: z.string().nullable(),
  ships_to_countries: z.array(z.string()),
  frag_size: z.string().nullable(),
  light_requirement: careLevelSchema.nullable(),
  flow_requirement: careLevelSchema.nullable(),
  difficulty: difficultyLevelSchema.nullable(),
  care_notes: z.string().nullable(),
  species_name: z.string().nullable(),
  tank_size_recommendation: z.string().nullable(),
  temperament: temperamentTypeSchema.nullable(),
  reef_safe: z.boolean().nullable(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  condition: equipmentConditionSchema.nullable(),
  equipment_notes: z.string().nullable(),
  equipment_market: equipmentMarketSchema.nullable(),
  doa_policy: doaPolicyTypeSchema.nullable(),
  doa_policy_custom: z.string().nullable(),
  views: z.number().int().nonnegative(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type Listing = z.infer<typeof listingSchema>;

export const listingCreateSchema = listingSchema
  .omit({
    id: true,
    seller_id: true,
    views: true,
    created_at: true,
    updated_at: true,
    status: true,
    // server-computed via geocoding the location string, not user-supplied
    latitude: true,
    longitude: true,
  })
  .partial({
    description: true, category: true, pickup_price: true, shipping_cost: true,
    shipping_tiers: true, min_qty: true, min_order_amount: true, photos: true,
    photo_type: true, wysiwyg: true, quantity: true, shipping_available: true, local_pickup: true,
    pickup_address: true, pickup_times: true, featured: true, featured_fee: true,
    location: true, seller_country: true, ships_to_countries: true, frag_size: true,
    light_requirement: true, flow_requirement: true, difficulty: true, care_notes: true,
    species_name: true, tank_size_recommendation: true, temperament: true, reef_safe: true,
    brand: true, model: true, condition: true, equipment_notes: true, equipment_market: true,
    doa_policy: true, doa_policy_custom: true, currency: true, market: true,
  });
export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
// status is intentionally absent from listingCreateSchema (POST always creates
// as "active" — see api/listings/route.ts) but PATCH needs it for moderation
// (admin approve/remove) and seller self-service (mark sold), so it's added
// back here rather than to the base create schema.
export const listingUpdateSchema = listingCreateSchema.partial().extend({ status: listingStatusSchema.optional() });
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;

// ============================================================== services
export const serviceSchema = z.object({
  id: uuid(),
  provider_id: uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  service_type: serviceTypeSchema,
  market: marketTypeSchema,
  price_range: z.string().nullable(),
  location: z.string().nullable(),
  service_area: z.string().nullable(),
  ships_nationwide: z.boolean(),
  photos: z.array(z.string()),
  contact_info: z.string().nullable(),
  status: serviceStatusSchema,
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type Service = z.infer<typeof serviceSchema>;

export const serviceCreateSchema = serviceSchema
  .omit({ id: true, provider_id: true, created_at: true, updated_at: true, status: true })
  .partial({
    description: true, price_range: true, location: true, service_area: true,
    ships_nationwide: true, photos: true, contact_info: true, market: true,
  });
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export const serviceUpdateSchema = serviceCreateSchema.partial().extend({ status: serviceStatusSchema.optional() });
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

// ============================================================== orders
export const orderSchema = z.object({
  id: uuid(),
  listing_id: uuid().nullable(),
  buyer_id: uuid(),
  seller_id: uuid(),
  listing_title: z.string(),
  listing_photo: z.string().nullable(),
  price: money(),
  total_charged: money().nullable(),
  sales_tax: money(),
  buyer_service_fee: money(),
  quantity: z.number().int().positive(),
  shipping_method: orderShippingMethodSchema,
  status: orderStatusSchema,
  tracking_number: z.string().nullable(),
  carrier: z.string().nullable(),
  shipping_date: isoDate().nullable(),
  notes: z.string().nullable(),
  buyer_protection: z.boolean(),
  payment_intent_id: z.string().nullable(),
  pickup_address: z.string().nullable(),
  pickup_time: z.string().nullable(),
  seller_marked_picked_up: z.boolean(),
  seller_marked_picked_up_at: isoDateTime().nullable(),
  buyer_confirmed_pickup: z.boolean(),
  doa_claim_status: doaClaimReviewStatusSchema.nullable(),
  doa_claim_reason: z.string().nullable(),
  doa_claim_photos: z.array(z.string()),
  doa_claim_filed_at: isoDateTime().nullable(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type Order = z.infer<typeof orderSchema>;

export const fileDoaClaimSchema = z.object({
  reason: z.string().min(1),
  photos: z.array(z.string()).max(5).optional(),
});
export type FileDoaClaimInput = z.infer<typeof fileDoaClaimSchema>;

export const checkoutInputSchema = z.object({
  listing_id: uuid(),
  quantity: z.number().int().positive(),
  shipping_method: orderShippingMethodSchema,
  pickup_time: z.string().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export const cartCheckoutInputSchema = z.object({
  items: z.array(checkoutInputSchema).min(1).max(20),
});
export type CartCheckoutInput = z.infer<typeof cartCheckoutInputSchema>;

export interface CartCheckoutItemResult {
  listing_id: string;
  order: Order | null;
  clientSecret: string | null;
  error: string | null;
}

export const shipOrderInputSchema = z.object({
  tracking_number: z.string().min(1),
  carrier: z.string().optional(),
});
export type ShipOrderInput = z.infer<typeof shipOrderInputSchema>;

// ============================================================== conversations / messages
export const conversationSchema = z.object({
  id: uuid(),
  user_a_id: uuid(),
  user_b_id: uuid(),
  listing_id: uuid().nullable(),
  last_message_at: isoDateTime().nullable(),
  created_at: isoDateTime(),
});
export type Conversation = z.infer<typeof conversationSchema>;

export const messageSchema = z.object({
  id: uuid(),
  conversation_id: uuid(),
  listing_id: uuid().nullable(),
  sender_id: uuid(),
  content: z.string().min(1),
  read: z.boolean(),
  created_at: isoDateTime(),
});
export type Message = z.infer<typeof messageSchema>;

export const sendMessageSchema = z.object({
  recipient_id: uuid(),
  listing_id: uuid().optional(),
  content: z.string().min(1).max(5000),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// ============================================================== reviews
export const reviewSchema = z.object({
  id: uuid(),
  listing_id: uuid().nullable(),
  seller_id: uuid(),
  reviewer_id: uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  type: reviewTypeSchema,
  created_at: isoDateTime(),
});
export type Review = z.infer<typeof reviewSchema>;

export const reviewCreateSchema = z.object({
  listing_id: uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

// ============================================================== watchlists / saved_searches
export const watchlistSchema = z.object({
  id: uuid(),
  user_id: uuid(),
  type: watchlistTypeSchema,
  listing_id: uuid().nullable(),
  keyword: z.string().nullable(),
  market: marketTypeSchema.nullable(),
  notify_enabled: z.boolean(),
  created_at: isoDateTime(),
});
export type Watchlist = z.infer<typeof watchlistSchema>;

export const savedSearchSchema = z.object({
  id: uuid(),
  user_id: uuid(),
  name: z.string().nullable(),
  listing_type: listingTypeSchema.nullable(),
  category: z.string().nullable(),
  keyword: z.string().nullable(),
  max_price: money().nullable(),
  shipping_available: z.boolean().nullable(),
  local_pickup: z.boolean().nullable(),
  is_active: z.boolean(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type SavedSearch = z.infer<typeof savedSearchSchema>;
export const savedSearchCreateSchema = savedSearchSchema
  .omit({ id: true, user_id: true, created_at: true, updated_at: true })
  .partial({ name: true, listing_type: true, category: true, keyword: true, max_price: true, shipping_available: true, local_pickup: true, is_active: true });
export type SavedSearchCreateInput = z.infer<typeof savedSearchCreateSchema>;
export const savedSearchUpdateSchema = savedSearchCreateSchema.partial();
export type SavedSearchUpdateInput = z.infer<typeof savedSearchUpdateSchema>;

// ============================================================== reports / blocked_users
export const reportSchema = z.object({
  id: uuid(),
  report_type: reportTypeSchema,
  listing_id: uuid().nullable(),
  reported_id: uuid().nullable(),
  reporter_id: uuid(),
  reason: z.string().min(1),
  details: z.string().nullable(),
  status: reportStatusSchema,
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type Report = z.infer<typeof reportSchema>;

export const visitorLogSchema = z.object({
  id: uuid(),
  path: z.string(),
  session_id: z.string(),
  user_email: z.string().nullable(),
  is_guest: z.boolean(),
  created_at: isoDateTime(),
});
export type VisitorLog = z.infer<typeof visitorLogSchema>;
export const reportCreateSchema = reportSchema
  .omit({ id: true, reporter_id: true, status: true, created_at: true, updated_at: true })
  .partial({ listing_id: true, reported_id: true, details: true });
export type ReportCreateInput = z.infer<typeof reportCreateSchema>;

export const blockedUserSchema = z.object({
  id: uuid(),
  blocker_id: uuid(),
  blocked_id: uuid(),
  reason: z.string().nullable(),
  created_at: isoDateTime(),
});
export type BlockedUser = z.infer<typeof blockedUserSchema>;
export const blockedUserCreateSchema = blockedUserSchema
  .omit({ id: true, blocker_id: true, created_at: true })
  .partial({ reason: true });
export type BlockedUserCreateInput = z.infer<typeof blockedUserCreateSchema>;

// ============================================================== membership / subscriptions / promo
export const membershipPlanSchema = z.object({
  id: uuid(),
  slug: planSlugSchema,
  name: z.string(),
  price_monthly: money(),
  max_active_listings: z.number().int(), // -1 = unlimited
  description: z.string().nullable(),
  features: z.array(z.string()),
  is_active: z.boolean(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type MembershipPlan = z.infer<typeof membershipPlanSchema>;

export const userSubscriptionSchema = z.object({
  id: uuid(),
  user_id: uuid(),
  plan_slug: planSlugSchema,
  status: subscriptionStatusSchema,
  current_period_start: isoDate().nullable(),
  current_period_end: isoDate().nullable(),
  payment_provider: paymentProviderTypeSchema.nullable(),
  external_subscription_id: z.string().nullable(),
  external_customer_id: z.string().nullable(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type UserSubscription = z.infer<typeof userSubscriptionSchema>;

export const promoCodeSchema = z.object({
  id: uuid(),
  code: z.string(),
  type: promoTypeSchema,
  bonus_listings: z.number().int().nonnegative().nullable(),
  max_uses: z.number().int().positive(),
  uses: z.number().int().nonnegative(),
  expires_at: isoDate().nullable(),
  is_active: z.boolean(),
  notes: z.string().nullable(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type PromoCode = z.infer<typeof promoCodeSchema>;
export const promoCodeCreateSchema = promoCodeSchema
  .omit({ id: true, uses: true, created_at: true, updated_at: true })
  .partial({ bonus_listings: true, expires_at: true, is_active: true, notes: true });
export type PromoCodeCreateInput = z.infer<typeof promoCodeCreateSchema>;

export const promoCodeRedemptionSchema = z.object({
  id: uuid(),
  user_id: uuid(),
  redeemed_at: isoDateTime(),
  user_email: z.string().nullable(),
  user_display_name: z.string().nullable(),
});
export type PromoCodeRedemption = z.infer<typeof promoCodeRedemptionSchema>;
export const promoCodeUpdateSchema = promoCodeCreateSchema.partial();
export type PromoCodeUpdateInput = z.infer<typeof promoCodeUpdateSchema>;

// ============================================================== credits / payouts
export const userCreditSchema = z.object({
  id: uuid(),
  user_id: uuid(),
  amount: z.number().positive(),
  reason: z.string(),
  order_id: uuid().nullable(),
  issued_by: z.string().nullable(),
  status: creditStatusSchema,
  expires_at: isoDate().nullable(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type UserCredit = z.infer<typeof userCreditSchema>;

export const sellerPayoutAccountSchema = z.object({
  id: uuid(),
  user_id: uuid(),
  stripe_account_id: z.string().nullable(),
  onboarding_complete: z.boolean(),
  payouts_enabled: z.boolean(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type SellerPayoutAccount = z.infer<typeof sellerPayoutAccountSchema>;

// ============================================================== content / cms
export const announcementSchema = z.object({
  id: uuid(),
  subject: z.string(),
  message: z.string(),
  is_active: z.boolean(),
  max_views: z.number().int().nonnegative(),
  show_to_guests: z.boolean(),
  emailed_at: isoDateTime().nullable(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type Announcement = z.infer<typeof announcementSchema>;
export const announcementCreateSchema = announcementSchema
  .omit({ id: true, created_at: true, updated_at: true, emailed_at: true })
  .partial({ is_active: true, max_views: true, show_to_guests: true });
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
export const announcementUpdateSchema = announcementCreateSchema.partial();
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;

export const helpContentSchema = z.object({
  id: uuid(),
  title: z.string(),
  content_type: helpContentTypeSchema,
  market: marketTypeSchema,
  category: helpCategorySchema,
  categories: z.array(z.string()),
  youtube_url: z.string().nullable(),
  body: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  display_order: z.number().int(),
  published: z.boolean(),
  created_at: isoDateTime(),
  updated_at: isoDateTime(),
});
export type HelpContent = z.infer<typeof helpContentSchema>;
export const helpContentCreateSchema = helpContentSchema
  .omit({ id: true, created_at: true, updated_at: true })
  .partial({ categories: true, youtube_url: true, body: true, thumbnail_url: true, display_order: true, published: true, market: true });
export type HelpContentCreateInput = z.infer<typeof helpContentCreateSchema>;
export const helpContentUpdateSchema = helpContentCreateSchema.partial();
export type HelpContentUpdateInput = z.infer<typeof helpContentUpdateSchema>;
