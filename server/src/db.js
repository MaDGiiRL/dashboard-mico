// server/src/db.js
import pg from "pg";
import dns from "node:dns";
import { config } from "./config.js";

// ✅ forza IPv4 (evita ENETUNREACH su indirizzi IPv6 tipo 2a05:...)
function lookup(hostname, options, callback) {
    return dns.lookup(hostname, { ...options, family: 4 }, callback);
}

export const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }, // ✅ Supabase
    lookup, // ✅ forza IPv4
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});

pool.on("connect", () => {
    console.log("✅ PG pool connected");
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
            sql: String(text).slice(0, 2000),
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
            sql: String(text).slice(0, 2000),
            params,
            actor: user?.id || null,
        });
        throw e;
    } finally {
        client.release();
    }
}
