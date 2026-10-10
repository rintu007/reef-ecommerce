// One-off admin account provisioner for a fresh Supabase project.
// node scripts/create-admin.mjs <email> <password>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envText = readFileSync(new URL("../apps/web/.env.local", import.meta.url), "utf8");
function envVar(name) {
  const match = envText.match(new RegExp(`^${name}=(.+)$`, "m"));
  if (!match) throw new Error(`Missing ${name} in apps/web/.env.local`);
  return match[1].trim();
}

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await supabase.auth.admin.listUsers();
const already = existing?.users.find((u) => u.email === email);

let userId;
if (already) {
  userId = already.id;
  console.log(`User already exists: ${userId}`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Created user: ${userId}`);
}

const { error: updateError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", userId);
if (updateError) throw updateError;
console.log(`Set role=admin on profile ${userId}`);
