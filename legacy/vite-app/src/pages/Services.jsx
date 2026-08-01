import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wrench, Plus, MapPin, DollarSign, Phone, X, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICE_TYPE_LABELS = {
  tank_building: "Custom Tank Building",
  tank_cleaning_sw: "Saltwater Tank Cleaning",
  tank_cleaning_fw: "Freshwater Tank Cleaning",
  aquascaping: "Aquascaping",
  maintenance: "Regular Maintenance",
  water_testing: "Water Testing",
  coral_fragging: "Coral Fragging",
  fish_sitting: "Fish Sitting",
  equipment_repair: "Equipment Repair",
  tank_teardown: "Tank Teardown / Moving",
  consultation: "Consultation",
  other: "Other",
};

const MARKET_COLORS = {
  saltwater: "bg-blue-100 text-blue-700",
  freshwater: "bg-emerald-100 text-emerald-700",
  both: "bg-purple-100 text-purple-700",
};

function ServiceDetailModal({ service, onClose, onDelete, isOwner }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div className="bg-background w-full max-w-[430px] rounded-t-2xl max-h-[90dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Photos */}
        {service.photos?.length > 0 && (
          <div className="relative">
            <img src={service.photos[0]} alt="" className="w-full h-52 object-cover rounded-t-2xl" />
          </div>
        )}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg leading-snug">{service.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{SERVICE_TYPE_LABELS[service.service_type] || service.service_type}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge className={cn("text-xs capitalize", MARKET_COLORS[service.market])}>{service.market}</Badge>
              <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
          </div>

          {service.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
          )}

          <div className="bg-muted rounded-xl p-3 space-y-2">
            {service.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{service.location}</span>
              </div>
            )}
            {service.service_area && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>Serves: {service.service_area}</span>
              </div>
            )}
            {service.ships_nationwide && (
              <div className="flex items-center gap-2 text-sm text-emerald-600">
                <Truck className="w-4 h-4 shrink-0" />
                <span>Remote / nationwide available</span>
              </div>
            )}
            {service.price_range && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{service.price_range}</span>
              </div>
            )}
            {service.contact_info && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{service.contact_info}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">Posted by {service.provider_name || service.provider_email}</p>

          {isOwner && (
            <Button variant="destructive" size="sm" className="w-full rounded-xl" onClick={() => { onDelete(service.id); onClose(); }}>
              Remove Listing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service, onDelete, isOwner, onClick }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 cursor-pointer active:opacity-80 transition-opacity" onClick={onClick}>
      {service.photos?.[0] && (
        <img src={service.photos[0]} alt="" className="w-full h-36 object-cover rounded-lg mb-3" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm leading-snug">{service.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{SERVICE_TYPE_LABELS[service.service_type] || service.service_type}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge className={cn("text-[10px] capitalize", MARKET_COLORS[service.market])}>{service.market}</Badge>
          {isOwner && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(service.id); }} className="text-destructive/60 hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
        {service.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{service.location}</span>}
        {service.service_area && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" />Serves: {service.service_area}</span>}
        {service.ships_nationwide && <span className="flex items-center gap-1 text-emerald-600"><Truck className="w-3 h-3" />Ships / Remote available</span>}
        {service.price_range && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{service.price_range}</span>}
      </div>

      {service.description && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{service.description}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">By {service.provider_name || service.provider_email}</p>
    </div>
  );
}

function PostServiceModal({ onClose, userEmail, userName }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "", service_type: "maintenance", market: "both",
    description: "", location: "", service_area: "", ships_nationwide: false, price_range: "", contact_info: ""
  });
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service posted!");
      onClose();
    }
  });

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotos(p => [...p, file_url]);
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error("Please enter a title");
    mutation.mutate({ ...form, photos, provider_email: userEmail, provider_name: userName });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div className="bg-background w-full max-w-[430px] rounded-t-2xl p-4 space-y-3 max-h-[85dvh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Post a Service</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <Input placeholder="Service title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="rounded-xl" />

        <select value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background">
          {Object.entries(SERVICE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select value={form.market} onChange={e => setForm(f => ({ ...f, market: e.target.value }))} className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background">
          <option value="saltwater">Saltwater</option>
          <option value="freshwater">Freshwater</option>
          <option value="both">Both</option>
        </select>

        <Input placeholder="Your location (City, State)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="rounded-xl" />
        <Input placeholder="Service area (e.g. Greater Chicago, within 50 miles of Atlanta)" value={form.service_area} onChange={e => setForm(f => ({ ...f, service_area: e.target.value }))} className="rounded-xl" />
        <label className="flex items-center gap-3 px-1 cursor-pointer">
          <input type="checkbox" checked={form.ships_nationwide} onChange={e => setForm(f => ({ ...f, ships_nationwide: e.target.checked }))} className="w-4 h-4 rounded accent-cyan-600" />
          <span className="text-sm">I offer remote or shipped services (nationwide)</span>
        </label>
        <Input placeholder="Price range (e.g. $50-$100, Free)" value={form.price_range} onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))} className="rounded-xl" />
        <Input placeholder="Contact info (phone, email, etc.)" value={form.contact_info} onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))} className="rounded-xl" />

        <textarea
          placeholder="Describe your service..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border border-input rounded-xl px-3 py-2 text-sm bg-background resize-none h-24"
        />

        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={p} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <button onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">×</button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-primary cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
          {uploading ? "Uploading..." : "+ Add Photo"}
        </label>

        <Button className="w-full rounded-xl" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? "Posting..." : "Post Service"}
        </Button>
      </div>
    </div>
  );
}

export default function Services() {
  const { isAuthenticated } = useAuth();
  const [me, setMe] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [filterMarket, setFilterMarket] = useState("all");
  const queryClient = useQueryClient();

  useState(() => {
    if (isAuthenticated) base44.auth.me().then(setMe).catch(() => {});
  }, [isAuthenticated]);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", filterMarket],
    queryFn: async () => {
      const all = await base44.entities.Service.filter({ status: "active" }, "-created_date");
      if (filterMarket === "all") return all;
      return all.filter(s => s.market === filterMarket || s.market === "both");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["services"] }); toast.success("Removed"); }
  });

  return (
    <div className="pb-4">
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Services</h1>
          {isAuthenticated && (
            <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" /> Post Service
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Local aquarium services from hobbyists in your area</p>
      </div>

      {/* Market filter */}
      <div className="px-4 pt-3 pb-2 flex gap-2">
        {["all", "saltwater", "freshwater"].map(m => (
          <button
            key={m}
            onClick={() => setFilterMarket(m)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize", filterMarket === m ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground")}
          >
            {m === "all" ? "All" : m}
          </button>
        ))}
      </div>

      <div className="px-4 py-2 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="rounded-xl bg-muted animate-pulse h-32" />)
        ) : services.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No services posted yet</p>
            <p className="text-sm mt-1">Be the first to offer a local aquarium service!</p>
          </div>
        ) : (
          services.map(s => (
            <ServiceCard
              key={s.id}
              service={s}
              isOwner={me?.email === s.provider_email}
              onDelete={deleteMutation.mutate}
              onClick={() => setSelectedService(s)}
            />
          ))
        )}
      </div>

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          isOwner={me?.email === selectedService.provider_email}
          onDelete={(id) => { deleteMutation.mutate(id); setSelectedService(null); }}
          onClose={() => setSelectedService(null)}
        />
      )}

      {showModal && me && (
        <PostServiceModal
          onClose={() => setShowModal(false)}
          userEmail={me.email}
          userName={me.display_name || me.full_name || me.email}
        />
      )}
    </div>
  );
}