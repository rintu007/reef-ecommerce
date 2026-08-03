import { readFileSync } from "node:fs";
import { Client } from "pg";

const [, , migrationFile] = process.argv;
if (!migrationFile) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-migration.sql>");
  process.exit(1);
}

const envText = readFileSync(new URL("../supabase/.env", import.meta.url), "utf8");
const databaseUrl = envText.match(/DATABASE_URL=(.+)/)[1].trim();
const sql = readFileSync(migrationFile, "utf8");

const basename = migrationFile.split(/[\\/]/).pop();
const match = basename.match(/^(\d+)_(.+)\.sql$/);
if (!match) throw new Error(`Migration filename must match <version>_<name>.sql, got: ${basename}`);
const [, version, name] = match;

const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
await client.connect();

try {
  await client.query("begin");
  await client.query(sql);
  await client.query(
    "insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3) on conflict (version) do nothing",
    [version, name, [sql]]
  );
  await client.query("commit");
  console.log(`Applied migration ${version}_${name}`);
} catch (err) {
  await client.query("rollback");
  throw err;
} finally {
  await client.end();
}
