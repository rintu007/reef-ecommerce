import { Waves, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function UserNotRegisteredError() {
  const handleSignOut = () => {
    base44.auth.logout(window.location.origin + "/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-5 text-center">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">Reef Market</span>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
          <Mail className="w-8 h-8 text-orange-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Account Not Found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This account isn't registered on Reef Market yet. You may have signed in with the wrong Google account, or you need to be invited to join.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 text-left w-full space-y-2">
          <p className="text-xs font-semibold text-foreground">What to do:</p>
          <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>Make sure you're signing in with the correct Google account</li>
            <li>Check your email for an invitation from Reef Market</li>
            <li>Contact support if you believe this is a mistake</li>
          </ul>
        </div>

        <Button
          className="w-full h-11 rounded-xl font-semibold"
          variant="outline"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out &amp; Try Different Account
        </Button>

        <a
          href="mailto:support@reefmarket.app"
          className="text-xs text-primary underline underline-offset-2"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}