// src/db/pool.js
import pg from "pg";
import dns from "node:dns";
import { config } from "../config.js";

function lookup(hostname, options, callback) {
    return dns.lookup(hostname, { ...options, family: 4 }, callback);
}

export const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    lookup,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});
