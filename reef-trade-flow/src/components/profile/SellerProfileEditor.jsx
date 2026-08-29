import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function SellerProfileEditor({ me, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(me.display_name || "");
  const [about, setAbout] = useState(me.about || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ logo_url: file_url });
    onUpdate?.({ ...me, logo_url: file_url });
    toast.success("Logo updated!");
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ display_name: displayName, about });
    onUpdate?.({ ...me, display_name: displayName, about });
    toast.success("Profile updated!");
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setDisplayName(me.display_name || "");
    setAbout(me.about || "");
    setEditing(false);
  };

  return (
    <div className="px-4 mt-4">
      <div className="bg-muted/50 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Seller Profile</h3>
          {!editing ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={() => setEditing(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleCancel}>
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" className="h-8 gap-1 text-xs rounded-xl" onClick={handleSave} disabled={saving}>
                <Check className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          )}
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {me.logo_url ? (
              <img src={me.logo_url} alt="logo" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                <span className="text-2xl font-bold text-primary">
                  {(me.display_name || me.full_name || me.email || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed">
            {uploading ? "Uploading..." : "Tap the camera icon to upload your logo or profile photo."}
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Display Name (shown to buyers)</label>
          {editing ? (
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={me.full_name || "Your store name..."}
              className="rounded-xl text-sm"
              maxLength={40}
            />
          ) : (
            <p className="text-sm font-medium">{me.display_name || <span className="text-muted-foreground italic">Not set — using account name</span>}</p>
          )}
        </div>

        {/* About */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">About You & Your Setup</label>
          {editing ? (
            <Textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell buyers about your reef experience, tank size, coral specialties..."
              className="rounded-xl text-sm resize-none"
              rows={4}
              maxLength={500}
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {me.about || <span className="italic">No bio yet. Tell buyers about your experience!</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}