import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/ui/MobileSelect";
import { X, Plus } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_OPTIONS = [
  "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM",
];

function slotToString(slot) {
  const days = slot.days?.length ? slot.days.join(", ") : "";
  const from = slot.fromCustom || slot.from;
  const to = slot.toCustom || slot.to;
  if (!days) return "";
  if (from && to) return `${days} ${from} – ${to}`;
  if (from) return `${days} ${from}`;
  return days;
}

const emptySlot = () => ({ days: [], from: "", to: "", fromCustom: "", toCustom: "" });

export default function PickupTimesEditor({ value = [], onChange }) {
  const [slots, setSlots] = useState(() =>
    value.length ? value.map((s) => ({ days: [s.split(" ")[0]], from: "", to: "", fromCustom: "", toCustom: "" })) : []
  );

  const sync = (updated) => {
    setSlots(updated);
    onChange(updated.map(slotToString).filter(Boolean));
  };

  const addSlot = () => sync([...slots, emptySlot()]);

  const removeSlot = (i) => sync(slots.filter((_, idx) => idx !== i));

  const updateSlot = (i, patch) => {
    sync(slots.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  };

  const toggleDay = (i, day) => {
    const current = slots[i].days || [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    updateSlot(i, { days: next });
  };

  return (
    <div className="space-y-3">
      {slots.map((slot, i) => (
        <div key={i} className="bg-white dark:bg-card border border-border rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time Slot {i + 1}</p>
            <button type="button" onClick={() => removeSlot(i)} className="w-11 h-11 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors -mr-2">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Multi-day selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Days available <span className="text-primary">(select all that apply)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const active = slot.days?.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(i, day)}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/60 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">From</p>
              <MobileSelect
                value={slot.from}
                onValueChange={(v) => updateSlot(i, { from: v, fromCustom: "" })}
                placeholder="Start time"
                options={[
                  ...TIME_OPTIONS.map((t) => ({ value: t, label: t })),
                  { value: "custom", label: "Custom..." },
                ]}
              />
              {slot.from === "custom" && (
                <Input
                  placeholder="e.g. 9:30 AM"
                  value={slot.fromCustom}
                  onChange={(e) => updateSlot(i, { fromCustom: e.target.value })}
                  className="rounded-lg text-sm h-11 mt-1"
                />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To</p>
              <MobileSelect
                value={slot.to}
                onValueChange={(v) => updateSlot(i, { to: v, toCustom: "" })}
                placeholder="End time"
                options={[
                  ...TIME_OPTIONS.map((t) => ({ value: t, label: t })),
                  { value: "custom", label: "Custom..." },
                ]}
              />
              {slot.to === "custom" && (
                <Input
                  placeholder="e.g. 1:30 PM"
                  value={slot.toCustom}
                  onChange={(e) => updateSlot(i, { toCustom: e.target.value })}
                  className="rounded-lg text-sm h-11 mt-1"
                />
              )}
            </div>
          </div>

          {/* Preview */}
          {slotToString(slot) && (
            <p className="text-xs text-primary font-medium bg-primary/10 rounded-lg px-2 py-1.5">
              📅 {slotToString(slot)}
            </p>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="rounded-xl text-sm gap-1.5 w-full h-11"
        onClick={addSlot}
      >
        <Plus className="w-4 h-4" /> Add Time Slot
      </Button>
    </div>
  );
}