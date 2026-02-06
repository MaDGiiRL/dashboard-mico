// server/scripts/migrate_appointment_notes.js
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL non impostata.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query(`
    create table if not exists appointment_notes (
      day text not null,
      source text not null,
      external_id text not null,
      notes text default '',
      updated_at timestamptz not null default now(),
      primary key (day, source, external_id)
    );
  `);

  console.log("✅ appointment_notes OK");
  await pool.end();
}

main().catch((e) => {
  console.error("❌ migrate failed:", e);
  process.exit(1);
});
