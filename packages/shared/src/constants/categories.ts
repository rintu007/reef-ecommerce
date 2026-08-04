// Ported as-is from legacy/vite-app/src/lib/categories.js — backend-agnostic,
// shared between apps/web and apps/mobile.
import type { ListingType, ServiceType } from "../types/enums";

export const CORAL_CATEGORIES = [
  "LPS Corals", "SPS Corals", "Soft Corals", "Zoanthids", "Acropora",
  "Chalice Corals", "Torch Corals", "Montipora", "Goniopora", "Grafted Corals",
  "Unknown", "Signature Corals", "Coral Colonies", "Beginner Corals",
  "Coral Frag Packs", "Anemones",
] as const;

export const SW_INVERT_CATEGORIES = [
  "Crabs", "Shrimp", "Snails", "Urchins", "Starfish", "Cucumbers",
  "Lobsters", "Hermit Crabs", "Cleaner Crew Packs", "Copepods / Pods",
  "Other Invertebrates",
] as const;

export const FISH_CATEGORIES = [
  "WYSIWYG Fish", "Clownfish", "Tangs", "Wrasses", "Angelfish",
  "Gobies", "Beginner Fish", "Nano Fish", "Non-Reef-Safe Fish",
] as const;

export const EQUIPMENT_CATEGORIES = [
  "Aquariums", "Lighting", "Powerheads", "Controllers", "Pumps",
  "Skimmers", "Filtration", "Chemistry & Test Kits", "Food & More",
  "Fragging Supplies", "Rock & Sand", "Clearance / Open-Box",
] as const;

export const FW_FISH_CATEGORIES = [
  "Community Fish", "Nano Fish", "Tetras", "Rasboras", "Danios", "Barbs",
  "Livebearers", "Bettas", "Gouramis", "Angelfish",
  "Cichlids", "Catfish",
  "Loaches", "Goldfish", "Koi / Pond Fish",
  "Oddball / Monster Fish", "Other Freshwater Fish",
] as const;

export const FW_AMPHIBIAN_CATEGORIES = [
  "Axolotls", "African Dwarf Frogs", "Newts", "Salamanders", "Other Amphibians",
] as const;

export const FW_TURTLE_CATEGORIES = [
  "Aquatic Turtles", "Semi-Aquatic Turtles", "Other Turtles",
] as const;

export const FW_OTHER_CATEGORIES = [
  "Shrimp", "Snails", "Crayfish", "Other Invertebrates",
  "Plants", "Feeders",
  "Decor Bundles", "Livestock Bundles", "Rare / Uncategorized",
] as const;

export const FW_EQUIPMENT_CATEGORIES = [
  "Tanks", "Filters", "Heaters", "Lights", "Air Pumps",
  "Substrate", "Decorations / Hardscape", "Water Treatment",
  "Food", "Test Kits", "Plant Equipment", "Accessories", "Miscellaneous",
] as const;

export const ALL_CATEGORIES: Record<ListingType, readonly string[]> = {
  coral: CORAL_CATEGORIES,
  fish: FISH_CATEGORIES,
  sw_invert: SW_INVERT_CATEGORIES,
  equipment: EQUIPMENT_CATEGORIES,
  fw_fish: FW_FISH_CATEGORIES,
  fw_amphibian: FW_AMPHIBIAN_CATEGORIES,
  fw_turtle: FW_TURTLE_CATEGORIES,
  fw_other: FW_OTHER_CATEGORIES,
  fw_equipment: FW_EQUIPMENT_CATEGORIES,
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  coral: "Corals",
  fish: "Saltwater Fish",
  sw_invert: "Crustaceans & Inverts",
  equipment: "SW Equipment",
  fw_fish: "Freshwater Fish",
  fw_amphibian: "Amphibians",
  fw_turtle: "Turtles",
  fw_other: "Inverts / Other",
  fw_equipment: "FW Equipment",
};

export const LISTING_TYPE_ICONS: Record<ListingType, string> = {
  coral: "🪸",
  fish: "🐠",
  sw_invert: "🦀",
  equipment: "🔧",
  fw_fish: "🐟",
  fw_amphibian: "🦎",
  fw_turtle: "🐢",
  fw_other: "🦐",
  fw_equipment: "⚙️",
};

export const SALTWATER_TYPES: ListingType[] = ["coral", "fish", "sw_invert", "equipment"];
export const FRESHWATER_TYPES: ListingType[] = ["fw_fish", "fw_amphibian", "fw_turtle", "fw_other", "fw_equipment"];

// Ported from legacy/vite-app/src/pages/Services.jsx SERVICE_TYPE_LABELS.
export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
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

export const HELP_CATEGORIES = [
  { value: "beginner_setup", label: "Beginner Reef Tank Setup", icon: "🐠" },
  { value: "coral_care", label: "Coral Care", icon: "🪸" },
  { value: "fish_care", label: "Fish Care", icon: "🐟" },
  { value: "fragging_tips", label: "Fragging Tips", icon: "✂️" },
  { value: "lighting_flow", label: "Lighting & Flow", icon: "💡" },
  { value: "water_chemistry", label: "Water Chemistry", icon: "🧪" },
  { value: "pest_prevention", label: "Pest Prevention", icon: "🛡️" },
  { value: "shipping_acclimation", label: "Shipping & Acclimation", icon: "📦" },
  { value: "maintenance", label: "Maintenance", icon: "🔧" },
] as const;
