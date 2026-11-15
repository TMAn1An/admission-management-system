/**
 * Applies each prisma/migrations/<name>/migration.sql to the database in DATABASE_URL (Turso or a local file).
 * Prisma Migrate cannot talk to Turso directly, so this small runner tracks applied migrations itself.
 * Safe to run on every deploy: already-applied migrations are skipped.
 */
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });

  await db.execute(
    "CREATE TABLE IF NOT EXISTS _app_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  const done = new Set((await db.execute("SELECT name FROM _app_migrations")).rows.map((r) => String(r.name)));

  const dir = join(process.cwd(), "prisma", "migrations");
  const names = existsSync(dir) ? readdirSync(dir).filter((n) => existsSync(join(dir, n, "migration.sql"))).sort() : [];

  let applied = 0;
  for (const name of names) {
    if (done.has(name)) continue;
    const sql = readFileSync(join(dir, name, "migration.sql"), "utf8");
    // executeMultiple runs the script; record afterwards. Migrations are written to be applied once, in order.
    await db.executeMultiple(sql);
    await db.execute({ sql: "INSERT INTO _app_migrations (name) VALUES (?)", args: [name] });
    console.log(`applied ${name}`);
    applied++;
  }
  console.log(applied ? `Done: ${applied} migration(s) applied.` : "Database is up to date.");
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
