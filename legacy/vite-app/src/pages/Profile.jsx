import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useUserPrefs } from "@/lib/UserPrefsContext";
import { LANGUAGES, useT } from "@/lib/i18n";
import { COUNTRIES, getCountryName } from "@/lib/countries";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Star, Package, ShoppingBag, Settings, LogOut, Shield, ChevronRight, Trash2, Tag, HelpCircle, FileText, Globe
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { base44 as b44 } from "@/api/base44Client";
import SavedSearches from "@/components/profile/SavedSearches";
import ConnectPayoutCard from "@/components/profile/ConnectPayoutCard";
import SellerProfileEditor from "@/components/profile/SellerProfileEditor";
import WatchlistTab from "@/components/profile/WatchlistTab";
import ListingsTab from "@/components/profile/ListingsTab";
import TankPhotos from "@/components/profile/TankPhotos";

export default function Profile() {
  const { isAuthenticated, isLoadingAuth, navigateToLogin, logout } = useAuth();
  const { language, country, savePrefs } = useUserPrefs();
  const t = useT(language);
  const [showPrefsEditor, setShowPrefsEditor] = useState(false);
  const [editLang, setEditLang] = useState(language);
  const [editCountry, setEditCountry] = useState(country);
  const [me, setMe] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      base44.auth.me().then(setMe).catch(() => {});
    } else {
      setMe(null);
    }
  }, [isAuthenticated]);

  const handlePromoApply = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    const res = await b44.functions.invoke("applyPromoCode", { code: promoCode.trim() });
    if (res.data?.success) {
      toast.success(res.data.granted || "Promo applied!");
      setPromoCode("");
    } else {
      toast.error(res.data?.error || "Invalid promo code");
    }
    setApplyingPromo(false);
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ["my-reviews", me?.email],
    queryFn: () => base44.entities.Review.filter({ seller_email: me.email }),
    enabled: !!me && isAuthenticated,
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoadingAuth) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <p className="text-lg font-semibold">Sign in to view your profile</p>
        <p className="text-sm text-muted-foreground">Create an account or sign in to manage listings, orders, and more.</p>
        <button
          onClick={navigateToLogin}
          className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl text-sm"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  if (!me) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-blue-700 px-4 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
            {me.logo_url ? (
              <img src={me.logo_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {(me.display_name || me.full_name || me.email || "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{me.display_name || me.full_name || "Reef Seller"}</h1>
            <p className="text-white/70 text-sm">{me.email}</p>
            {avgRating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-white text-sm font-medium">{avgRating}</span>
                <span className="text-white/60 text-xs">({reviews.length} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">—</p>
            <p className="text-[10px] text-white/70">Active</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">—</p>
            <p className="text-[10px] text-white/70">Sold</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{reviews.length}</p>
            <p className="text-[10px] text-white/70">Reviews</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 mt-6 space-y-1">
        {me.role === "admin" && (
          <Link to="/admin" className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">Admin Dashboard</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        )}
        <Link to="/orders?tab=selling" className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">My Orders</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <button
          onClick={() => { setEditLang(language); setEditCountry(country); setShowPrefsEditor(!showPrefsEditor); }}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div className="text-left">
              <span className="font-medium text-sm block">{t("language_country")}</span>
              <span className="text-xs text-muted-foreground">{LANGUAGES.find(l => l.code === language)?.label} · {getCountryName(country) || "Not set"}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {showPrefsEditor && (
          <div className="mx-4 bg-muted rounded-xl p-4 space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("language")}</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <button key={l.code} onClick={() => setEditLang(l.code)}
                    className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors text-left ${editLang === l.code ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">{t("country")}</label>
              <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">— Select Country —</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { savePrefs(editLang, editCountry); setShowPrefsEditor(false); toast.success("Preferences saved!"); }}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2 text-sm font-semibold">{t("save")}</button>
              <button onClick={() => setShowPrefsEditor(false)}
                className="flex-1 border border-border rounded-xl py-2 text-sm">{t("cancel")}</button>
            </div>
          </div>
        )}

        <a href="https://reefmarketonline.com/support" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">Help & Feedback</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </a>
        <Link to="/terms" className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">Terms of Service</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <Link to="/privacy" className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">Privacy Policy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-muted transition-colors"
        >
          <LogOut className="w-5 h-5 text-destructive" />
          <span className="font-medium text-sm text-destructive">Sign Out</span>
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-muted transition-colors">
              <Trash2 className="w-5 h-5 text-destructive/70" />
              <span className="font-medium text-sm text-destructive/70">Delete Account</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove your account and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  await base44.functions.invoke("deleteUserAccount", {});
                  logout();
                }}
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tank Photos */}
      <TankPhotos me={me} onUpdate={setMe} />

      {/* Seller Profile Editor */}
      <SellerProfileEditor me={me} onUpdate={setMe} />

      {/* Seller Payout */}
      <ConnectPayoutCard userEmail={me.email} />

      {/* Watchlist */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold mb-4">Watchlist</h2>
        <WatchlistTab userEmail={me.email} />
      </div>

      {/* Saved Searches */}
      <SavedSearches userEmail={me.email} />

      {/* Promo Code */}
      <div className="px-4 mt-4">
        <div className="bg-muted rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Redeem Promo Code</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code..."
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="rounded-xl text-sm font-mono"
            />
            <Button className="rounded-xl shrink-0" onClick={handlePromoApply} disabled={applyingPromo || !promoCode.trim()}>
              Apply
            </Button>
          </div>
        </div>
      </div>

      <Separator className="my-6 mx-4" />

      {/* My Listings */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-bold mb-4">My Listings</h2>
        <ListingsTab userEmail={me.email} />
      </div>

      <Separator className="my-6 mx-4" />

      {/* Reviews I received */}
      {reviews.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-lg font-bold mb-3">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{r.reviewer_name || r.reviewer_email}</span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}