import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ListingCard from "@/components/listings/ListingCard";
import MobileSelect from "@/components/ui/MobileSelect";

export default function WatchlistTab({ userEmail }) {
  const queryClient = useQueryClient();
  const [newKeyword, setNewKeyword] = useState("");
  const [keywordMarket, setKeywordMarket] = useState("saltwater");
  const [addingKeyword, setAddingKeyword] = useState(false);

  // Fetch watchlist entries
  const { data: watchlist = [] } = useQuery({
    queryKey: ["watchlist", userEmail],
    queryFn: () => base44.entities.Watchlist.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const savedListings = watchlist.filter((w) => w.type === "listing");
  const keywordAlerts = watchlist.filter((w) => w.type === "keyword");

  // Fetch saved listing details
  const { data: listings = [] } = useQuery({
    queryKey: ["saved-listings", savedListings.map((s) => s.listing_id).join(",")],
    queryFn: async () => {
      if (savedListings.length === 0) return [];
      const ids = savedListings.map((s) => s.listing_id);
      const results = [];
      for (const id of ids) {
        try {
          const listing = await base44.entities.Listing.filter({ id });
          if (listing.length > 0) results.push(listing[0]);
        } catch (e) {
          // Listing may have been deleted
        }
      }
      return results;
    },
    enabled: savedListings.length > 0,
  });

  // Add keyword alert
  const addKeywordMutation = useMutation({
    mutationFn: async () => {
      if (!newKeyword.trim()) return;
      await base44.functions.invoke("toggleKeywordAlert", {
        keyword: newKeyword,
        market: keywordMarket,
        action: "add",
      });
    },
    onSuccess: () => {
      toast.success("Keyword alert added!");
      setNewKeyword("");
      queryClient.invalidateQueries({ queryKey: ["watchlist", userEmail] });
    },
    onError: () => toast.error("Failed to add keyword alert"),
  });

  // Remove keyword alert
  const removeKeywordMutation = useMutation({
    mutationFn: async (keyword) => {
      await base44.functions.invoke("toggleKeywordAlert", {
        keyword,
        action: "remove",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", userEmail] });
      toast.success("Keyword alert removed");
    },
  });

  // Remove saved listing
  const removeSavedMutation = useMutation({
    mutationFn: async (listingId) => {
      await base44.functions.invoke("toggleWatchlist", {
        listingId,
        action: "unsave",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", userEmail] });
    },
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="saved" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="saved">
            Saved Listings ({savedListings.length})
          </TabsTrigger>
          <TabsTrigger value="keywords">
            Keyword Alerts ({keywordAlerts.length})
          </TabsTrigger>
        </TabsList>

        {/* Saved Listings Tab */}
        <TabsContent value="saved" className="space-y-4">
          {listings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No saved listings yet</p>
              <p className="text-xs">Heart your favorite items to save them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing) => (
                <div key={listing.id} className="relative">
                  <ListingCard listing={listing} />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeSavedMutation.mutate(listing.id);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Keyword Alerts Tab */}
        <TabsContent value="keywords" className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                You'll get notified when sellers list items matching your keywords.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Add Keyword Alert</label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Yellow Tang"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  className="rounded-lg text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addKeywordMutation.mutate();
                    }
                  }}
                />
                <MobileSelect
                  value={keywordMarket}
                  onValueChange={setKeywordMarket}
                  options={[
                    { value: "saltwater", label: "Saltwater" },
                    { value: "freshwater", label: "Freshwater" },
                  ]}
                />
              </div>
              <Button
                size="sm"
                onClick={() => addKeywordMutation.mutate()}
                disabled={addKeywordMutation.isPending || !newKeyword.trim()}
                className="w-full rounded-lg"
              >
                {addKeywordMutation.isPending && (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                )}
                Add Alert
              </Button>
            </div>
          </div>

          {keywordAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No keyword alerts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {keywordAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {alert.keyword}
                    </Badge>
                    {alert.market && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {alert.market}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeKeywordMutation.mutate(alert.keyword)}
                    className="text-destructive hover:text-destructive/80 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}