import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Waves, LogIn, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { safeStorage } from "@/lib/safe-storage";

const STAY_SIGNED_IN_KEY = "reef_stay_signed_in";

export default function GuestLoginScreen({ onLogin, onGuest }) {
  const [staySignedIn, setStaySignedIn] = useState(() => {
    return safeStorage.getItem(STAY_SIGNED_IN_KEY) === "true";
  });

  const handleLogin = () => {
    safeStorage.setItem(STAY_SIGNED_IN_KEY, String(staySignedIn));
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">Reef Market</span>
        </div>

        <p className="text-center text-muted-foreground text-sm">
          The aquatic marketplace for hobbyists — buy and sell corals, fish, and equipment.
        </p>

        <p className="text-center text-xs text-muted-foreground bg-muted/60 rounded-xl px-4 py-2.5">
          You'll be taken to a secure sign-in page to create your <strong>Reef Market</strong> account or log in.
        </p>

        {/* Sign In */}
        <Button className="w-full h-12 rounded-xl text-base font-bold" onClick={handleLogin}>
          <LogIn className="w-5 h-5 mr-2" />
          Sign In / Create Account
        </Button>

        {/* Stay signed in checkbox */}
        <label className="flex items-center gap-3 cursor-pointer w-full px-1">
          <input
            type="checkbox"
            checked={staySignedIn}
            onChange={(e) => {
              setStaySignedIn(e.target.checked);
              safeStorage.setItem(STAY_SIGNED_IN_KEY, String(e.target.checked));
            }}
            className="w-4 h-4 accent-primary rounded"
          />
          <span className="text-sm text-muted-foreground">Stay signed in</span>
        </label>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Guest */}
        <button
          onClick={onGuest}
          className="w-full flex flex-col items-center gap-1 py-4 px-5 rounded-xl border border-border bg-card hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Eye className="w-4 h-4" />
            Continue as Guest
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Browse listings — no account required
          </p>
        </button>

      <p className="text-center text-xs text-muted-foreground mt-2">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link>
          {" "}and{" "}
          <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}