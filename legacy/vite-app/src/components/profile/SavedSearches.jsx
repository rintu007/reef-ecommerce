import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import MobileSelect from "@/components/ui/MobileSelect";
import { Bell, BellOff, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ALL_CATEGORIES, LISTING_TYPE_LABELS } from "@/lib/categories";

export default function SavedSearches({ userEmail }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    listing_type: "",
    category: "",
    keyword: "",
    max_price: "",
    shipping_available: false,
    local_pickup: false,
  });

  const { data: searches = [] } = useQuery({
    queryKey: ["saved-searches", userEmail],
    queryFn: () => base44.entities.SavedSearch.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const createSearch = useMutation({
    mutationFn: (data) => base44.entities.SavedSearch.create({ ...data, user_email: userEmail, is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches", userEmail] });
      setShowForm(false);
      setForm({ name: "", listing_type: "", category: "", keyword: "", max_price: "", shipping_available: false, local_pickup: false });
      toast.success("Saved search created!");
    },
  });

  const toggleSearch = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SavedSearch.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches", userEmail] }),
  });

  const deleteSearch = useMutation({
    mutationFn: (id) => base44.entities.SavedSearch.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-searches", userEmail] }),
  });

  const categories = form.listing_type ? ALL_CATEGORIES[form.listing_type] || [] : [];

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Give this search a name"); return; }
    const data = { ...form };
    if (data.max_price) data.max_price = parseFloat(data.max_price);
    else delete data.max_price;
    if (!data.listing_type) delete data.listing_type;
    if (!data.category) delete data.category;
    if (!data.keyword) delete data.keyword;
    createSearch.mutate(data);
  };

  return (
    <div className="px-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" /> Saved Searches
        </h2>
        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 gap-1" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" /> New
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted rounded-xl p-4 space-y-3 mb-4">
          <div className="space-y-1">
            <Label className="text-xs">Search Name *</Label>
            <Input placeholder="e.g. Acans under $50" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl text-sm h-9" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <MobileSelect value={form.listing_type} onValueChange={(v) => setForm({ ...form, listing_type: v, category: "" })} placeholder="Any type"
                options={Object.entries(LISTING_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <MobileSelect value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} placeholder="Any"
                options={categories.map((c) => ({ value: c, label: c }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Keyword</Label>
              <Input placeholder="e.g. torch coral" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} className="rounded-xl text-sm h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max Price ($)</Label>
              <Input type="number" placeholder="No limit" value={form.max_price} onChange={(e) => setForm({ ...form, max_price: e.target.value })} className="rounded-xl text-sm h-9" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.shipping_available} onCheckedChange={(v) => setForm({ ...form, shipping_available: v })} id="ss-ship" />
              <Label htmlFor="ss-ship" className="text-xs">Ships</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.local_pickup} onCheckedChange={(v) => setForm({ ...form, local_pickup: v })} id="ss-local" />
              <Label htmlFor="ss-local" className="text-xs">Local Pickup</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 rounded-xl text-sm h-9" onClick={handleSave} disabled={createSearch.isPending}>Save</Button>
            <Button variant="ghost" className="rounded-xl text-sm h-9" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {searches.length === 0 && !showForm ? (
        <p className="text-xs text-muted-foreground py-2">No saved searches yet. Create one to get email alerts when matching listings are posted.</p>
      ) : (
        <div className="space-y-2">
          {searches.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{s.name || "Unnamed search"}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.listing_type && <Badge variant="outline" className="text-[10px] capitalize">{LISTING_TYPE_LABELS[s.listing_type] || s.listing_type}</Badge>}
                  {s.category && <Badge variant="outline" className="text-[10px]">{s.category}</Badge>}
                  {s.keyword && <Badge variant="secondary" className="text-[10px]">"{s.keyword}"</Badge>}
                  {s.max_price && <Badge variant="secondary" className="text-[10px]">≤ ${s.max_price}</Badge>}
                  {s.shipping_available && <Badge variant="secondary" className="text-[10px]">Ships</Badge>}
                  {s.local_pickup && <Badge variant="secondary" className="text-[10px]">Local</Badge>}
                </div>
              </div>
              <button
                className="shrink-0 p-1"
                onClick={() => toggleSearch.mutate({ id: s.id, is_active: !s.is_active })}
                title={s.is_active ? "Disable notifications" : "Enable notifications"}
              >
                {s.is_active
                  ? <Bell className="w-4 h-4 text-primary" />
                  : <BellOff className="w-4 h-4 text-muted-foreground" />}
              </button>
              <button className="shrink-0 p-1" onClick={() => deleteSearch.mutate(s.id)}>
                <Trash2 className="w-4 h-4 text-destructive/60 hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}