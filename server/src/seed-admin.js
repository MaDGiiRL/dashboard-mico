import "dotenv/config";
import { pool } from "./db.js";
import { hashPassword } from "./auth/password.js";

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    const name = process.env.SEED_ADMIN_NAME || "Admin";

    if (!email || !password) {
        console.error("Manca SEED_ADMIN_EMAIL o SEED_ADMIN_PASSWORD nel server/.env");
        process.exit(1);
    }

    const password_hash = await hashPassword(password);

    const res = await pool.query(
        `insert into users (email, password_hash, display_name, role)
     values ($1,$2,$3,'admin')
     on conflict (email) do update set
       password_hash = excluded.password_hash,
       display_name = excluded.display_name,
       role = 'admin',
       is_active = true,
       updated_at = now()
     returning id, email, display_name, role`,
        [email, password_hash, name]
    );

    console.log("✅ Admin impostato:", res.rows[0]);
    await pool.end();
}

main().catch((e) => {
    console.error("❌ Seed fallito:", e);
    process.exit(1);
});
