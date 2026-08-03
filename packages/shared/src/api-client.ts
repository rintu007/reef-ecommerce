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
  Listing,
  ListingCreateInput,
  ListingUpdateInput,
  Message,
  Profile,
  ProfileUpdateInput,
  PublicProfile,
  Report,
  SendMessageInput,
} from "./types/entities";
import type { ReportStatus, UserRole } from "./types/enums";

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

// ============================================================== listings

export interface ListingBrowseParams {
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

export function getPublicProfile(client: ApiClient, id: string) {
  return client.get<{ profile: PublicProfile }>(`/api/profiles/${id}`);
}

// ============================================================== admin

export interface AdminStats {
  listings: { total: number; active: number; pending_approval: number; sold: number; removed: number };
  users: { total: number };
  reports: { pending: number };
  visitors: { total: number; last7Days: number; last30Days: number };
}

export function getAdminStats(client: ApiClient) {
  return client.get<AdminStats>("/api/admin/stats");
}

export function listAdminUsers(client: ApiClient, params: { q?: string; limit?: number; offset?: number } = {}) {
  return client.get<{ users: Profile[]; total: number }>(`/api/admin/users${toQueryString(params)}`);
}

export function updateUserRole(client: ApiClient, id: string, role: UserRole) {
  return client.patch<{ profile: Profile }>(`/api/admin/users/${id}`, { role });
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
