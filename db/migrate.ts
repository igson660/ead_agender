import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não foi configurada.");
  if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
    throw new Error("DATABASE_URL deve apontar para PostgreSQL. Configure uma URL Neon, Vercel Postgres ou Supabase.");
  }
  const sql = postgres(connectionString, { max: 1, prepare: false });
  const migration = await readFile(resolve(process.cwd(), "db/migrations/0001_initial.sql"), "utf8");
  await sql.unsafe(migration);
  await sql.end({ timeout: 5 });
  console.log("Migração 0001_initial aplicada com sucesso.");
}

migrate().catch((error) => {
  console.error("Falha ao aplicar migração:", error);
  process.exit(1);
});
