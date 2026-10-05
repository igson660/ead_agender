import "server-only";
import postgres from "postgres";

let client: postgres.Sql | undefined;

export function getSql() {
  if (!client) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não foi configurada.");
    }
    if (!/^postgres(?:ql)?:\/\//i.test(connectionString)) {
      throw new Error("DATABASE_URL deve apontar para uma instância PostgreSQL serverless.");
    }

    client = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false
    });
  }

  return client;
}
