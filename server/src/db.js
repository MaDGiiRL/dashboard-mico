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
    try {
        const res = await pool.query(text, params);
        return res.rows;
    } catch (e) {
        console.error("❌ DB query failed:", {
            message: e?.message,
            code: e?.code,
            databaseUrl: config.databaseUrl,
        });
        throw e;
    }
}
