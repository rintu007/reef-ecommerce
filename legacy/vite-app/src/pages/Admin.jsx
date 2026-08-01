import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/MobileSelect";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Star, Trash2, Eye, Ban, CheckCircle, Flag, Plus, BookOpen, Tag, X, Users, Megaphone, Send
} from "lucide-react";
import UserManagementTab from "@/components/admin/UserManagementTab";
import SalesAnalyticsTab from "@/components/admin/SalesAnalyticsTab";
import AppAnalyticsTab from "@/components/admin/AppAnalyticsTab";
import AdminOrdersTab from "@/components/admin/AdminOrdersTab";
import { toast } from "sonner";
import { HELP_CATEGORIES } from "@/lib/categories";

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("listings");
  const [showAddContent, setShowAddContent] = useState(false);
  const [contentForm, setContentForm] = useState({
    title: "", content_type: "video", category: "", categories: [], market: "both", youtube_url: "", body: "", thumbnail_url: "", published: true, order: 0,
  });
  const [promoForm, setPromoForm] = useState({ code: "", type: "free_membership_6mo", bonus_listings: 5, max_uses: 1, expires_at: "", notes: "" });
  const [showAddPromo, setShowAddPromo] = useState(false);
  const [promoSaving, setPromoSaving] = useState(false);
  const [editingContent, setEditingContent] = useState(null); // item id being edited
  const [editForm, setEditForm] = useState({});
  const [broadcastForm, setBroadcastForm] = useState({ subject: "", message: "", send_email: true, send_popup: false, max_views: 1, show_to_guests: false });
  const [editingAnnouncement, setEditingAnnouncement] = useState(null); // announcement id
  const [editAnnForm, setEditAnnForm] = useState({});
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setMe(u);
      if (u.role !== "admin") navigate("/");
    });
  }, []);

  const { data: listings = [] } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: () => base44.entities.Listing.list("-created_date", 100),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => base44.entities.Report.filter({ status: "pending" }, "-created_date", 50),
  });

  const { data: helpContent = [] } = useQuery({
    queryKey: ["admin-help"],
    queryFn: () => base44.entities.HelpContent.list("order", 100),
  });

  const { data: announcements = [], refetch: refetchAnnouncements } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: () => base44.entities.Announcement.list("-created_date", 50),
  });

  const { data: promoCodes = [], refetch: refetchPromos } = useQuery({
    queryKey: ["admin-promos"],
    queryFn: async () => {
      const res = await base44.functions.invoke("managePromoCodes", { action: "list" });
      return res.data?.codes || [];
    },
  });

  const createPromo = async () => {
    setPromoSaving(true);
    const res = await base44.functions.invoke("managePromoCodes", { action: "create", ...promoForm, bonus_listings: Number(promoForm.bonus_listings), max_uses: Number(promoForm.max_uses) });
    if (res.data?.success) {
      toast.success("Promo code created!");
      setShowAddPromo(false);
      setPromoForm({ code: "", type: "free_membership_6mo", bonus_listings: 5, max_uses: 1, expires_at: "", notes: "" });
      refetchPromos();
    } else {
      toast.error(res.data?.error || "Error creating code");
    }
    setPromoSaving(false);
  };

  const deactivatePromo = async (id) => {
    await base44.functions.invoke("managePromoCodes", { action: "deactivate", code_id: id });
    refetchPromos();
  };

  const updateListing = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Listing.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-listings"] }),
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Report.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-reports"] }),
  });

  const createContent = useMutation({
    mutationFn: (data) => base44.entities.HelpContent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-help"] });
      setShowAddContent(false);
      setContentForm({ title: "", content_type: "video", category: "", categories: [], market: "both", youtube_url: "", body: "", thumbnail_url: "", published: true, order: 0 });
      toast.success("Content added!");
    },
  });

  const deleteContent = useMutation({
    mutationFn: (id) => base44.entities.HelpContent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-help"] }),
  });

  const updateContent = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HelpContent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-help"] });
      setEditingContent(null);
      toast.success("Content updated!");
    },
  });

  const deleteListing = useMutation({
    mutationFn: async (listingId) => {
      await base44.functions.invoke("deleteListing", { listingId });
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Listing deleted");
    },
    onError: () => toast.error("Failed to delete listing"),
  });

  if (!me || me.role !== "admin") return null;

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-50 safe-area-top bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">Admin Dashboard</h1>
      </div>

      <div className="px-4 pt-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-2">
            <div className="flex gap-1 col-span-2">
              <TabsTrigger value="orders" className="flex-1 text-xs">Orders</TabsTrigger>
              <TabsTrigger value="listings" className="flex-1 text-xs">Listings</TabsTrigger>
              <TabsTrigger value="reports" className="flex-1 text-xs">Reports</TabsTrigger>
              <TabsTrigger value="users" className="flex-1 text-xs">Users</TabsTrigger>
            </div>
            <div className="flex gap-1 col-span-2">
              <TabsTrigger value="sales" className="flex-1 text-xs">Sales</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 text-xs">Analytics</TabsTrigger>
              <TabsTrigger value="content" className="flex-1 text-xs">Content</TabsTrigger>
              <TabsTrigger value="promos" className="flex-1 text-xs">Promos</TabsTrigger>
              <TabsTrigger value="announce" className="flex-1 text-xs">Announce</TabsTrigger>
            </div>
          </TabsList>
        </Tabs>
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="px-4">
          <AdminOrdersTab />
        </div>
      )}

      {/* Listings tab */}
      {tab === "listings" && (
        <div className="px-4 mt-4 space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-card border border-border rounded-xl p-3 flex gap-3 items-start">
              {l.photos?.[0] && <img src={l.photos[0]} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.seller_email} · ${l.price}</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px] capitalize">{l.status}</Badge>
                  {l.featured && <Badge className="bg-accent text-accent-foreground text-[10px]">Featured</Badge>}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateListing.mutate({ id: l.id, data: { featured: !l.featured } })}>
                  <Star className={`w-3.5 h-3.5 ${l.featured ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateListing.mutate({ id: l.id, data: { status: l.status === "removed" ? "active" : "removed" } })}>
                  {l.status === "removed" ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Ban className="w-3.5 h-3.5 text-destructive" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => deleteListing.mutate(l.id)} disabled={deleteListing.isPending}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports tab */}
      {tab === "reports" && (
        <div className="px-4 mt-4 space-y-3">
          {reports.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No pending reports</p>
          ) : reports.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="text-[10px] capitalize mb-1">{r.report_type}</Badge>
                  <p className="font-semibold text-sm">{r.reason}</p>
                  {r.details && <p className="text-xs text-muted-foreground mt-1">{r.details}</p>}
                  <p className="text-[10px] text-muted-foreground mt-2">By: {r.reporter_email}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => resolveReport.mutate({ id: r.id, status: "resolved" })}>Resolve</Button>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => resolveReport.mutate({ id: r.id, status: "dismissed" })}>Dismiss</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="px-4">
          <UserManagementTab />
        </div>
      )}

      {/* Promo Codes tab */}
      {tab === "promos" && (
        <div className="px-4 mt-4 space-y-4">
          <Button className="w-full rounded-xl" onClick={() => setShowAddPromo(!showAddPromo)}>
            <Plus className="w-4 h-4 mr-1" /> Create Promo Code
          </Button>

          {showAddPromo && (
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} placeholder="e.g. REEF2024" className="rounded-xl font-mono" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <MobileSelect value={promoForm.type} onValueChange={(v) => setPromoForm({ ...promoForm, type: v })} placeholder="Select type"
                  options={[
                    { value: "free_membership_6mo", label: "Free Pro Membership — 6 Months" },
                    { value: "free_membership_1yr", label: "Free Business Membership — 1 Year" },
                    { value: "bonus_listings", label: "Bonus Listing Slots" },
                  ]} />
              </div>
              {promoForm.type === "bonus_listings" && (
                <div className="space-y-2">
                  <Label>Number of Bonus Listings</Label>
                  <Input type="number" value={promoForm.bonus_listings} onChange={(e) => setPromoForm({ ...promoForm, bonus_listings: e.target.value })} className="rounded-xl" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input type="number" value={promoForm.max_uses} onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Expires (optional)</Label>
                  <Input type="date" value={promoForm.expires_at} onChange={(e) => setPromoForm({ ...promoForm, expires_at: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={promoForm.notes} onChange={(e) => setPromoForm({ ...promoForm, notes: e.target.value })} placeholder="Internal notes..." className="rounded-xl" />
              </div>
              <Button className="w-full rounded-xl" onClick={createPromo} disabled={promoSaving || !promoForm.code}>
                {promoSaving ? "Saving..." : "Create Code"}
              </Button>
            </div>
          )}

          {promoCodes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No promo codes yet</p>
          ) : promoCodes.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <Tag className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-sm">{p.code}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {p.type?.replace(/_/g, " ")}
                  {p.type === "bonus_listings" ? ` · ${p.bonus_listings} slots` : ""}
                  {" · "}{p.uses || 0}/{p.max_uses} used
                  {!p.is_active && " · INACTIVE"}
                </p>
              </div>
              {p.is_active && (
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deactivatePromo(p.id)}>
                  <X className="w-3.5 h-3.5 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Sales Analytics tab */}
      {tab === "sales" && (
        <div className="px-4">
          <SalesAnalyticsTab />
        </div>
      )}

      {/* App Analytics tab */}
      {tab === "analytics" && (
        <div className="px-4">
          <AppAnalyticsTab />
        </div>
      )}

      {/* Broadcast Announcement tab */}
      {tab === "announce" && (
        <div className="px-4 mt-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">Send Announcement</h3>
                <p className="text-xs text-muted-foreground">Choose how to deliver your message.</p>
              </div>
            </div>

            {/* Delivery method */}
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={broadcastForm.send_email} onCheckedChange={(v) => setBroadcastForm({ ...broadcastForm, send_email: v })} />
                  <span className="text-sm">📧 Email all registered users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch checked={broadcastForm.send_popup} onCheckedChange={(v) => setBroadcastForm({ ...broadcastForm, send_popup: v })} />
                  <span className="text-sm">🔔 Show as in-app popup</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={broadcastForm.subject}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                placeholder="e.g. New Feature: Freshwater Market is Live!"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                placeholder="Write your announcement here..."
                className="rounded-xl"
                rows={6}
              />
            </div>

            {broadcastForm.send_popup && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Times each user sees it</Label>
                  <Input type="number" min="0" value={broadcastForm.max_views} onChange={(e) => setBroadcastForm({ ...broadcastForm, max_views: Number(e.target.value) })} className="rounded-xl" />
                  <p className="text-[10px] text-muted-foreground">0 = show every time</p>
                </div>
                <div className="space-y-2">
                  <Label>Show to guests?</Label>
                  <div className="flex items-center gap-2 h-9 mt-1">
                    <Switch checked={broadcastForm.show_to_guests} onCheckedChange={(v) => setBroadcastForm({ ...broadcastForm, show_to_guests: v })} />
                    <span className="text-sm text-muted-foreground">{broadcastForm.show_to_guests ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>
            )}

            {broadcastResult && (
              <div className={`rounded-xl p-3 text-sm ${
                broadcastResult.success ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-destructive/10 text-destructive"
              }`}>
                {broadcastResult.success
                  ? `✅ ${broadcastResult.sent > 0 ? `Emailed ${broadcastResult.sent} users. ` : ""}${broadcastResult.popup_created ? "In-app popup created!" : ""}`
                  : `❌ Error: ${broadcastResult.error}`}
              </div>
            )}

            <Button
              className="w-full rounded-xl gap-2"
              disabled={broadcastSending || !broadcastForm.subject.trim() || !broadcastForm.message.trim() || (!broadcastForm.send_email && !broadcastForm.send_popup)}
              onClick={async () => {
                setBroadcastSending(true);
                setBroadcastResult(null);
                const res = await base44.functions.invoke("sendBroadcastMessage", broadcastForm);
                setBroadcastResult(res.data);
                if (res.data?.success) {
                  setBroadcastForm({ subject: "", message: "", send_email: true, send_popup: false, max_views: 1, show_to_guests: false });
                  toast.success(`Announcement sent to ${res.data.sent} users!`);
                } else {
                  toast.error(res.data?.error || "Failed to send announcement");
                }
                setBroadcastSending(false);
              }}
            >
              <Send className="w-4 h-4" />
              {broadcastSending ? "Sending..." : "Send Announcement"}
            </Button>
          </div>
          {/* Existing announcements list */}
          {announcements.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Past Announcements</h3>
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  {editingAnnouncement === ann.id ? (
                    <div className="space-y-3">
                      <Input value={editAnnForm.subject || ""} onChange={(e) => setEditAnnForm({ ...editAnnForm, subject: e.target.value })} className="rounded-xl" placeholder="Subject" />
                      <Textarea value={editAnnForm.message || ""} onChange={(e) => setEditAnnForm({ ...editAnnForm, message: e.target.value })} className="rounded-xl" rows={4} />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Times to show</Label>
                          <Input type="number" min="0" value={editAnnForm.max_views ?? 1} onChange={(e) => setEditAnnForm({ ...editAnnForm, max_views: Number(e.target.value) })} className="rounded-xl" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Show to guests?</Label>
                          <div className="flex items-center gap-2 h-9 mt-1">
                            <Switch checked={!!editAnnForm.show_to_guests} onCheckedChange={(v) => setEditAnnForm({ ...editAnnForm, show_to_guests: v })} />
                            <span className="text-xs text-muted-foreground">{editAnnForm.show_to_guests ? "Yes" : "No"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Active</Label>
                        <Switch checked={!!editAnnForm.is_active} onCheckedChange={(v) => setEditAnnForm({ ...editAnnForm, is_active: v })} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 rounded-xl h-8 text-xs" onClick={async () => {
                          await base44.entities.Announcement.update(ann.id, editAnnForm);
                          setEditingAnnouncement(null);
                          refetchAnnouncements();
                          toast.success("Announcement updated!");
                        }}>Save</Button>
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs" onClick={() => setEditingAnnouncement(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm truncate">{ann.subject}</p>
                            <Badge variant={ann.is_active ? "default" : "secondary"} className="text-[10px] shrink-0">{ann.is_active ? "Active" : "Inactive"}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{ann.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Shows {ann.max_views === 0 ? "unlimited times" : `${ann.max_views}x`} · {ann.show_to_guests ? "Guests included" : "Logged-in only"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl h-7 text-xs" onClick={() => { setEditingAnnouncement(ann.id); setEditAnnForm({ subject: ann.subject, message: ann.message, max_views: ann.max_views ?? 1, show_to_guests: ann.show_to_guests ?? false, is_active: ann.is_active ?? true }); }}>Edit</Button>
                        <Button size="sm" variant="ghost" className="flex-1 rounded-xl h-7 text-xs text-destructive hover:text-destructive" onClick={async () => { await base44.entities.Announcement.delete(ann.id); refetchAnnouncements(); toast.success("Deleted"); }}>Delete</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content tab */}
      {tab === "content" && (
        <div className="px-4 mt-4 space-y-4">
          <Button className="w-full rounded-xl" onClick={() => setShowAddContent(!showAddContent)}>
            <Plus className="w-4 h-4 mr-1" /> Add Content
          </Button>

          {showAddContent && (
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                   <Label>Type</Label>
                   <MobileSelect value={contentForm.content_type} onValueChange={(v) => setContentForm({ ...contentForm, content_type: v })} placeholder="Type"
                     options={[{ value: "video", label: "Video" }, { value: "article", label: "Article" }, { value: "tip", label: "Tip" }, { value: "faq", label: "FAQ" }]} />
                 </div>
                 <div className="space-y-2">
                   <Label>Market</Label>
                   <MobileSelect value={contentForm.market} onValueChange={(v) => setContentForm({ ...contentForm, market: v })} placeholder="Market"
                     options={[{ value: "both", label: "Both" }, { value: "saltwater", label: "🪸 Saltwater" }, { value: "freshwater", label: "🐟 Freshwater" }]} />
                 </div>
              </div>
              <div className="space-y-2">
                <Label>Categories (select all that apply)</Label>
                  <div className="flex flex-wrap gap-2">
                    {HELP_CATEGORIES.map((c) => {
                      const isSelected = (contentForm.categories || []).includes(c.value);
                      return (
                        <button key={c.value} type="button"
                          onClick={() => {
                            const cats = contentForm.categories || [];
                            const next = isSelected ? cats.filter(x => x !== c.value) : [...cats, c.value];
                            setContentForm({ ...contentForm, categories: next, category: next[0] || "" });
                          }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            isSelected ? "bg-primary text-primary-foreground border-primary" :
                            "bg-background text-muted-foreground border-border"
                          }`}
                        >
                          {c.icon} {c.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Tap to select all categories this content belongs to.</p>
              </div>
              {contentForm.content_type === "video" && (
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input value={contentForm.youtube_url} onChange={(e) => setContentForm({ ...contentForm, youtube_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="rounded-xl" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Body / Content</Label>
                <Textarea value={contentForm.body} onChange={(e) => setContentForm({ ...contentForm, body: e.target.value })} className="rounded-xl" rows={3} />
              </div>
              <Button className="w-full rounded-xl" onClick={() => createContent.mutate({ ...contentForm, category: contentForm.categories[0] || "", categories: contentForm.categories })} disabled={!contentForm.title || contentForm.categories.length === 0}>
                Save Content
              </Button>
            </div>
          )}

          {helpContent.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-3 space-y-3">
              {editingContent === item.id ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="rounded-xl text-sm h-8" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <MobileSelect value={editForm.content_type} onValueChange={(v) => setEditForm({ ...editForm, content_type: v })} placeholder="Type"
                        options={[{ value: "video", label: "Video" }, { value: "article", label: "Article" }, { value: "tip", label: "Tip" }, { value: "faq", label: "FAQ" }]} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Market</Label>
                      <MobileSelect value={editForm.market || "both"} onValueChange={(v) => setEditForm({ ...editForm, market: v })} placeholder="Market"
                        options={[{ value: "both", label: "Both" }, { value: "saltwater", label: "🪸 Saltwater" }, { value: "freshwater", label: "🐟 Freshwater" }]} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Categories (select all that apply)</Label>
                    <div className="flex flex-wrap gap-2">
                      {HELP_CATEGORIES.map((c) => {
                        const allCats = [...(editForm.categories || []), ...(editForm.category ? [editForm.category] : [])];
                        const isSelected = allCats.includes(c.value);
                        return (
                          <button key={c.value} type="button"
                            onClick={() => {
                              const cats = [...new Set([...(editForm.categories || []), ...(editForm.category ? [editForm.category] : [])])];
                              const next = isSelected ? cats.filter(x => x !== c.value) : [...cats, c.value];
                              setEditForm({ ...editForm, category: next[0] || "", categories: next.slice(1) });
                            }}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                              isSelected ? "bg-primary text-primary-foreground border-primary" :
                              "bg-background text-muted-foreground border-border"
                            }`}
                          >
                            {c.icon} {c.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Tap to toggle categories this content belongs to.</p>
                  </div>
                  {editForm.content_type === "video" && (
                    <div className="space-y-1">
                      <Label className="text-xs">YouTube URL</Label>
                      <Input value={editForm.youtube_url || ""} onChange={(e) => setEditForm({ ...editForm, youtube_url: e.target.value })} className="rounded-xl text-sm h-8" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label className="text-xs">Body</Label>
                    <Textarea value={editForm.body || ""} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} className="rounded-xl text-sm" rows={2} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 rounded-xl h-8 text-xs" onClick={() => updateContent.mutate({ id: item.id, data: editForm })} disabled={updateContent.isPending}>Save</Button>
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl h-8 text-xs" onClick={() => setEditingContent(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{item.content_type} · {item.category?.replace(/_/g, " ")}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 shrink-0" onClick={() => { setEditingContent(item.id); setEditForm({ title: item.title, content_type: item.content_type, category: item.category, categories: item.categories || [], market: item.market || "both", youtube_url: item.youtube_url || "", body: item.body || "", published: item.published }); }}>
                    Edit
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteContent.mutate(item.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}