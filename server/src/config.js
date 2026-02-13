import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, "../.env");

console.log("🔎 ENV PATH:", envPath);
console.log("🔎 .env exists?", fs.existsSync(envPath));

const result = dotenv.config({ path: envPath, override: true });

if (result.error) console.error("❌ dotenv error:", result.error);
else console.log("✅ dotenv parsed keys:", Object.keys(result.parsed || {}));

export const config = {
    port: Number(process.env.PORT || 8080),
    databaseUrl: String(process.env.DATABASE_URL || ""),
    jwtSecret: String(process.env.JWT_SECRET || ""),
    corsOrigin: String(process.env.CORS_ORIGIN || "http://localhost:5173"),
};

console.log("✅ ENV loaded:", {
    cwd: process.cwd(),
    port: config.port,
    corsOrigin: config.corsOrigin,
    databaseUrl: config.databaseUrl,
    jwtSecret: config.jwtSecret ? "***set***" : "***missing***",
});

if (!config.databaseUrl) throw new Error("Missing DATABASE_URL");
if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
