// Aplica as migrations SQL em ordem (supabase/migrations/*.sql) usando DATABASE_URL.
// Guarda o histórico em public._avix_migrations para não reaplicar.
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

await sql`create table if not exists public._avix_migrations (name text primary key, applied_at timestamptz default now())`;
const applied = new Set((await sql`select name from public._avix_migrations`).map((r) => r.name));

for (const f of files) {
  if (applied.has(f)) { console.log("✓ já aplicada:", f); continue; }
  const body = readFileSync(join(dir, f), "utf8");
  const statements = body.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  console.log("→ aplicando", f, `(${statements.length} comandos)`);
  await sql.begin(async (tx) => {
    for (const st of statements) await tx.unsafe(st);
    await tx`insert into public._avix_migrations (name) values (${f})`;
  });
}
console.log("Banco atualizado.");
await sql.end();
