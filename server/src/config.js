import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- carica .env locale (su Render non serve ma non dà fastidio)
const envPath = path.resolve(__dirname, "../.env");

console.log("🔎 ENV PATH:", envPath);
console.log("🔎 .env exists?", fs.existsSync(envPath));

dotenv.config({ path: envPath, override: false });

// ---- parsing CORS multipli (virgola separata)
function parseCors(origin) {
    if (!origin) return ["http://localhost:5173"];
    return origin.split(",").map(s => s.trim());
}

export const config = {
    // Render imposta PORT automaticamente
    port: Number(process.env.PORT) || 8080,

    databaseUrl: String(process.env.DATABASE_URL || ""),
    jwtSecret: String(process.env.JWT_SECRET || ""),

    // supporta:
    // CORS_ORIGIN=https://app.vercel.app
    // CORS_ORIGIN=https://app.vercel.app,http://localhost:5173
    corsOrigin: parseCors(process.env.CORS_ORIGIN),
};

console.log("✅ ENV loaded:", {
    cwd: process.cwd(),
    port: config.port,
    corsOrigin: config.corsOrigin,
    databaseUrl: config.databaseUrl ? "***set***" : "***missing***",
    jwtSecret: config.jwtSecret ? "***set***" : "***missing***",
});

if (!config.databaseUrl) throw new Error("Missing DATABASE_URL");
if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
