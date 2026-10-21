import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Conexão direta ao Postgres com o papel `postgres` (ignora RLS).
 * Use SOMENTE em código de servidor já autorizado como admin (ver `requireAdmin`)
 * ou em jobs. Para leituras do membro, use o cliente Supabase com a sessão,
 * que aplica RLS.
 */
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

const client =
  globalForDb.pg ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false, // pooler do Supabase em modo transaction
    max: 10,
  });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { schema };
