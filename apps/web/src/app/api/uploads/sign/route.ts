import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { handleRouteError } from "@/lib/server/http";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

const ALLOWED_BUCKETS = ["listing-photos", "avatars", "tank-photos", "service-photos"] as const;

const bodySchema = z.object({
  bucket: z.enum(ALLOWED_BUCKETS),
  filename: z.string().min(1),
});

function sanitizedObjectPath(userId: string, filename: string): string {
  const extMatch = filename.match(/\.[a-zA-Z0-9]{1,8}$/);
  const ext = extMatch ? extMatch[0].toLowerCase() : "";
  return `${userId}/${randomUUID()}${ext}`;
}

/**
 * Mints a signed upload URL scoped to the caller's own folder — see
 * supabase/migrations/20260801000006_storage.sql: bucket RLS is a
 * defense-in-depth fallback, this Route Handler is the real authorization.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    const { bucket, filename } = bodySchema.parse(body);

    const objectPath = sanitizedObjectPath(user.id, filename);

    const db = supabaseAdmin();
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(objectPath);
    if (error) throw error;

    const {
      data: { publicUrl },
    } = db.storage.from(bucket).getPublicUrl(objectPath);

    return NextResponse.json({ path: objectPath, token: data.token, publicUrl });
  } catch (error) {
    return handleRouteError(error);
  }
}
