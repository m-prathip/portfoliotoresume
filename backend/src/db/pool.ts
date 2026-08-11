import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
}

export const pool = new Pool({ connectionString });

pool.on("error", (err) => {
  // Idle client errors shouldn't crash the process
  console.error("Unexpected Postgres pool error", err);
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.error("Database connection check failed", err);
    return false;
  }
}
