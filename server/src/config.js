// server/src/config.js
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In produzione (Render) NON c'è .env su disco: usa solo process.env
if (process.env.NODE_ENV !== "production") {
    const envPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    } else {
        dotenv.config(); // fallback se .env è nella cwd
    }
}

export const config = {
    port: Number(process.env.PORT || 8080),
    databaseUrl: String(process.env.DATABASE_URL || ""),
    jwtSecret: String(process.env.JWT_SECRET || ""),
    // supporta lista separata da virgola:
    // "http://localhost:5173,https://tuo-frontend.vercel.app"
    corsOrigin: String(process.env.CORS_ORIGIN || "http://localhost:5173"),
};

const corsOrigins = config.corsOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

console.log("✅ ENV loaded:", {
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    port: config.port,
    corsOrigins,
    databaseUrl: config.databaseUrl ? "***set***" : "***missing***",
    jwtSecret: config.jwtSecret ? "***set***" : "***missing***",
});

if (!config.databaseUrl) throw new Error("Missing DATABASE_URL");
if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");

// export utile per CORS
export const allowedOrigins = corsOrigins;
