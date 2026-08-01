import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

function parseAddress(fullAddress = "") {
  // Try to parse "Street, City, ST, ZIP" back into parts
  const parts = fullAddress.split(",").map(s => s.trim());
  return {
    street: parts[0] || "",
    city: parts[1] || "",
    state: parts[2] || "",
    zip: parts[3] || "",
  };
}

export default function PickupAddressInput({ value = "", onChange }) {
  const [fields, setFields] = useState(() => parseAddress(value));

  // Sync outward any time a field changes
  const update = (newFields) => {
    setFields(newFields);
    const { street, city, state, zip } = newFields;
    // Only emit a full address when enough parts are filled
    const composed = [street, city, state, zip].filter(Boolean).join(", ");
    onChange(composed);
  };

  const set = (key, val) => update({ ...fields, [key]: val });

  // Map preview URL (only shown when all 4 fields are filled)
  const allFilled = fields.street && fields.city && fields.state && fields.zip;
  const mapQuery = allFilled
    ? encodeURIComponent(`${fields.street}, ${fields.city}, ${fields.state} ${fields.zip}`)
    : null;
  const mapUrl = mapQuery
    ? `https://maps.google.com/maps?q=${mapQuery}&output=embed&z=15`
    : null;

  return (
    <div className="space-y-3">
      {/* Street */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Street Address</Label>
        <Input
          placeholder="123 Main St"
          value={fields.street}
          onChange={(e) => set("street", e.target.value)}
          autoComplete="street-address"
        />
      </div>

      {/* City */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">City</Label>
        <Input
          placeholder="City"
          value={fields.city}
          onChange={(e) => set("city", e.target.value)}
          autoComplete="address-level2"
        />
      </div>

      {/* State + ZIP side by side */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">State</Label>
          <select
            value={fields.state}
            onChange={(e) => set("state", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select…</option>
            {US_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="w-32 space-y-1">
          <Label className="text-xs text-muted-foreground">ZIP Code</Label>
          <Input
            placeholder="00000"
            value={fields.zip}
            onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </div>
      </div>

      {/* Map preview */}
      {allFilled && mapUrl && (
        <div className="rounded-xl overflow-hidden border border-border h-40 w-full mt-1">
          <iframe
            src={mapUrl}
            title="Pickup location"
            className="w-full h-full"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
      )}

      {allFilled && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <MapPin className="w-3.5 h-3.5" />
          <span>{fields.street}, {fields.city}, {fields.state} {fields.zip}</span>
        </div>
      )}
    </div>
  );
}