import { readFileSync } from "node:fs";
import { Client } from "pg";

const envText = readFileSync(new URL("../supabase/.env", import.meta.url), "utf8");
const databaseUrl = envText.match(/DATABASE_URL=(.+)/)[1].trim();
const seedSql = readFileSync(new URL("../supabase/seed.sql", import.meta.url), "utf8");

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(seedSql);
console.log("Seed applied.");
await client.end();
