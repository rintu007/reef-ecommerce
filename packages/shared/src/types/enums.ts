// Mirrors supabase/migrations/20260801000002_enums.sql exactly. Keep in sync
// by hand until we wire up `supabase gen types typescript` — these are the
// canonical app-level names for the DB enums.
import { z } from "zod";

export const userRoleSchema = z.enum(["admin", "user"]);
export const languageCodeSchema = z.enum(["en", "es", "fr", "de", "it", "pt", "ja", "zh"]);

export const marketTypeSchema = z.enum(["saltwater", "freshwater", "both"]);
export const listingTypeSchema = z.enum([
  "coral", "fish", "sw_invert", "equipment",
  "fw_fish", "fw_amphibian", "fw_turtle", "fw_other", "fw_equipment",
]);
export const listingStatusSchema = z.enum(["active", "sold", "pending_approval", "removed"]);
export const careLevelSchema = z.enum(["low", "medium", "high"]);
export const difficultyLevelSchema = z.enum(["beginner", "intermediate", "expert"]);
export const temperamentTypeSchema = z.enum(["peaceful", "semi-aggressive", "aggressive"]);
export const equipmentConditionSchema = z.enum(["new", "like_new", "good", "fair", "parts_only"]);
export const equipmentMarketSchema = z.enum(["saltwater_only", "freshwater_only", "both"]);
export const doaPolicyTypeSchema = z.enum(["full_refund", "store_credit", "no_refund", "custom", "not_applicable"]);

export const serviceTypeSchema = z.enum([
  "tank_building", "tank_cleaning_sw", "tank_cleaning_fw", "aquascaping", "maintenance",
  "water_testing", "coral_fragging", "fish_sitting", "equipment_repair", "tank_teardown",
  "consultation", "other",
]);
export const serviceStatusSchema = z.enum(["active", "paused", "removed"]);

export const orderShippingMethodSchema = z.enum(["shipping", "local_pickup"]);
export const orderStatusSchema = z.enum([
  "pending", "confirmed", "shipped", "delivered", "completed",
  "cancelled", "doa_claim", "awaiting_pickup", "pickup_confirmed",
]);
export const doaClaimReviewStatusSchema = z.enum(["pending", "approved", "denied"]);

export const reviewTypeSchema = z.enum(["seller_review", "buyer_review"]);
export const watchlistTypeSchema = z.enum(["listing", "keyword"]);
export const reportTypeSchema = z.enum(["listing", "seller"]);
export const reportStatusSchema = z.enum(["pending", "reviewed", "resolved", "dismissed"]);

export const planSlugSchema = z.enum(["free", "pro", "business"]);
export const subscriptionStatusSchema = z.enum(["active", "cancelled", "past_due", "trialing"]);
export const paymentProviderTypeSchema = z.enum(["stripe", "manual", "promo"]);

export const promoTypeSchema = z.enum(["free_membership_6mo", "free_membership_1yr", "bonus_listings"]);
export const creditStatusSchema = z.enum(["available", "used", "expired"]);

export const helpContentTypeSchema = z.enum(["video", "article", "tip", "faq"]);
export const helpCategorySchema = z.enum([
  "beginner_setup", "coral_care", "fish_care", "fragging_tips", "lighting_flow",
  "water_chemistry", "pest_prevention", "shipping_acclimation", "maintenance",
]);

export type UserRole = z.infer<typeof userRoleSchema>;
export type LanguageCode = z.infer<typeof languageCodeSchema>;
export type MarketType = z.infer<typeof marketTypeSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type ListingStatus = z.infer<typeof listingStatusSchema>;
export type CareLevel = z.infer<typeof careLevelSchema>;
export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;
export type TemperamentType = z.infer<typeof temperamentTypeSchema>;
export type EquipmentCondition = z.infer<typeof equipmentConditionSchema>;
export type EquipmentMarket = z.infer<typeof equipmentMarketSchema>;
export type DoaPolicyType = z.infer<typeof doaPolicyTypeSchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type OrderShippingMethod = z.infer<typeof orderShippingMethodSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type DoaClaimReviewStatus = z.infer<typeof doaClaimReviewStatusSchema>;
export type ReviewType = z.infer<typeof reviewTypeSchema>;
export type WatchlistType = z.infer<typeof watchlistTypeSchema>;
export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type PlanSlug = z.infer<typeof planSlugSchema>;
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;
export type PaymentProviderType = z.infer<typeof paymentProviderTypeSchema>;
export type PromoType = z.infer<typeof promoTypeSchema>;
export type CreditStatus = z.infer<typeof creditStatusSchema>;
export type HelpContentType = z.infer<typeof helpContentTypeSchema>;
export type HelpCategory = z.infer<typeof helpCategorySchema>;
