import { apiClient } from "./api-client";
import { createSupabaseBrowserClient } from "./supabase-browser";

export type UploadBucket = "listing-photos" | "avatars" | "tank-photos" | "service-photos";

/** Signs an upload URL server-side, then uploads directly to Supabase Storage. */
export async function uploadPhoto(bucket: UploadBucket, file: File): Promise<string> {
  const { path, token, publicUrl } = await apiClient.post<{ path: string; token: string; publicUrl: string }>(
    "/api/uploads/sign",
    { bucket, filename: file.name }
  );

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file);
  if (error) throw error;

  return publicUrl;
}
