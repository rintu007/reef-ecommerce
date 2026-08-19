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
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data.user) return null;
    userId = data.user.id;
    email = data.user.email;
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
    .select("role, admin_permissions")
    .eq("id", userId)
    .single();
  if (profileError || !profile) return null;

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
