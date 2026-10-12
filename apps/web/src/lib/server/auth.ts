import type { AdminPermission } from "@reef-market/shared";
import { supabaseAdmin } from "./supabase-admin";
import { createSupabaseServerClient } from "./supabase-server-client";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "user";
  adminPermissions: string[];
}

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
  }
}

/**
 * Resolves the caller for a Route Handler, supporting both clients:
 *  - mobile sends `Authorization: Bearer <supabase-access-token>`
 *  - web relies on the Supabase cookie session (see supabase-server-client.ts)
 * Returns null when unauthenticated — callers decide whether that's fine
 * (public endpoints) or should become a 401 (see requireUser/requireAdmin).
 */
export async function getAuthenticatedUser(request?: Request): Promise<AuthUser | null> {
  const bearer = request?.headers.get("authorization");
  const token = bearer?.toLowerCase().startsWith("bearer ") ? bearer.slice(7).trim() : null;

  let userId: string | undefined;
  let email: string | undefined;

  if (token) {
    // getClaims verifies the JWT's signature locally against the project's
    // cached public keys (this project signs with ES256), instead of
    // getUser()'s network round trip to the Auth server on every single
    // authenticated request. The supabaseAdmin() singleton keeps the JWKS
    // cache warm across requests on the same function instance. Tradeoff:
    // a signed-out token stays valid until its 1h expiry — standard for JWT
    // auth. Bans are still enforced below via profiles.banned_at.
    const { data, error } = await supabaseAdmin().auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    userId = data.claims.sub;
    email = data.claims.email as string | undefined;
  } else {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    userId = data.user.id;
    email = data.user.email;
  }

  if (!userId || !email) return null;

  const { data: profile, error: profileError } = await supabaseAdmin()
    .from("profiles")
    .select("role, admin_permissions, banned_at")
    .eq("id", userId)
    .single();
  if (profileError || !profile || profile.banned_at) return null;

  return {
    id: userId,
    email,
    role: profile.role as AuthUser["role"],
    adminPermissions: (profile.admin_permissions as string[] | null) ?? [],
  };
}

export async function requireUser(request?: Request): Promise<AuthUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) throw new ApiAuthError("Authentication required", 401);
  return user;
}

export async function requireAdmin(request?: Request): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.role !== "admin") throw new ApiAuthError("Admin access required", 403);
  return user;
}

/** Narrower than requireAdmin — role='admin' is necessary but not sufficient for money-moving actions (refunds, store credit); the admin also needs this specific permission granted. */
export async function requireAdminPermission(request: Request | undefined, permission: AdminPermission): Promise<AuthUser> {
  const user = await requireAdmin(request);
  if (!user.adminPermissions.includes(permission)) {
    throw new ApiAuthError(`Missing admin permission: ${permission}`, 403);
  }
  return user;
}
