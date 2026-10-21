// Valida as migrations num Postgres em memória (PGlite), simulando o esquema auth do Supabase.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const db = new PGlite();
await db.exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
  create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated nologin;
  create role anon nologin;
`);
const dir = join(process.cwd(), "supabase", "migrations");
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  const body = readFileSync(join(dir, f), "utf8");
  const statements = body.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  for (const st of statements) {
    try {
      await db.exec(st);
    } catch (e) {
      console.error(`✗ ${f}:\n${st.slice(0, 300)}\n→ ${e.message}`);
      process.exit(1);
    }
  }
  console.log("✓", f);
}

await db.exec(`grant usage on schema public to authenticated; grant select, insert, update, delete on all tables in schema public to authenticated; grant select on all sequences in schema public to authenticated;`);
// Smoke test de RLS: cria admin + 2 membros, trilha, aula publicada; confere isolamento.
const r = async (q, params = []) => (await db.query(q, params)).rows;
const [adminId, aId, bId] = ["11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222", "33333333-3333-3333-3333-333333333333"];
for (const [id, email, role] of [[adminId, "mentor@x", "admin"], [aId, "a@x", "membro"], [bId, "b@x", "membro"]])
  await db.exec(`insert into auth.users (id,email,raw_user_meta_data) values ('${id}','${email}','{"name":"${email}","role":"${role}"}')`);
const users = await r("select id, role from public.users order by email");
if (users.length !== 3) throw new Error("trigger handle_new_auth_user não espelhou os usuários");
await db.exec(`
  insert into public.member_profiles (user_id, whatsapp_e164, access_start, access_end) values ('${aId}','+5527999990001', current_date - 1, current_date + 30);
  insert into public.member_profiles (user_id, whatsapp_e164, access_start, access_end, status) values ('${bId}','+5527999990002', current_date - 1, current_date + 30, 'ativo');
  insert into public.tracks (id, name, slug) values ('44444444-4444-4444-4444-444444444444','Marketing','marketing');
  insert into public.member_tracks (member_id, track_id) values ('${aId}','44444444-4444-4444-4444-444444444444');
  insert into public.modules (id, track_id, title) values ('55555555-5555-5555-5555-555555555555','44444444-4444-4444-4444-444444444444','M1');
  insert into public.lessons (id, module_id, title, status) values ('66666666-6666-6666-6666-666666666666','55555555-5555-5555-5555-555555555555','Aula pub','publicada');
  insert into public.lessons (id, module_id, title, status) values ('77777777-7777-7777-7777-777777777777','55555555-5555-5555-5555-555555555555','Aula rascunho','rascunho');
  insert into public.lessons (id, module_id, title, status, release_after_days) values ('88888888-8888-8888-8888-888888888888','55555555-5555-5555-5555-555555555555','Aula futura','publicada', 30);
  insert into public.lesson_progress (member_id, lesson_id, position_sec) values ('${aId}','66666666-6666-6666-6666-666666666666', 120);
`);

async function as(uid, fn) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}', false);`);
  try { return await fn(); } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub','', false);`); }
}
const expect = (cond, msg) => { if (!cond) { console.error("✗ RLS:", msg); process.exit(1); } else console.log("✓ RLS:", msg); };

expect((await as(aId, () => r("select id from public.lessons"))).length === 1, "membro A (na trilha) vê só a aula publicada e liberada");
expect((await as(bId, () => r("select id from public.lessons"))).length === 0, "membro B (fora da trilha) não vê aulas");
expect((await as(bId, () => r("select * from public.lesson_progress"))).length === 0, "membro B não vê progresso do A");
expect((await as(aId, () => r("select notes_private from public.member_profiles where user_id = $1", [bId]))).length === 0, "membro A não lê perfil do B");
expect((await as(adminId, () => r("select id from public.lessons"))).length === 3, "admin vê todas as aulas");
let blocked = false;
try { await as(aId, () => db.exec(`update public.member_profiles set access_end = current_date + 999 where user_id = '${aId}'`)); } catch { blocked = true; }
const after = await r("select access_end::text as d from public.member_profiles where user_id = $1", [aId]);
expect(blocked || after[0].d !== undefined && !after[0].d.endsWith("999"), "membro não consegue estender o próprio acesso (trigger guard)");
const me = await as(aId, () => r("select * from public.member_profile_me"));
expect(me.length === 1 && !("notes_private" in me[0]), "view member_profile_me não expõe notes_private");
console.log("\nMigrations e RLS OK.");
