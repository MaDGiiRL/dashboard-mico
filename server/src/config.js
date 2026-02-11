// server/src/config.js
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// config.js è in /server/src → .env è in /server → quindi ../.env
const envPath = path.resolve(__dirname, "../.env");

// Debug
console.log("🔎 ENV PATH:", envPath);
console.log("🔎 .env exists?", fs.existsSync(envPath));

// ✅ override:true = se Windows ha variabili già settate, vince .env
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
    console.error("❌ dotenv error:", result.error);
} else {
    console.log("✅ dotenv parsed keys:", Object.keys(result.parsed || {}));
}

export const config = {
    port: Number(process.env.PORT || 8080),
    databaseUrl: process.env.DATABASE_URL || "",
    jwtSecret: process.env.JWT_SECRET || "",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

// Log “pulito”
console.log("✅ ENV loaded:", {
    cwd: process.cwd(),
    databaseUrl: config.databaseUrl,
    corsOrigin: config.corsOrigin,
    port: config.port,
    jwtSecret: config.jwtSecret ? "***set***" : "***missing***",
});

if (!config.databaseUrl) throw new Error("Missing DATABASE_URL");
if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
