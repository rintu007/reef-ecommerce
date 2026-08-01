import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TankPhotos({ me, onUpdate }) {
  const [uploading, setUploading] = useState(false);

  const tankPhotos = me?.tank_photos || [];

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const updated = [...tankPhotos, file_url];
    await base44.auth.updateMe({ tank_photos: updated });
    onUpdate({ ...me, tank_photos: updated });
    toast.success("Photo added!");
    setUploading(false);
  };

  const handleRemove = async (idx) => {
    const updated = tankPhotos.filter((_, i) => i !== idx);
    await base44.auth.updateMe({ tank_photos: updated });
    onUpdate({ ...me, tank_photos: updated });
    toast.success("Photo removed");
  };

  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">My Tank 🪸</h2>
        <label className={`flex items-center gap-1.5 text-sm text-primary font-medium cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {uploading ? "Uploading..." : "Add Photo"}
        </label>
      </div>

      {tankPhotos.length === 0 ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl py-8 text-muted-foreground cursor-pointer hover:border-primary/40 transition-colors">
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          <Camera className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm font-medium">Show off your tank!</p>
          <p className="text-xs mt-0.5">Tap to upload photos</p>
        </label>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {tankPhotos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
              <img src={url} alt={`Tank photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Camera className="w-5 h-5 text-muted-foreground" />}
          </label>
        </div>
      )}
    </div>
  );
}