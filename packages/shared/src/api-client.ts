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
