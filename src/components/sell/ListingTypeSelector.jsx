import { cn } from "@/lib/utils";
import { useState } from "react";

const SALTWATER_TYPES = [
  { value: "coral", label: "Coral", emoji: "🪸", desc: "Frags, colonies & anemones", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/e20796bfe_generated_image.png" },
  { value: "fish", label: "Saltwater Fish", emoji: "🐠", desc: "Clownfish, tangs, wrasses...", image: "https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400&q=80" },
  { value: "equipment", label: "SW Equipment", emoji: "🔧", desc: "Tanks, lights, pumps...", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/71a13208e_generated_image.png" },
  { value: "sw_invert", label: "Crustaceans & Invertebrates", emoji: "🦀", desc: "Crabs, shrimp, urchins, starfish, snails...", image: "https://images.unsplash.com/photo-1559592413-7cbb00af1fb6?w=400&q=80" },
];

const FRESHWATER_TYPES = [
  { value: "fw_fish", label: "Freshwater Fish", emoji: "🐟", desc: "Cichlids, tetras, bettas, goldfish...", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/67df2e37b_generated_image.png" },
  { value: "fw_amphibian", label: "Amphibians", emoji: "🦎", desc: "Axolotls, frogs, newts...", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/e49fee415_generated_image.png" },
  { value: "fw_turtle", label: "Turtles", emoji: "🐢", desc: "Aquatic & semi-aquatic turtles", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/098a5f3d4_generated_image.png" },
  { value: "fw_other", label: "Other Freshwater", emoji: "🌿", desc: "Plants, inverts, feeders, bundles...", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/8c3afb853_generated_image.png" },
  { value: "fw_equipment", label: "FW Equipment", emoji: "⚙️", desc: "Filters, heaters, lights, tanks...", image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/4c2b2708e_generated_image.png" },
];

export default function ListingTypeSelector({ value, onChange }) {
  const [tab, setTab] = useState(
    FRESHWATER_TYPES.some(t => t.value === value) ? "freshwater" : "saltwater"
  );

  const types = tab === "saltwater" ? SALTWATER_TYPES : FRESHWATER_TYPES;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">What are you selling?</h2>

      {/* Market tab toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("saltwater")}
          className={cn(
            "flex-1 text-sm font-semibold py-2 rounded-xl transition-colors",
            tab === "saltwater" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
          )}
        >
          🪸 Saltwater
        </button>
        <button
          onClick={() => setTab("freshwater")}
          className={cn(
            "flex-1 text-sm font-semibold py-2 rounded-xl transition-colors",
            tab === "freshwater" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
          )}
        >
          🐟 Freshwater
        </button>
      </div>

      <div className="grid gap-3">
        {types.map((type) => (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={cn(
              "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left overflow-hidden",
              value === type.value
                ? "border-primary"
                : "border-border hover:border-primary/30"
            )}
          >
            {type.image && (
              <>
                <img src={type.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-card/60" />
              </>
            )}
            <span className="relative text-3xl">{type.emoji}</span>
            <div className="relative">
              <p className="font-semibold">{type.label}</p>
              <p className="text-xs text-muted-foreground">{type.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}