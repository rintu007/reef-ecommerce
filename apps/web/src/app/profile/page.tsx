"use client";

import { useEffect, useState } from "react";
import { getOwnProfile, updateOwnProfile, ApiError, type Profile } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { uploadPhoto } from "@/lib/uploads";
import { PayoutsSection } from "./PayoutsSection";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOwnProfile(apiClient)
      .then(({ profile }) => {
        setProfile(profile);
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setLocation(profile.location ?? "");
        setCountry(profile.country ?? "");
        setAvatarUrl(profile.avatar_url);
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
        avatar_url: avatarUrl,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
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

      <div className="mb-6">
        <PayoutsSection />
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
    </div>
  );
}
