import pg from "pg";
import { config } from "./config.js";

export const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
    console.error("❌ PG pool error:", err);
});

export async function q(text, params = []) {
    const t0 = Date.now();
    try {
        const res = await pool.query(text, params);
        return res.rows;
    } catch (e) {
        console.error("❌ DB query failed:", {
            ms: Date.now() - t0,
            code: e?.code,
            message: e?.message,
            sql: String(text).slice(0, 4000),
            params,
        });
        throw e;
    }
}

export async function qAsUser(user, text, params = []) {
    const client = await pool.connect();
    const t0 = Date.now();
    try {
        if (user?.id) {
            await client.query("select set_config('app.user_id', $1, true)", [String(user.id)]);
            await client.query("select set_config('app.user_email', $1, true)", [String(user.email || "")]);
            await client.query("select set_config('app.user_role', $1, true)", [String(user.role || "")]);
        }

        const res = await client.query(text, params);
        return res.rows;
    } catch (e) {
        console.error("❌ DB query failed (qAsUser):", {
            ms: Date.now() - t0,
            code: e?.code,
            message: e?.message,
            sql: String(text).slice(0, 4000),
            params,
            actor: user?.id || null,
        });
        throw e;
    } finally {
        client.release();
    }
}
