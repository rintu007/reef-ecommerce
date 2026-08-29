import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, X, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function PhotoUploader({ photos, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState(null);
  const [originals, setOriginals] = useState({}); // index -> original url, to allow undo

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    const newPhotos = [...photos];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newPhotos.push(file_url);
    }
    onChange(newPhotos);
    setUploading(false);
  };

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const enhancePhoto = async (index) => {
    setEnhancingIndex(index);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt:
          "Enhance this aquarium product photo for a marketplace listing. Zoom in and reframe so the main subject (the coral, fish, or item) fills the whole picture and is the clear focal point. Make the colors pop with vivid, saturated, true-to-life tones. Clear up any cloudy, murky or hazy water so it looks clean and crisp. Improve sharpness, clarity and lighting so it looks professional. Keep it the exact same subject and realistic colors — do not add, remove or invent any objects.",
        existing_image_urls: [photos[index]],
      });
      if (result?.url) {
        setOriginals((prev) => ({ ...prev, [index]: photos[index] }));
        const newPhotos = [...photos];
        newPhotos[index] = result.url;
        onChange(newPhotos);
        toast.success("Photo enhanced! Tap undo if you prefer the original.");
      } else {
        toast.error("Couldn't enhance photo. Try again.");
      }
    } catch (e) {
      toast.error("Couldn't enhance photo. Try again.");
    }
    setEnhancingIndex(null);
  };

  const undoEnhance = (index) => {
    const orig = originals[index];
    if (!orig) return;
    const newPhotos = [...photos];
    newPhotos[index] = orig;
    onChange(newPhotos);
    setOriginals((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  return (
    <div>
      <p className="text-sm font-semibold mb-2">Photos</p>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {photos.map((url, i) => (
          <div key={i} className="shrink-0 w-24 flex flex-col gap-1">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              {enhancingIndex === i && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
            {originals[i] ? (
              <button
                onClick={() => undoEnhance(i)}
                disabled={enhancingIndex === i}
                className="flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground border border-border rounded-lg py-1 hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Undo
              </button>
            ) : (
              <button
                onClick={() => enhancePhoto(i)}
                disabled={enhancingIndex !== null}
                className="flex items-center justify-center gap-1 text-[10px] font-medium text-primary border border-primary/30 rounded-lg py-1 hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" /> Enhance
              </button>
            )}
          </div>
        ))}
        <label className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Add Photo</span>
            </>
          )}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {photos.length > 0 && (
        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" /> Tap "Enhance" to let AI sharpen and brighten a photo.
        </p>
      )}
    </div>
  );
}