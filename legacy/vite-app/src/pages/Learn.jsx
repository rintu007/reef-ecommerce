import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Play, BookOpen, Lightbulb, HelpCircle, ArrowLeft, ChevronRight } from "lucide-react";
import { HELP_CATEGORIES } from "@/lib/categories";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/);
  return match?.[1] || null;
}

const CATEGORY_VISUALS = {
  coral_care: { bg: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80", desc: "Lighting, flow, placement & fragging tips" },
  fish_care: { bg: "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=800&q=80", desc: "Species profiles, compatibility & tank sizing" },
  beginner_setup: { bg: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80", desc: "Start your reef journey right" },
  fragging_tips: { bg: "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80", desc: "Propagate & trade corals like a pro" },
  lighting_flow: { bg: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80", desc: "PAR, spectrum, flow rates & placement" },
  water_chemistry: { bg: "https://images.unsplash.com/photo-1565120130276-dfbd9a7a3ad7?w=800&q=80", desc: "Alk, calcium, magnesium & more" },
  pest_prevention: { bg: "https://images.unsplash.com/photo-1620503374956-c942862f0372?w=800&q=80", desc: "Ich, velvet, water quality issues & fixes" },
  shipping_acclimation: { bg: "https://images.unsplash.com/photo-1570824104453-508955ab713e?w=800&q=80", desc: "Safe transport & drip acclimation" },
  maintenance: { bg: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=800&q=80", desc: "Filters, lights, skimmers, dosing & more" },
};

const typeIcons = { video: Play, article: BookOpen, tip: Lightbulb, faq: HelpCircle };

function CategoryDetailScreen({ category, content, onBack }) {
  const catInfo = HELP_CATEGORIES.find(c => c.value === category);
  const items = content.filter(item => {
    const allCats = [item.category, ...(item.categories || [])];
    return allCats.includes(category);
  });

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-1 -ml-1 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-bold text-base leading-tight">{catInfo?.icon} {catInfo?.label}</h1>
          <p className="text-xs text-muted-foreground">{items.length} guide{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No content yet. Check back soon!</p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          {items.map(item => {
            const ytId = getYouTubeId(item.youtube_url);
            const Icon = typeIcons[item.content_type] || BookOpen;
            return (
              <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {item.content_type === "video" && ytId && (
                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${ytId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                {item.thumbnail_url && item.content_type !== "video" && (
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Icon className="w-3 h-3" /> {item.content_type}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base">{item.title}</h3>
                  {item.body && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{item.body}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const { data: content = [], isLoading } = useQuery({
    queryKey: ["help-content"],
    queryFn: () => base44.entities.HelpContent.filter({ published: true }, "order", 100),
  });

  if (selectedCategory) {
    return (
      <CategoryDetailScreen
        category={selectedCategory}
        content={content}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary/60 px-4 pt-10 pb-8 text-white text-center">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative">
          <p className="text-3xl mb-1">≋</p>
          <h1 className="text-2xl font-extrabold">Learn & Explore</h1>
          <p className="text-sm text-white/80 mt-1">Guides, tips & care info for hobbyists</p>
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="mx-4 mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
        <span className="text-xl shrink-0">🚧</span>
        <div>
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">We're building our help library!</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">More care guides, videos & tips are coming soon. Check back regularly for new content.</p>
        </div>
      </div>

      {/* Category list */}
      <div className="px-4 pt-3 space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : (
          HELP_CATEGORIES.map(cat => {
            const visuals = CATEGORY_VISUALS[cat.value] || {};
            const count = content.filter(item => {
              const allCats = [item.category, ...(item.categories || [])];
              return allCats.includes(cat.value);
            }).length;

            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className="w-full relative rounded-2xl overflow-hidden h-20 flex items-center text-left"
              >
                {/* Background image */}
                {visuals.bg && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${visuals.bg})` }}
                  />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50" />
                {/* Content */}
                <div className="relative flex items-center gap-3 px-4 flex-1 min-w-0">
                  <span className="text-2xl shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight">{cat.label}</p>
                    <p className="text-white/70 text-xs mt-0.5 truncate">{visuals.desc || ""}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {count > 0 && (
                      <span className="text-[10px] text-white/60">{count}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/70" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}