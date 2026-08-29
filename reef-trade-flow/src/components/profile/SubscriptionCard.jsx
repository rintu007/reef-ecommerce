import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionCard({ userEmail }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: subData, isLoading } = useQuery({
    queryKey: ["subscription", userEmail],
    queryFn: async () => {
      const res = await base44.functions.invoke("getSubscription", {});
      return res.data;
    },
    enabled: !!userEmail,
  });

  const isPro = subData?.plan?.slug === "pro" && subData?.subscription?.status === "active";

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("createStripeCheckout", {});
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error("Could not start checkout. Please try again.");
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your subscription? You'll keep access until the end of your billing period.")) return;
    setCancelling(true);
    const res = await base44.functions.invoke("cancelStripeSubscription", {});
    if (res.data?.success) {
      toast.success("Subscription cancelled.");
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    } else {
      toast.error(res.data?.error || "Could not cancel.");
    }
    setCancelling(false);
  };

  if (isLoading) return null;

  return (
    <div className="mx-4 mt-4 rounded-xl border border-border bg-card p-4">
      {isPro ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div>
              <p className="font-semibold text-sm">Hobbyist Premium</p>
              <p className="text-xs text-muted-foreground">$9.99/month · Active</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-destructive/70 h-8"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancel"}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Upgrade to Hobbyist Premium</p>
              <p className="text-xs text-muted-foreground">25 active listings · $9.99/month</p>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-xl shrink-0 h-8 text-xs"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Upgrade"}
          </Button>
        </div>
      )}
    </div>
  );
}