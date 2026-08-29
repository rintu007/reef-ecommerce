/**
 * Typed HTTP client for the Next.js backend (apps/web's Route Handlers under
 * app/api/**). Used by web Client Components and by apps/mobile alike — web
 * Server Components skip this and call apps/web/lib/server/* in-process
 * instead (see the rebuild plan's "Why Next.js-as-backend changes the shape
 * of things").
 *
 * Per-endpoint methods are added here alongside each Route Handler as it's
 * built (Step 4 of the rebuild sequencing), not guessed ahead of time —
 * keeps this file from drifting out of sync with what actually exists.
 */

import type {
  Announcement,
  AnnouncementCreateInput,
  AnnouncementUpdateInput,
  BlockedUser,
  BlockedUserCreateInput,
  CartCheckoutInput,
  CartCheckoutItemResult,
  CheckoutInput,
  FileDoaClaimInput,
  HelpContent,
  HelpContentCreateInput,
  HelpContentUpdateInput,
  Listing,
  ListingCreateInput,
  ListingUpdateInput,
  MembershipPlan,
  Message,
  Order,
  Profile,
  ProfileUpdateInput,
  PromoCode,
  PromoCodeCreateInput,
  PromoCodeUpdateInput,
  PublicProfile,
  Report,
  ReportCreateInput,
  Review,
  ReviewCreateInput,
  SavedSearch,
  SavedSearchCreateInput,
  SavedSearchUpdateInput,
  SendMessageInput,
  Service,
  ServiceCreateInput,
  ServiceUpdateInput,
  ShipOrderInput,
  UserSubscription,
} from "./types/entities";
import type { PlanSlug, ReportStatus, UserRole } from "./types/enums";
import type { AdminAnalytics, AdminStats } from "./types/admin";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface ApiClientConfig {
  /** Origin of the Next.js app, e.g. https://reefmarket.app (no trailing slash). */
  baseUrl: string;
  /** Resolves the current Supabase access token, or null when signed out (guest). */
  getAccessToken: () => Promise<string | null>;
}

