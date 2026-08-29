"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteOwnAccount, getOwnProfile, updateOwnProfile, ApiError, LANGUAGES, type LanguageCode, type Profile } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { useLanguagePrefs } from "@/lib/language-context";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { uploadPhoto } from "@/lib/uploads";
import { BlockedUsersSection } from "./BlockedUsersSection";
import { PayoutsSection } from "./PayoutsSection";
import { PromoCodeSection } from "./PromoCodeSection";
import { SavedSearchesSection } from "./SavedSearchesSection";
import { SubscriptionSection } from "./SubscriptionSection";

export default function ProfilePage() {
  const router = useRouter();
  const { savePrefs } = useLanguagePrefs();
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tankPhotos, setTankPhotos] = useState<string[]>([]);
  const [uploadingTankPhoto, setUploadingTankPhoto] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getOwnProfile(apiClient)
      .then(({ profile }) => {
        setProfile(profile);
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setLocation(profile.location ?? "");
        setCountry(profile.country ?? "");
        setLanguage(profile.language);
        setAvatarUrl(profile.avatar_url);
        setTankPhotos(profile.tank_photos);
        setSignedIn(true);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setSignedIn(false);
        else setError(err instanceof Error ? err.message : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAvatarSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const url = await uploadPhoto("avatars", file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleTankPhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingTankPhoto(true);
    setError(null);
    try {
      const url = await uploadPhoto("tank-photos", file);
      setTankPhotos((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tank photo upload failed");
    } finally {
      setUploadingTankPhoto(false);
    }
  }

  function handleRemoveTankPhoto(url: string) {
    setTankPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const { profile: updated } = await updateOwnProfile(apiClient, {
        display_name: displayName || null,
        bio: bio || null,
        location: location || null,
        country: country || null,
        language,
        avatar_url: avatarUrl,
        tank_photos: tankPhotos,
      });
      setProfile(updated);
      setSaved(true);
      // Keep the app-wide language context in sync so useT() picks up the
      // change immediately, without waiting for a reload — see language-context.tsx.
      savePrefs(updated.language, updated.country ?? "US");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("Delete your account? This can't be undone. You'll be signed out immediately.")) return;

    setDeleting(true);
    try {
      await deleteOwnAccount(apiClient);
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/browse");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  }

  if (loading) return null;

  if (!signedIn) {
    return (
      <div className="max-w-sm mx-auto p-6 mt-12 text-center">
        <p className="text-gray-700 mb-4">Sign in to view your profile.</p>
        <a href="/sign-in" className="text-blue-600 hover:underline text-sm font-semibold">
          Go to Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="mb-6 space-y-4">
        <SubscriptionSection />
        <PayoutsSection />
        <SavedSearchesSection />
        <PromoCodeSection />
        <BlockedUsersSection />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl overflow-hidden shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                "👤"
              )}
            </div>
            <label className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold cursor-pointer hover:bg-gray-50">
              {uploadingAvatar ? "Uploading…" : "Change Avatar"}
              <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tank Photos</label>
          <div className="flex flex-wrap gap-2">
            {tankPhotos.map((url) => (
              <div key={url} className="relative w-20 h-20 rounded-lg bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveTankPhoto(url)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500 cursor-pointer hover:bg-gray-50">
              {uploadingTankPhoto ? "…" : "+"}
              <input type="file" accept="image/*" onChange={handleTankPhotoSelect} className="hidden" disabled={uploadingTankPhoto} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="display_name">
            Display Name
          </label>
          <input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="US"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="language">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {profile && (
          <div className="flex gap-4 text-sm text-gray-500">
            {profile.verified_seller && (
              <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                ✓ Verified Seller
              </span>
            )}
            <span>{profile.completed_sales_count} completed sales</span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Saved.</p>}

        <button
          type="submit"
          disabled={saving || uploadingAvatar}
          className="w-full rounded-lg bg-blue-600 text-white text-sm font-semibold py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete Account"}
        </button>
      </div>

      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <a href="/support" className="hover:underline">Help &amp; Feedback</a>
        <a href="/terms" className="hover:underline">Terms of Service</a>
        <a href="/privacy" className="hover:underline">Privacy Policy</a>
      </div>
    </div>
  );
}
