import { supabase } from "./supabase";
import { apiClient } from "./api-client";

export type UploadBucket = "listing-photos" | "avatars" | "tank-photos" | "service-photos";

/**
 * Same signed-URL flow as apps/web/src/lib/uploads.ts, adapted for a picked
 * image's local file URI instead of a browser File — fetch() can read a
 * file:// URI into a Blob on both iOS and Android via Expo's polyfill.
 */
export async function uploadPhotoFromUri(bucket: UploadBucket, uri: string, filename: string): Promise<string> {
  const { path, token, publicUrl } = await apiClient.post<{ path: string; token: string; publicUrl: string }>(
    "/api/uploads/sign",
    { bucket, filename },
  );

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, blob);
  if (error) throw error;

  return publicUrl;
}
