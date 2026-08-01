import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { LogIn } from "lucide-react";
import SellerAgreementModal from "@/components/sell/SellerAgreementModal";
// hooks must all be declared before any conditional returns
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MobileSelect from "@/components/ui/MobileSelect";
import { ArrowLeft, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ListingTypeSelector from "@/components/sell/ListingTypeSelector";
import PickupTimesEditor from "@/components/sell/PickupTimesEditor";
import PickupAddressInput from "@/components/sell/PickupAddressInput";
import PhotoUploader from "@/components/sell/PhotoUploader";
import PayoutSetupPrompt from "@/components/sell/PayoutSetupPrompt";
import { ALL_CATEGORIES, FRESHWATER_TYPES } from "@/lib/categories";
import { safeStorage } from "@/lib/safe-storage";
import { useUserPrefs } from "@/lib/UserPrefsContext";
import { COUNTRIES, getCountryName } from "@/lib/countries";
import { X as XIcon } from "lucide-react";
import { CURRENCIES, COUNTRY_DEFAULT_CURRENCY } from "@/lib/currencies";

const SELLER_AGREEMENT_KEY = "reef_seller_agreed_v1";
const PAYOUT_SETUP_KEY = "reef_payout_prompted_v1";

const TITLE_PLACEHOLDERS = {
  coral: "e.g. Rainbow Acan Frag",
  fish: "e.g. Ocellaris Clownfish Pair",
  equipment: "e.g. Kessil A360X LED Light",
  fw_fish: "e.g. Blue Ram Cichlid",
  fw_amphibian: "e.g. Leucistic Axolotl",
  fw_turtle: "e.g. Red-Eared Slider",
  fw_other: "e.g. Crystal Red Shrimp",
  fw_equipment: "e.g. Fluval 307 Canister Filter",
};

export default function Sell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { isGuest, navigateToLogin } = useAuth();
  const { country: userCountry } = useUserPrefs();
  const [agreedToSell, setAgreedToSell] = useState(
    () => !!safeStorage.getItem(SELLER_AGREEMENT_KEY)
  );
  const [showPayoutPrompt, setShowPayoutPrompt] = useState(false);
  const [checkedAgreement, setCheckedAgreement] = useState(!!safeStorage.getItem(SELLER_AGREEMENT_KEY));
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    listing_type: "",
    title: "",
    description: "",
    category: "",
    price: "",
    pickup_price: "",
    diff_pickup_price: false,
    photos: [],
    photo_type: "",
    wysiwyg: false,
    shipping_available: true,
    local_pickup: false,
    doa_policy: "",
    doa_policy_custom: "",
    quantity: 1,
    shipping_cost: "",
    shipping_tiers: [],
    use_shipping_tiers: false,
    min_qty: 1,
    min_order_amount: "",
    frag_size: "",
    light_requirement: "",
    flow_requirement: "",
    difficulty: "",
    care_notes: "",
    species_name: "",
    tank_size_recommendation: "",
    temperament: "",
    reef_safe: true,
    brand: "",
    model: "",
    condition: "",
    equipment_notes: "",
    location: "",
    pickup_address: "",
    pickup_times: [],
    equipment_market: "",
    seller_country: userCountry || "",
    ships_to_countries: [],
    currency: COUNTRY_DEFAULT_CURRENCY[userCountry] || "USD",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Load existing listing for edit mode
  useEffect(() => {
    if (!editId) return;
    base44.entities.Listing.filter({ id: editId }).then((results) => {
      const listing = results[0];
      if (!listing) return;
      setForm({
        listing_type: listing.listing_type || "",
        title: listing.title || "",
        description: listing.description || "",
        category: listing.category || "",
        price: listing.price?.toString() || "",
        pickup_price: listing.pickup_price?.toString() || "",
        diff_pickup_price: !!listing.pickup_price,
        photos: listing.photos || [],
        photo_type: listing.photo_type || "",
        wysiwyg: listing.wysiwyg || false,
        shipping_available: listing.shipping_available ?? true,
        local_pickup: listing.local_pickup ?? false,
        doa_policy: listing.doa_policy || "",
        doa_policy_custom: listing.doa_policy_custom || "",
        quantity: listing.quantity || 1,
        shipping_cost: listing.shipping_cost?.toString() || "",
        shipping_tiers: listing.shipping_tiers || [],
        use_shipping_tiers: (listing.shipping_tiers || []).length > 0,
        min_qty: listing.min_qty || 1,
        min_order_amount: listing.min_order_amount?.toString() || "",
        frag_size: listing.frag_size || "",
        light_requirement: listing.light_requirement || "",
        flow_requirement: listing.flow_requirement || "",
        difficulty: listing.difficulty || "",
        care_notes: listing.care_notes || "",
        species_name: listing.species_name || "",
        tank_size_recommendation: listing.tank_size_recommendation || "",
        temperament: listing.temperament || "",
        reef_safe: listing.reef_safe ?? true,
        brand: listing.brand || "",
        model: listing.model || "",
        condition: listing.condition || "",
        equipment_notes: listing.equipment_notes || "",
        location: listing.location || "",
        pickup_address: listing.pickup_address || "",
        pickup_times: listing.pickup_times || [],
        equipment_market: listing.equipment_market || "",
        seller_country: listing.seller_country || userCountry || "",
        ships_to_countries: listing.ships_to_countries || [],
        currency: listing.currency || COUNTRY_DEFAULT_CURRENCY[listing.seller_country] || "USD",
      });
      setStep(2); // skip type selector in edit mode
    });
  }, [editId]);

  // Check user profile for seller agreement (persists across devices)
  useEffect(() => {
    if (isGuest || agreedToSell) return;
    base44.auth.me().then((me) => {
      if (me.seller_agreed) {
        safeStorage.setItem(SELLER_AGREEMENT_KEY, "true");
        setAgreedToSell(true);
      }
      setCheckedAgreement(true);
    }).catch(() => { setCheckedAgreement(true); });
  }, [isGuest]);

  // AI auto-populate for corals and animals
  const autoPopulateTimer = useRef(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPopulated, setAiPopulated] = useState(false);

  const autoPopulate = async (title, listingType) => {
    if (!title || title.length < 3) return;
    if (!["coral", "fish", "sw_invert", "fw_fish", "fw_amphibian", "fw_turtle", "fw_other"].includes(listingType)) return;
    setAiLoading(true);
    setAiPopulated(false);
    const isCoral = listingType === "coral";
    const prompt = isCoral
      ? `You are a reef aquarium expert. For the coral: "${title}", provide care info based on this coral type/species.`
      : `You are an aquarium expert. For the aquatic animal: "${title}", provide care info.`;

    const schema = isCoral
      ? {
          type: "object",
          properties: {
            light_requirement: { type: "string", enum: ["low", "medium", "high"] },
            flow_requirement: { type: "string", enum: ["low", "medium", "high"] },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "expert"] },
            care_tips: { type: "string", description: "2-3 practical keeping tips in 1-2 sentences each" },
          },
        }
      : {
          type: "object",
          properties: {
            temperament: { type: "string", enum: ["peaceful", "semi-aggressive", "aggressive"] },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "expert"] },
            care_tips: { type: "string", description: "2-3 practical keeping tips in 1-2 sentences each" },
          },
        };

    const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema, add_context_from_internet: true });
    setForm((prev) => ({
      ...prev,
      ...(isCoral ? {
        light_requirement: result.light_requirement || prev.light_requirement,
        flow_requirement: result.flow_requirement || prev.flow_requirement,
        difficulty: result.difficulty || prev.difficulty,
        care_notes: result.care_tips || prev.care_notes,
      } : {
        temperament: result.temperament || prev.temperament,
        difficulty: result.difficulty || prev.difficulty,
        care_notes: result.care_tips || prev.care_notes,
      }),
    }));
    setAiLoading(false);
    setAiPopulated(true);
  };

  const [descLoading, setDescLoading] = useState(false);
  const generateDescription = async () => {
    if (!form.title) { toast.error("Add a title first so AI knows what to describe."); return; }
    setDescLoading(true);
    try {
      const typeLabel = (form.listing_type || "item").replace(/_/g, " ");
      const details = [
        form.category && `Category: ${form.category}`,
        form.frag_size && `Frag size: ${form.frag_size}`,
        form.species_name && `Species: ${form.species_name}`,
        form.brand && `Brand: ${form.brand}`,
        form.model && `Model: ${form.model}`,
        form.condition && `Condition: ${form.condition}`,
        form.care_notes && `Care notes: ${form.care_notes}`,
      ].filter(Boolean).join(". ");
      const prompt = `You are writing a marketplace listing description for an aquarium hobbyist seller. Write an appealing, honest, concise description (2-4 short sentences) for this ${typeLabel} titled "${form.title}". ${details ? "Known details: " + details + "." : ""} Use a friendly, trustworthy tone. Do not invent specifications or guarantees. Return only the description text with no headings or quotes.`;
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      const text = typeof result === "string" ? result : (result?.description || "");
      if (text) {
        update("description", text.trim());
        toast.success("Description drafted! Edit it as you like.");
      } else {
        toast.error("Couldn't generate a description. Try again.");
      }
    } catch (e) {
      toast.error("Couldn't generate a description. Try again.");
    }
    setDescLoading(false);
  };

  const handleTitleChange = (value) => {
    update("title", value);
    setAiPopulated(false);
    clearTimeout(autoPopulateTimer.current);
    autoPopulateTimer.current = setTimeout(() => autoPopulate(value, form.listing_type), 1200);
  };

  // Trigger AI when user advances to step 3 if title already set
  useEffect(() => {
    if (step === 3 && form.title && !aiPopulated && !aiLoading) {
      autoPopulate(form.title, form.listing_type);
    }
  }, [step]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const me = await base44.auth.me();
      const isEquipment = data.listing_type === "equipment" || data.listing_type === "fw_equipment";
      let market = FRESHWATER_TYPES.includes(data.listing_type) ? "freshwater" : "saltwater";
      if (data.listing_type === "sw_invert") market = "saltwater";
      if (isEquipment && data.equipment_market === "both") market = "both";
      if (isEquipment && data.equipment_market === "saltwater_only") market = "saltwater";
      if (isEquipment && data.equipment_market === "freshwater_only") market = "freshwater";
      const payload = {
        ...data,
        price: parseFloat(data.price) || 0,
        quantity: parseInt(data.quantity) || 1,
        currency: data.currency || "USD",
        seller_email: me.email,
        seller_name: me.display_name || me.full_name || me.email,
        market,
      };
      if (!data.diff_pickup_price || !data.pickup_price) {
        delete payload.pickup_price;
      } else {
        payload.pickup_price = parseFloat(data.pickup_price);
      }
      delete payload.diff_pickup_price;
      payload.shipping_cost = parseFloat(data.shipping_cost) || 0;
      payload.min_qty = parseInt(data.min_qty) || 1;
      payload.min_order_amount = parseFloat(data.min_order_amount) || 0;
      if (data.use_shipping_tiers && data.shipping_tiers?.length > 0) {
        payload.shipping_tiers = data.shipping_tiers.map(t => ({ up_to_qty: Number(t.up_to_qty), price: Number(t.price) }));
        payload.shipping_cost = 0;
      } else {
        payload.shipping_tiers = [];
      }
      delete payload.use_shipping_tiers;
      if (editId) {
        return base44.entities.Listing.update(editId, payload);
      }
      return base44.entities.Listing.create({ ...payload, status: "active", featured: false, featured_fee: false });
    },
    onSuccess: () => {
      toast.success(editId ? "Listing updated!" : "Listing created!");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      navigate("/seller-dashboard");
    },
  });

  const categories = ALL_CATEGORIES[form.listing_type] || [];

  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Sign in to Sell</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Creating listings requires an account. Sign in or create a free account to start selling.
        </p>
        <Button className="h-12 px-8 rounded-xl font-bold" onClick={navigateToLogin}>
          Sign In / Create Account
        </Button>
        <button className="text-sm text-muted-foreground underline" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  if (!agreedToSell && checkedAgreement) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center gap-4">
          <p className="text-muted-foreground text-sm">Please review and agree to the seller terms to continue.</p>
        </div>
        <SellerAgreementModal
          onAgree={async () => {
            safeStorage.setItem(SELLER_AGREEMENT_KEY, "true");
            setAgreedToSell(true);
            base44.auth.updateMe({ seller_agreed: true }).catch(() => {});
            // Only show payout prompt if they don't already have a connected account
            const me = await base44.auth.me().catch(() => null);
            if (me) {
              const accounts = await base44.entities.SellerPayoutAccount.filter({ user_email: me.email }).catch(() => []);
              const hasAccount = accounts.some(a => a.onboarding_complete && a.payouts_enabled);
              if (!hasAccount) setShowPayoutPrompt(true);
            }
          }}
          onClose={() => navigate(-1)}
        />
      </>
    );
  }

  // Still checking agreement status — show nothing yet
  if (!agreedToSell && !checkedAgreement) return null;

  if (showPayoutPrompt) {
    return <PayoutSetupPrompt onContinue={() => setShowPayoutPrompt(false)} onSkip={() => setShowPayoutPrompt(false)} />;
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{editId ? "Edit Listing" : "Create Listing"}</h1>
        <span className="ml-auto text-xs text-muted-foreground">Step {step}/3</span>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Step 1: Type */}
        {step === 1 && (
          <div>
            <ListingTypeSelector value={form.listing_type} onChange={(v) => update("listing_type", v)} />
            <Button
              className="w-full mt-6 h-12 rounded-xl font-bold"
              disabled={!form.listing_type}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4">
            <PhotoUploader photos={form.photos} onChange={(p) => update("photos", p)} />

            {form.listing_type && (
              <div className="space-y-2">
                <Label>Photo Type *</Label>
                <MobileSelect
                  value={form.photo_type}
                  onValueChange={(v) => update("photo_type", v)}
                  placeholder="Select photo type"
                  options={
                    form.listing_type === "coral"
                      ? [
                          { value: "actual_photo", label: "Photo of actual coral" },
                          { value: "stock_photo", label: "Stock photo" },
                          { value: "colony_photo", label: "Photo from same colony (frag will be taken)" },
                        ]
                      : form.listing_type === "equipment" || form.listing_type === "fw_equipment"
                      ? [
                          { value: "actual_photo", label: "Photo of actual item" },
                          { value: "stock_photo", label: "Stock photo" },
                        ]
                      : [
                          { value: "actual_photo", label: `Photo of actual ${form.listing_type.includes("fw") ? "plant/animal" : "fish/animal"}` },
                          { value: "stock_photo", label: "Stock photo" },
                        ]
                  }
                />
              </div>
            )}


            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder={TITLE_PLACEHOLDERS[form.listing_type] || "e.g. Rainbow Acan Frag"} value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <MobileSelect
                value={form.category}
                onValueChange={(v) => update("category", v)}
                placeholder="Select category"
                options={[{ value: "unknown", label: "I don't know" }, ...categories.map((c) => ({ value: c, label: c }))]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{form.shipping_available && form.local_pickup ? "Shipping Price ($) *" : "Price ($) *"}</Label>
                <Input type="number" placeholder="0.00" value={form.price} onChange={(e) => update("price", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} className="rounded-xl" />
              </div>
            </div>

            {/* Shipping cost & minimum order settings */}
            {form.shipping_available && (
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <p className="text-sm font-semibold">📦 Shipping Settings</p>

                {/* Flat shipping cost vs tiers toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Use tiered shipping prices?</Label>
                    <p className="text-xs text-muted-foreground">Different price based on quantity ordered.</p>
                  </div>
                  <Switch
                    checked={form.use_shipping_tiers}
                    onCheckedChange={(v) => { update("use_shipping_tiers", v); if (!v) update("shipping_tiers", []); }}
                  />
                </div>

                {!form.use_shipping_tiers && (
                  <div className="space-y-1">
                    <Label>Flat Shipping Cost ({form.currency || "USD"})</Label>
                    <p className="text-xs text-muted-foreground">Enter 0 if shipping is included in the item price.</p>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.shipping_cost}
                      onChange={(e) => update("shipping_cost", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}

                {form.use_shipping_tiers && (
                  <div className="space-y-2">
                    <Label>Shipping Price Tiers</Label>
                    <p className="text-xs text-muted-foreground">Set a shipping price per quantity range. Last tier covers all higher quantities.</p>
                    {(form.shipping_tiers || []).map((tier, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Up to</span>
                        <Input
                          type="number"
                          placeholder="qty"
                          value={tier.up_to_qty}
                          onChange={(e) => {
                            const tiers = [...form.shipping_tiers];
                            tiers[i] = { ...tiers[i], up_to_qty: e.target.value };
                            update("shipping_tiers", tiers);
                          }}
                          className="rounded-xl w-20"
                        />
                        <span className="text-xs text-muted-foreground">items →</span>
                        <Input
                          type="number"
                          placeholder="price"
                          value={tier.price}
                          onChange={(e) => {
                            const tiers = [...form.shipping_tiers];
                            tiers[i] = { ...tiers[i], price: e.target.value };
                            update("shipping_tiers", tiers);
                          }}
                          className="rounded-xl w-24"
                        />
                        <button
                          type="button"
                          onClick={() => update("shipping_tiers", form.shipping_tiers.filter((_, j) => j !== i))}
                          className="text-destructive text-xs font-bold px-1"
                        >✕</button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs gap-1"
                      onClick={() => update("shipping_tiers", [...(form.shipping_tiers || []), { up_to_qty: "", price: "" }])}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Tier
                    </Button>
                  </div>
                )}

                {/* Minimum order */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label>Min. Order Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.min_qty}
                      onChange={(e) => update("min_qty", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Min. Order Amount ({form.currency || "USD"})</Label>
                    <Input
                      type="number"
                      placeholder="0 = none"
                      value={form.min_order_amount}
                      onChange={(e) => update("min_order_amount", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Different pickup price toggle — only when both methods are enabled */}
            {form.shipping_available && form.local_pickup && (
              <div className="space-y-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-semibold">Different price for local pickup?</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Offer a lower price for buyers who pick up in person (no shipping cost).</p>
                  </div>
                  <Switch
                    checked={form.diff_pickup_price}
                    onCheckedChange={(v) => { update("diff_pickup_price", v); if (!v) update("pickup_price", ""); }}
                  />
                </div>
                {form.diff_pickup_price && (
                  <div className="space-y-1">
                    <Label>Pickup Price ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={form.pickup_price}
                      onChange={(e) => update("pickup_price", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Description</Label>
                <button
                  type="button"
                  onClick={generateDescription}
                  disabled={descLoading || !form.title}
                  className="flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-2.5 py-1 hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {descLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {descLoading ? "Writing..." : "Write with AI"}
                </button>
              </div>
              <Textarea placeholder="Describe your item..." value={form.description} onChange={(e) => update("description", e.target.value)} className="rounded-xl" rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="City, State" value={form.location} onChange={(e) => update("location", e.target.value)} className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label>Your Country *</Label>
              <select
                value={form.seller_country}
                onChange={(e) => {
                  update("seller_country", e.target.value);
                  // Auto-suggest currency for country
                  const suggested = COUNTRY_DEFAULT_CURRENCY[e.target.value];
                  if (suggested) update("currency", suggested);
                }}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— Select Country —</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Listing Currency *</Label>
              <p className="text-xs text-muted-foreground">Buyers will pay in this currency. Your 5% platform fee is automatically converted to USD.</p>
              <select
                value={form.currency}
                onChange={(e) => update("currency", e.target.value)}
                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>
                ))}
              </select>
            </div>

            {form.shipping_available && (
              <div className="space-y-2">
                <Label>Ships To (other countries)</Label>
                <p className="text-xs text-muted-foreground">Add countries you're willing to ship to beyond your own.</p>
                <select
                  value=""
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const val = e.target.value;
                    if (!form.ships_to_countries.includes(val) && val !== form.seller_country) {
                      update("ships_to_countries", [...form.ships_to_countries, val]);
                    }
                    e.target.value = "";
                  }}
                  className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">+ Add a country</option>
                  {COUNTRIES.filter(c => c.code !== form.seller_country && !form.ships_to_countries.includes(c.code)).map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                {form.ships_to_countries.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {form.ships_to_countries.map((code) => (
                      <span key={code} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full">
                        {getCountryName(code)}
                        <button onClick={() => update("ships_to_countries", form.ships_to_countries.filter(c => c !== code))}>
                          <XIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between py-2">
              <Label>WYSIWYG (What You See Is What You Get)</Label>
              <Switch checked={form.wysiwyg} onCheckedChange={(v) => update("wysiwyg", v)} />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label>Shipping Available</Label>
              <Switch checked={form.shipping_available} onCheckedChange={(v) => {
                update("shipping_available", v);
                if (!v) { update("diff_pickup_price", false); update("pickup_price", ""); }
              }} />
            </div>
            <div className="flex items-center justify-between py-2">
              <Label>Local Pickup</Label>
              <Switch checked={form.local_pickup} onCheckedChange={(v) => {
                update("local_pickup", v);
                if (!v) { update("diff_pickup_price", false); update("pickup_price", ""); }
              }} />
            </div>

            {/* Local pickup details */}
            {form.local_pickup && (
              <div className="space-y-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">📍 Pickup Details</p>
                <div className="space-y-1">
                  <Label>Pickup Address *</Label>
                  <p className="text-xs text-muted-foreground">Full address only shared with buyers after purchase.</p>
                  <PickupAddressInput
                    value={form.pickup_address}
                    onChange={(v) => update("pickup_address", v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Pickup Times</Label>
                  <p className="text-xs text-muted-foreground">Select days and time windows buyers can choose from.</p>
                  <PickupTimesEditor
                    value={form.pickup_times}
                    onChange={(v) => update("pickup_times", v)}
                  />
                </div>
              </div>
            )}

            {form.listing_type !== "equipment" && form.listing_type !== "fw_equipment" && (
              <div className="space-y-2">
                <Label>DOA / Arrival Policy</Label>
                <p className="text-xs text-muted-foreground">What happens if the animal arrives dead or severely stressed?</p>
                <MobileSelect
                  value={form.doa_policy}
                  onValueChange={(v) => update("doa_policy", v)}
                  placeholder="Select a policy"
                  options={[
                    { value: "not_applicable", label: "Not Applicable — local pickup only / equipment" },
                    { value: "full_refund", label: "Full Refund — photo proof within 2hrs of delivery required" },
                    { value: "store_credit", label: "Store Credit — photo proof within 2hrs of delivery required" },
                    { value: "no_refund", label: "No Refund — shipped at buyer's risk" },
                    { value: "custom", label: "Custom policy..." },
                  ]}
                />
                {form.doa_policy === "custom" && (
                  <Textarea
                    placeholder="Describe your DOA policy in detail..."
                    value={form.doa_policy_custom}
                    onChange={(e) => update("doa_policy_custom", e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                )}
              </div>
            )}

            <Button className="w-full h-12 rounded-xl font-bold" onClick={() => setStep(3)} disabled={!form.title || !form.price}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 3: Type-specific details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Additional Details</h2>

            {/* AI loading banner */}
            {aiLoading && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                <p className="text-sm text-primary font-medium">Looking up care info for "{form.title}"...</p>
              </div>
            )}
            {aiPopulated && !aiLoading && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">✓ Care info auto-filled from research. Review and edit below.</p>
              </div>
            )}

            {form.listing_type === "coral" && (
              <>
                <div className="space-y-2">
                  <Label>Frag Size</Label>
                  <Input placeholder="e.g. 1 inch, 2-3 polyps" value={form.frag_size} onChange={(e) => update("frag_size", e.target.value)} className="rounded-xl" />
                </div>

                {/* AI-populated care specs */}
                {(form.light_requirement || form.flow_requirement || form.difficulty) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">💡 Auto-filled Care Requirements</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {form.light_requirement && (
                        <div className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Light</p>
                          <p className="font-semibold capitalize">{form.light_requirement}</p>
                        </div>
                      )}
                      {form.flow_requirement && (
                        <div className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Flow</p>
                          <p className="font-semibold capitalize">{form.flow_requirement}</p>
                        </div>
                      )}
                      {form.difficulty && (
                        <div className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Difficulty</p>
                          <p className="font-semibold capitalize">{form.difficulty}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Care Notes & Seller Tips</Label>
                  <p className="text-xs text-muted-foreground">Auto-filled with research tips. Add your own experience below.</p>
                  <Textarea
                    placeholder="Care tips will appear here after you enter the coral title above..."
                    value={form.care_notes}
                    onChange={(e) => update("care_notes", e.target.value)}
                    className="rounded-xl"
                    rows={5}
                  />
                </div>
              </>
            )}

            {form.listing_type === "fish" && (
              <>
                <div className="space-y-2">
                  <Label>Species / Common Name</Label>
                  <Input value={form.species_name} onChange={(e) => update("species_name", e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Min Tank Size</Label>
                  <Input placeholder="e.g. 30 gallons" value={form.tank_size_recommendation} onChange={(e) => update("tank_size_recommendation", e.target.value)} className="rounded-xl" />
                </div>

                {/* AI-populated animal specs */}
                {(form.temperament || form.difficulty) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">🐠 Auto-filled Care Info</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {form.temperament && (
                        <div className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Temperament</p>
                          <p className="font-semibold capitalize">{form.temperament}</p>
                        </div>
                      )}
                      {form.difficulty && (
                        <div className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Difficulty</p>
                          <p className="font-semibold capitalize">{form.difficulty}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <Label>Reef Safe</Label>
                  <Switch checked={form.reef_safe} onCheckedChange={(v) => update("reef_safe", v)} />
                </div>

                <div className="space-y-2">
                  <Label>Care Tips</Label>
                  <Textarea placeholder="Care tips will appear here after you enter the fish title above..." value={form.care_notes} onChange={(e) => update("care_notes", e.target.value)} className="rounded-xl" rows={4} />
                </div>
              </>
            )}

            {["sw_invert", "fw_fish", "fw_amphibian", "fw_turtle", "fw_other"].includes(form.listing_type) && (
              <>
                <div className="space-y-2">
                  <Label>Species / Common Name</Label>
                  <Input value={form.species_name} onChange={(e) => update("species_name", e.target.value)} className="rounded-xl" placeholder="e.g. Axolotl, Blue Ram, Betta splendens" />
                </div>
                <div className="space-y-2">
                  <Label>Min Tank Size</Label>
                  <Input placeholder="e.g. 10 gallons" value={form.tank_size_recommendation} onChange={(e) => update("tank_size_recommendation", e.target.value)} className="rounded-xl" />
                </div>

                {/* AI-populated animal specs */}
                {(form.temperament || form.difficulty) && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">🐟 Auto-filled Care Info</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {form.temperament && (
                        <div className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Temperament</p>
                          <p className="font-semibold capitalize">{form.temperament}</p>
                        </div>
                      )}
                      {form.difficulty && (
                        <div className="bg-white/60 dark:bg-white/10 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Difficulty</p>
                          <p className="font-semibold capitalize">{form.difficulty}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Care Tips</Label>
                  <Textarea placeholder="Care tips will appear here after you enter the title above..." value={form.care_notes} onChange={(e) => update("care_notes", e.target.value)} className="rounded-xl" rows={4} />
                </div>
              </>
            )}

            {(form.listing_type === "fw_equipment" || form.listing_type === "equipment") && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input value={form.brand} onChange={(e) => update("brand", e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input value={form.model} onChange={(e) => update("model", e.target.value)} className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Condition *</Label>
                  <MobileSelect value={form.condition} onValueChange={(v) => update("condition", v)} placeholder="Select"
                    options={[
                      { value: "new", label: "New" }, { value: "like_new", label: "Like New" },
                      { value: "good", label: "Good" }, { value: "fair", label: "Fair" },
                      { value: "parts_only", label: "Parts Only" },
                    ]} />
                </div>
                <div className="space-y-2">
                  <Label>Compatible With *</Label>
                  <p className="text-xs text-muted-foreground">Where can this equipment be used?</p>
                  <MobileSelect
                    value={form.equipment_market}
                    onValueChange={(v) => update("equipment_market", v)}
                    placeholder="Select compatibility"
                    options={[
                      { value: "saltwater_only", label: "🌊 Saltwater only" },
                      { value: "freshwater_only", label: "🐟 Freshwater only" },
                      { value: "both", label: "🌊🐟 Both saltwater & freshwater" },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes (wear, age, included parts)</Label>
                  <Textarea value={form.equipment_notes} onChange={(e) => update("equipment_notes", e.target.value)} className="rounded-xl" rows={3} />
                </div>
              </>
            )}

            <Button
              className="w-full h-12 rounded-xl font-bold"
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || ((form.listing_type === "equipment" || form.listing_type === "fw_equipment") && !form.condition)}
            >
              {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {editId ? "Save Changes" : "Post Listing"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}