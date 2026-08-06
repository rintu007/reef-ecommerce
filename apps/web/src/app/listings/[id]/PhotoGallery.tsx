"use client";

import { useState } from "react";

export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = Math.min(index, photos.length - 1);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photos[current]} alt={title} className="w-full h-full object-cover" />
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(photos.length - 1, i + 1))}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === current ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
