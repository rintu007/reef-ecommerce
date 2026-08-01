import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TYPE_CARDS = [
  {
    type: "fw_fish",
    label: "Fish",
    emoji: "🐟",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/97c4ff06f_generated_image.png",
    gradient: "from-blue-500/70 to-teal-800/80",
  },
  {
    type: "fw_amphibian",
    label: "Amphibians",
    emoji: "🦎",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/ed51dee64_generated_image.png",
    gradient: "from-pink-500/70 to-purple-900/80",
  },
  {
    type: "fw_turtle",
    label: "Turtles",
    emoji: "🐢",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/098a5f3d4_generated_image.png",
    gradient: "from-green-600/70 to-emerald-900/80",
  },
  {
    type: "fw_other",
    label: "Inverts / Other",
    emoji: "🦐",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/dd8a4e248_generated_image.png",
    gradient: "from-teal-600/70 to-cyan-900/80",
  },
  {
    type: "fw_other",
    label: "Plants",
    emoji: "🌿",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/8ed3e72b5_generated_image.png",
    gradient: "from-green-600/70 to-emerald-900/80",
    categoryFilter: "Plants",
  },
  {
    type: "fw_equipment",
    label: "Equipment",
    emoji: "⚙️",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/a41c5aec0_generated_image.png",
    gradient: "from-slate-600/70 to-slate-900/80",
  },
];

export default function FreshwaterCategoryBrowser() {
  const navigate = useNavigate();

  return (
    <div className="px-4">
      <h2 className="text-lg font-bold text-foreground mb-3">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-3">
        {TYPE_CARDS.map(({ type, label, emoji, image, gradient, categoryFilter }) => (
          <button
            key={label}
            onClick={() => categoryFilter
              ? navigate(`/browse?type=${type}&category=${encodeURIComponent(categoryFilter)}&market=freshwater`)
              : navigate(`/category/${type}`)
            }
            className="relative rounded-xl overflow-hidden aspect-square group focus:outline-none"
          >
            <img src={image} alt={label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className={cn("absolute inset-0 bg-gradient-to-t", gradient)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span className="text-2xl mb-1">{emoji}</span>
              <span className="text-xs font-bold text-center leading-tight px-1">{label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}