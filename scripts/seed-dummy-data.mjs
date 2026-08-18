// TEMPORARY test-data seeder — see DUMMY_DATA.md at repo root for what this
// creates and the exact removal steps before going live. Not wired into any
// npm script on purpose, so it never runs by accident: `node scripts/seed-dummy-data.mjs`.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
function envVar(name) {
  const match = envText.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!match) throw new Error(`Missing ${name} in apps/web/.env.local`);
  return match[1].trim();
}

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SELLER_EMAIL = "dummy-seller@reefmarket.test";
const SELLER_PASSWORD = "TestSeller123!";

async function getOrCreateSeller() {
  // Idempotent: safe to re-run without creating duplicate accounts.
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing.users.find((u) => u.email === SELLER_EMAIL);
  if (found) {
    console.log("Dummy seller already exists:", found.id);
    return found.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: SELLER_EMAIL,
    password: SELLER_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: "Reef Test Seller" },
  });
  if (error) throw error;
  console.log("Created dummy seller:", data.user.id);

  await supabase.from("profiles").update({ verified_seller: true, bio: "Test seller account — dummy data, remove before launch." }).eq("id", data.user.id);

  return data.user.id;
}

const DUMMY_LISTINGS = [
  {
    title: "Frogspawn Coral Frag — Green",
    description: "Healthy WYSIWYG frag, encrusting nicely on a small plug. Great for beginners — moderate light/flow. (Test listing — dummy data.)",
    market: "saltwater",
    listing_type: "coral",
    category: "LPS",
    price: 45.0,
    quantity: 6,
    photos: ["https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=900&q=85"],
    shipping_available: true,
    shipping_cost: 25.0,
    local_pickup: true,
    difficulty: "beginner",
    reef_safe: true,
  },
  {
    title: "Ocellaris Clownfish — Captive Bred Pair",
    description: "Tank-raised, eating pellets and frozen mysis readily. Bonded pair. (Test listing — dummy data.)",
    market: "saltwater",
    listing_type: "fish",
    category: "Clownfish",
    price: 65.0,
    quantity: 3,
    photos: ["https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=900&q=85"],
    shipping_available: true,
    shipping_cost: 35.0,
    local_pickup: true,
    difficulty: "beginner",
    reef_safe: true,
  },
  {
    title: "German Blue Ram Cichlid — Trio",
    description: "Vibrant color, active eaters, raised in soft water. Great centerpiece fish for a planted freshwater tank. (Test listing — dummy data.)",
    market: "freshwater",
    listing_type: "fw_fish",
    category: "Cichlids",
    price: 38.0,
    quantity: 8,
    photos: ["https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/67df2e37b_generated_image.png"],
    shipping_available: true,
    shipping_cost: 20.0,
    local_pickup: true,
    difficulty: "intermediate",
  },
  {
    title: "Protein Skimmer — 100 Gal Rated (Used, Great Condition)",
    description: "Upgraded to a bigger model, this one's been reliable for 8 months. Includes pump. (Test listing — dummy data.)",
    market: "saltwater",
    listing_type: "equipment",
    category: "Filtration",
    price: 89.99,
    quantity: 1,
    photos: ["https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/4c2b2708e_generated_image.png"],
    shipping_available: true,
    shipping_cost: 18.0,
    local_pickup: true,
    condition: "good",
    brand: "Generic",
  },
  {
    title: "Amazon Sword Plant Bundle (5 stems)",
    description: "Easy, hardy background plant — great for beginners. Bundle of 5 healthy stems. (Test listing — dummy data.)",
    market: "freshwater",
    listing_type: "fw_other",
    category: "Plants",
    price: 15.0,
    quantity: 20,
    photos: ["https://media.base44.com/images/public/69cd3d0cc5454eb378341b93/8c3afb853_generated_image.png"],
    shipping_available: true,
    shipping_cost: 12.0,
    local_pickup: true,
    difficulty: "beginner",
  },
];

async function seedListings(sellerId) {
  // Idempotent-ish: skip titles that already exist for this seller so
  // re-running doesn't pile up duplicates.
  const { data: existing } = await supabase.from("listings").select("title").eq("seller_id", sellerId);
  const existingTitles = new Set((existing ?? []).map((l) => l.title));

  const toInsert = DUMMY_LISTINGS.filter((l) => !existingTitles.has(l.title)).map((l) => ({ ...l, seller_id: sellerId, status: "active" }));

  if (toInsert.length === 0) {
    console.log("All dummy listings already exist — nothing to insert.");
    return;
  }

  const { data, error } = await supabase.from("listings").insert(toInsert).select("id, title");
  if (error) throw error;
  console.log(`Inserted ${data.length} dummy listings:`);
  data.forEach((l) => console.log(`  - ${l.title} (${l.id})`));
}

const sellerId = await getOrCreateSeller();
await seedListings(sellerId);
console.log("\nDone. Seller login: " + SELLER_EMAIL + " / " + SELLER_PASSWORD);
