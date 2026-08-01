import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export default function FeaturedCarousel({ listings }) {
  if (!listings?.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground">Featured</h2>
        <Link to="/browse?featured=true" className="text-primary text-sm font-medium flex items-center gap-0.5">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory">
        {listings.map((listing) => {
          const photo = listing.photos?.[0] || "https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&q=80";
          return (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              className="snap-start shrink-0 w-72 rounded-2xl overflow-hidden relative group"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={photo}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {listing.wysiwyg && (
                  <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-2 mb-2">WYSIWYG</Badge>
                )}
                <h3 className="text-white font-bold text-base leading-tight">{listing.title}</h3>
                <p className="text-white/90 font-bold text-xl mt-1">${listing.price?.toFixed(2)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}