import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const isMobile = () => window.matchMedia("(pointer: coarse)").matches;

/**
 * MobileSelect: uses a bottom-sheet Drawer on touch devices, standard Select on desktop.
 * Props mirror the shadcn Select API:
 *   value, onValueChange, placeholder, options: [{value, label}], className, triggerClassName
 */
export default function MobileSelect({ value, onValueChange, placeholder = "Select", options = [], triggerClassName }) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  if (!isMobile()) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn("rounded-xl", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-left",
          !value && "text-muted-foreground",
          triggerClassName
        )}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-safe px-4 pb-6 space-y-1 overflow-y-auto max-h-[60vh]">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors",
                  o.value === value
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted"
                )}
              >
                {o.label}
                {o.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}