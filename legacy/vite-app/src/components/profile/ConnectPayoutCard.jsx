import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { BadgeDollarSign, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function ConnectPayoutCard({ userEmail }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: account, isLoading } = useQuery({
    queryKey: ["seller-payout-account", userEmail],
    queryFn: async () => {
      const accounts = await base44.entities.SellerPayoutAccount.filter({ user_email: userEmail });
      return accounts[0] || null;
    },
    enabled: !!userEmail,
  });

  const handleConnect = async () => {
    setLoading(true);
    const res = await base44.functions.invoke("createConnectAccount", {});

    if (res.data?.already_onboarded) {
      toast.success("Your payout account is already set up!");
      queryClient.invalidateQueries({ queryKey: ["seller-payout-account"] });
    } else if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error("Could not start onboarding. Please try again.");
    }
    setLoading(false);
  };

  if (isLoading) return null;

  const isReady = account?.payouts_enabled && account?.onboarding_complete;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-border bg-card p-4">
      {isReady ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Payout Account Connected</p>
            <p className="text-xs text-muted-foreground">You'll receive payments directly via Stripe</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">Set Up Payouts</p>
              <p className="text-xs text-muted-foreground">Connect Stripe to receive money from sales</p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl h-8 text-xs shrink-0" onClick={handleConnect} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
              <><ExternalLink className="w-3.5 h-3.5 mr-1" /> Connect</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}