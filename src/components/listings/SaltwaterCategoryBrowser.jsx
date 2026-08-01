import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const TYPE_CARDS = [
  {
    type: "coral",
    label: "Corals",
    emoji: "🪸",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/e20796bfe_generated_image.png",
    gradient: "from-cyan-500/70 to-blue-900/80",
  },
  {
    type: "fish",
    label: "Fish",
    emoji: "🐠",
    // clownfish and reef fish in a saltwater aquarium
    image: "https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=400&q=80",
    gradient: "from-blue-500/70 to-indigo-800/80",
  },
  {
    type: "equipment",
    label: "Equipment",
    emoji: "🔧",
    image: "https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/71a13208e_generated_image.png",
    gradient: "from-slate-600/70 to-slate-900/80",
  },
];

export default function SaltwaterCategoryBrowser() {
  const navigate = useNavigate();

  return (
    <div className="px-4">
      <h2 className="text-lg font-bold text-foreground mb-3">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-3">
        {TYPE_CARDS.map(({ type, label, emoji, image, gradient }) => (
          <button
            key={type}
            onClick={() => navigate(`/category/${type}`)}
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