export interface ApiClient {
  request<T>(path: string, init?: RequestInit): Promise<T>;
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T>;
  delete<T>(path: string, init?: RequestInit): Promise<T>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await config.getAccessToken();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(`${config.baseUrl}${path}`, { ...init, headers });
    const text = await res.text();
    const data = text ? safeJsonParse(text) : undefined;

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : undefined) ?? `Request to ${path} failed with ${res.status}`;
      throw new ApiError(res.status, message, data);
    }

    return data as T;
  }

  return {
    request,
    get: (path, init) => request(path, { ...init, method: "GET" }),
    post: (path, body, init) =>
      request(path, { ...init, method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: (path, body, init) =>
      request(path, { ...init, method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
    delete: (path, init) => request(path, { ...init, method: "DELETE" }),
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ============================================================== auth

export function forgotPassword(client: ApiClient, email: string) {
  return client.post<{ ok: true }>("/api/auth/forgot-password", { email });
}

// ============================================================== listings

export interface ListingBrowseParams {
  /** Exact-ID batch lookup (e.g. cart rehydration) — one round trip instead of N. */
  ids?: string[];
  market?: "saltwater" | "freshwater" | "both";
  listing_type?: string;
  category?: string;
  q?: string;
  min_price?: number;
  max_price?: number;
  shipping?: "local_pickup" | "shipping";
  featured?: boolean;
  seller_id?: string;
  status?: string;
  sort?: "newest" | "price_low" | "price_high" | "featured";
  lat?: number;
  lng?: number;
  radius_miles?: number;
  limit?: number;
  offset?: number;
}

export interface ListingLimitStatus {
  allowed: boolean;
  usage: { active: number; max: number };
}

function toQueryString(params: object): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export function listListings(client: ApiClient, params: ListingBrowseParams = {}) {
  return client.get<{ listings: Listing[]; total: number }>(`/api/listings${toQueryString(params)}`);
}

export function getListing(client: ApiClient, id: string) {
  return client.get<{ listing: Listing }>(`/api/listings/${id}`);
}

export function createListing(client: ApiClient, input: ListingCreateInput) {
  return client.post<{ listing: Listing }>("/api/listings", input);
}

export function updateListing(client: ApiClient, id: string, input: ListingUpdateInput) {
  return client.patch<{ listing: Listing }>(`/api/listings/${id}`, input);
}

export function deleteListing(client: ApiClient, id: string) {
  return client.delete<{ deleted: true }>(`/api/listings/${id}`);
}

export function getListingLimit(client: ApiClient) {
  return client.get<ListingLimitStatus>("/api/listings/limit");
}

// ============================================================== services

export interface ServiceBrowseParams {
  market?: "saltwater" | "freshwater";
  service_type?: string;
  provider_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export function listServices(client: ApiClient, params: ServiceBrowseParams = {}) {
  return client.get<{ services: Service[]; total: number }>(`/api/services${toQueryString(params)}`);
}

export function getService(client: ApiClient, id: string) {
  return client.get<{ service: Service }>(`/api/services/${id}`);
}

export function createService(client: ApiClient, input: ServiceCreateInput) {
  return client.post<{ service: Service }>("/api/services", input);
}

export function updateService(client: ApiClient, id: string, input: ServiceUpdateInput) {
  return client.patch<{ service: Service }>(`/api/services/${id}`, input);
}

export function deleteService(client: ApiClient, id: string) {
  return client.delete<{ deleted: true }>(`/api/services/${id}`);
}

// ============================================================== help content

export interface HelpContentBrowseParams {
  category?: string;
  market?: "saltwater" | "freshwater";
}

export function listHelpContent(client: ApiClient, params: HelpContentBrowseParams = {}) {
  return client.get<{ items: HelpContent[] }>(`/api/help-content${toQueryString(params)}`);
}

// ============================================================== announcements

export function getActiveAnnouncement(client: ApiClient) {
  return client.get<{ announcement: Announcement | null }>("/api/announcements");
}

// ============================================================== messaging

export interface ConversationSummary {
  id: string;
  listing_id: string | null;
  last_message_at: string | null;
  created_at: string;
  other_participant: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message: { content: string; sender_id: string; created_at: string } | null;
  unread_count: number;
}

export function listConversations(client: ApiClient) {
  return client.get<{ conversations: ConversationSummary[] }>("/api/conversations");
}

export interface ConversationThread {
  id: string;
  listing_id: string | null;
  other_participant: { id: string; display_name: string | null; avatar_url: string | null };
  messages: Message[];
}

export function getConversationMessages(client: ApiClient, conversationId: string) {
  return client.get<ConversationThread>(`/api/conversations/${conversationId}/messages`);
}

export function sendMessage(client: ApiClient, input: SendMessageInput) {
  return client.post<{ message: Message }>("/api/messages", input);
}

// ============================================================== profile

export function getOwnProfile(client: ApiClient) {
  return client.get<{ profile: Profile }>("/api/profile");
}

export function updateOwnProfile(client: ApiClient, input: ProfileUpdateInput) {
  return client.patch<{ profile: Profile }>("/api/profile", input);
}

export function deleteOwnAccount(client: ApiClient) {
  return client.delete<{ anonymized: boolean }>("/api/profile");
}

export function agreeSellerTerms(client: ApiClient) {
  return client.post<{ profile: Profile }>("/api/profile/seller-agreement");
}

export function acceptEula(client: ApiClient) {
  return client.post<{ profile: Profile }>("/api/profile/eula");
}

export function getPublicProfile(client: ApiClient, id: string) {
  return client.get<{ profile: PublicProfile }>(`/api/profiles/${id}`);
}

export interface SellerStorefront {
  profile: PublicProfile;
  listings: Listing[];
  reviews: SellerReviewSummary;
}

/** profile + listings + reviews in one round trip — see api/sellers/[id]/storefront/route.ts. */
export function getSellerStorefront(client: ApiClient, sellerId: string) {
  return client.get<SellerStorefront>(`/api/sellers/${sellerId}/storefront`);
}

// ============================================================== admin

export function getAdminStats(client: ApiClient) {
  return client.get<AdminStats>("/api/admin/stats");
}

export function getAdminAnalytics(client: ApiClient) {
  return client.get<AdminAnalytics>("/api/admin/analytics");
}

export function listAdminOrders(client: ApiClient, params: { limit?: number } = {}) {
  return client.get<{ orders: Order[] }>(`/api/admin/orders${toQueryString(params)}`);
}

export function listAdminUsers(client: ApiClient, params: { q?: string; limit?: number; offset?: number } = {}) {
  return client.get<{ users: Profile[]; total: number }>(`/api/admin/users${toQueryString(params)}`);
}

export function updateUserRole(client: ApiClient, id: string, role: UserRole) {
  return client.patch<{ profile: Profile }>(`/api/admin/users/${id}`, { role });
}

export function banUser(client: ApiClient, id: string, ban: boolean) {
  return client.post<{ profile: Profile }>(`/api/admin/users/${id}/ban`, { ban });
}

export function adminDeleteUser(client: ApiClient, id: string) {
  return client.delete<{ anonymized: boolean }>(`/api/admin/users/${id}`);
}

export interface UserActivityStats {
  totalPurchases: number;
  totalSpent: number;
  totalSales: number;
  totalRevenue: number;
  activeListings: number;
  totalListings: number;
  lastActive: string | null;
}

export function getUserActivityStats(client: ApiClient, id: string) {
  return client.get<UserActivityStats>(`/api/admin/users/${id}/stats`);
}

export function grantPromoToUser(client: ApiClient, id: string, code: string) {
  return client.post<{ granted: string }>(`/api/admin/users/${id}/grant-promo`, { code });
}

export interface AdminReport extends Report {
  reporter: { id: string; display_name: string | null; email: string } | null;
  reported: { id: string; display_name: string | null; email: string } | null;
  listing: { id: string; title: string } | null;
}

export function listAdminReports(client: ApiClient, params: { status?: ReportStatus; limit?: number; offset?: number } = {}) {
  return client.get<{ reports: AdminReport[]; total: number }>(`/api/admin/reports${toQueryString(params)}`);
}

export function updateReportStatus(client: ApiClient, id: string, status: ReportStatus) {
  return client.patch<{ report: Report }>(`/api/admin/reports/${id}`, { status });
}

export function listAdminAnnouncements(client: ApiClient, params: { limit?: number; offset?: number } = {}) {
  return client.get<{ announcements: Announcement[]; total: number }>(`/api/admin/announcements${toQueryString(params)}`);
}

export function createAnnouncement(client: ApiClient, input: AnnouncementCreateInput) {
  return client.post<{ announcement: Announcement }>("/api/admin/announcements", input);
}

export function updateAnnouncement(client: ApiClient, id: string, input: AnnouncementUpdateInput) {
  return client.patch<{ announcement: Announcement }>(`/api/admin/announcements/${id}`, input);
}

export function deleteAnnouncement(client: ApiClient, id: string) {
  return client.delete<{ deleted: true }>(`/api/admin/announcements/${id}`);
}

export interface BroadcastInput {
  subject: string;
  message: string;
  sendEmail: boolean;
  sendPopup: boolean;
  maxViews: number;
  showToGuests: boolean;
}

export interface BroadcastResult {
  popupCreated: boolean;
  emailsSent: number;
  emailsFailed: number;
}

export function broadcastAnnouncement(client: ApiClient, input: BroadcastInput) {
  return client.post<BroadcastResult>("/api/admin/announcements/broadcast", input);
}

export function listAdminHelpContent(client: ApiClient, params: { limit?: number; offset?: number } = {}) {
  return client.get<{ items: HelpContent[]; total: number }>(`/api/admin/help-content${toQueryString(params)}`);
}

export function createHelpContent(client: ApiClient, input: HelpContentCreateInput) {
  return client.post<{ item: HelpContent }>("/api/admin/help-content", input);
}

export function updateHelpContent(client: ApiClient, id: string, input: HelpContentUpdateInput) {
  return client.patch<{ item: HelpContent }>(`/api/admin/help-content/${id}`, input);
}

export function deleteHelpContent(client: ApiClient, id: string) {
  return client.delete<{ deleted: true }>(`/api/admin/help-content/${id}`);
}

// ============================================================== saved searches

export function listSavedSearches(client: ApiClient) {
  return client.get<{ savedSearches: SavedSearch[] }>("/api/saved-searches");
}

export function createSavedSearch(client: ApiClient, input: SavedSearchCreateInput) {
  return client.post<{ savedSearch: SavedSearch }>("/api/saved-searches", input);
}

export function updateSavedSearch(client: ApiClient, id: string, input: SavedSearchUpdateInput) {
  return client.patch<{ savedSearch: SavedSearch }>(`/api/saved-searches/${id}`, input);
}

export function deleteSavedSearch(client: ApiClient, id: string) {
  return client.delete<{ deleted: true }>(`/api/saved-searches/${id}`);
}

// ============================================================== reports / blocked users

export function createReport(client: ApiClient, input: ReportCreateInput) {
  return client.post<{ report: Report }>("/api/reports", input);
}

export function listBlockedUsers(client: ApiClient) {
  return client.get<{ blockedUsers: BlockedUser[] }>("/api/blocked-users");
}

export function blockUser(client: ApiClient, input: BlockedUserCreateInput) {
  return client.post<{ blockedUser: BlockedUser }>("/api/blocked-users", input);
}

export function unblockUser(client: ApiClient, blockedId: string) {
  return client.delete<{ deleted: true }>(`/api/blocked-users/${blockedId}`);
}

// ============================================================== promo codes

export function redeemPromoCode(client: ApiClient, code: string) {
  return client.post<{ granted: string }>("/api/promo-codes/redeem", { code });
}

export function listAdminPromoCodes(client: ApiClient, params: { limit?: number; offset?: number } = {}) {
  return client.get<{ promoCodes: PromoCode[]; total: number }>(`/api/admin/promo-codes${toQueryString(params)}`);
}

export function createPromoCode(client: ApiClient, input: PromoCodeCreateInput) {
  return client.post<{ promoCode: PromoCode }>("/api/admin/promo-codes", input);
}

export function updatePromoCode(client: ApiClient, id: string, input: PromoCodeUpdateInput) {
  return client.patch<{ promoCode: PromoCode }>(`/api/admin/promo-codes/${id}`, input);
}

export function deletePromoCode(client: ApiClient, id: string) {
  return client.delete<{ deleted: true }>(`/api/admin/promo-codes/${id}`);
}

// ============================================================== membership / subscriptions

export function listMembershipPlans(client: ApiClient) {
  return client.get<{ plans: MembershipPlan[] }>("/api/membership-plans");
}

export function getOwnSubscription(client: ApiClient) {
  return client.get<{ subscription: UserSubscription | null; plan: MembershipPlan }>("/api/subscriptions");
}

export function createSubscriptionCheckout(client: ApiClient, planSlug: PlanSlug) {
  return client.post<{ url: string }>("/api/subscriptions/checkout", { plan_slug: planSlug });
}

export function cancelSubscription(client: ApiClient) {
  return client.post<{ subscription: UserSubscription }>("/api/subscriptions/cancel");
}

// ============================================================== watchlist

export function listWatchlist(client: ApiClient) {
  return client.get<{ listings: Listing[] }>("/api/watchlist");
}

export function addToWatchlist(client: ApiClient, listingId: string) {
  return client.post<{ saved: true }>("/api/watchlist", { listing_id: listingId });
}

export function removeFromWatchlist(client: ApiClient, listingId: string) {
  return client.delete<{ saved: false }>(`/api/watchlist/${listingId}`);
}

// ============================================================== orders / payments

export function getPayoutStatus(client: ApiClient) {
  return client.get<{ connected: boolean; payoutsEnabled: boolean }>("/api/payouts/status");
}

export function createPayoutOnboardingLink(client: ApiClient) {
  return client.post<{ url: string }>("/api/payouts/onboarding-link");
}

export interface SellerDashboardMetrics {
  activeListings: number;
  totalRevenue: number;
  pendingOrders: number;
  totalViews: number;
}

/** Legacy parity: reef-trade-flow's SellerDashboard.jsx "at a glance" metrics grid. */
export function getSellerDashboardMetrics(client: ApiClient) {
  return client.get<SellerDashboardMetrics>("/api/seller/dashboard");
}

export function checkout(client: ApiClient, input: CheckoutInput) {
  return client.post<{ order: Order; clientSecret: string | null }>("/api/orders/checkout", input);
}

export function checkoutCart(client: ApiClient, input: CartCheckoutInput) {
  return client.post<{ results: CartCheckoutItemResult[] }>("/api/cart/checkout", input);
}

export function listOrders(client: ApiClient, role: "buyer" | "seller") {
  return client.get<{ orders: Order[] }>(`/api/orders?role=${role}`);
}

export function getOrder(client: ApiClient, id: string) {
  return client.get<{ order: Order }>(`/api/orders/${id}`);
}

export function cancelOrder(client: ApiClient, id: string) {
  return client.post<{ order: Order }>(`/api/orders/${id}/cancel`);
}

export function deleteOrder(client: ApiClient, id: string) {
  return client.delete<{ deleted: true }>(`/api/orders/${id}`);
}

export function shipOrder(client: ApiClient, id: string, input: ShipOrderInput) {
  return client.post<{ order: Order }>(`/api/orders/${id}/ship`, input);
}

export function confirmReceipt(client: ApiClient, id: string) {
  return client.post<{ order: Order }>(`/api/orders/${id}/confirm-receipt`);
}

export function markPickedUp(client: ApiClient, id: string) {
  return client.post<{ order: Order }>(`/api/orders/${id}/mark-picked-up`);
}

export function confirmPickup(client: ApiClient, id: string) {
  return client.post<{ order: Order }>(`/api/orders/${id}/confirm-pickup`);
}

export function denyPickup(client: ApiClient, id: string) {
  return client.post<{ order: Order }>(`/api/orders/${id}/deny-pickup`);
}

export function refundOrder(client: ApiClient, id: string, mode: "refund" | "store_credit") {
  return client.post<{ order: Order }>(`/api/admin/orders/${id}/refund`, { mode });
}

export function fileDoaClaim(client: ApiClient, id: string, input: FileDoaClaimInput) {
  return client.post<{ order: Order }>(`/api/orders/${id}/dispute`, input);
}

export function denyDoaClaim(client: ApiClient, id: string) {
  return client.post<{ order: Order }>(`/api/admin/orders/${id}/deny-claim`);
}

// ============================================================== reviews

export function createReview(client: ApiClient, input: ReviewCreateInput) {
  return client.post<{ review: Review }>("/api/reviews", input);
}

export interface SellerReviewSummary {
  reviews: (Review & { reviewer: { id: string; display_name: string | null; avatar_url: string | null } | null })[];
  averageRating: number | null;
  count: number;
}

export function getSellerReviews(client: ApiClient, sellerId: string) {
  return client.get<SellerReviewSummary>(`/api/sellers/${sellerId}/reviews`);
}

// ============================================================== support

export interface SupportMessageInput {
  name: string;
  email: string;
  type: "question" | "feedback" | "bug" | "other";
  message: string;
}

/** Public — no auth required. Legacy parity: reef-trade-flow's Support page contact form. */
export function submitSupportMessage(client: ApiClient, input: SupportMessageInput) {
  return client.post<{ sent: true }>("/api/support", input);
}
