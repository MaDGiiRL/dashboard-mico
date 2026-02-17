import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import cors from "cors";
// import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica .env solo in locale/dev (su Render le env arrivano già da process.env)
if (process.env.NODE_ENV !== "production") {
    const envPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
    } else {
        dotenv.config(); // fallback: .env in cwd se esiste
    }
}

// Config unica
export const config = {
    port: Number(process.env.PORT || 3001),
    databaseUrl: String(process.env.DATABASE_URL || ""),
    jwtSecret: String(process.env.JWT_SECRET || ""),
    // Supporta più origin separati da virgola
    corsOrigins: String(process.env.CORS_ORIGIN || "http://localhost:5173")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean),
};

console.log("✅ ENV loaded:", {
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    port: config.port,
    corsOrigins: config.corsOrigins,
    databaseUrl: config.databaseUrl ? "***set***" : "***missing***",
    jwtSecret: config.jwtSecret ? "***set***" : "***missing***",
});

if (!config.databaseUrl) throw new Error("Missing DATABASE_URL");
if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");

// const app = express();

// CORS PRIMA di routes e listen
app.use(
    cors({
        origin: (origin, cb) => {
            // consenti richieste senza Origin (curl, server-to-server)
            if (!origin) return cb(null, true);
            if (config.corsOrigins.includes(origin)) return cb(null, true);
            return cb(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
    })
);

// ...app.use(routes)

// listen alla fine
app.listen(config.port, "0.0.0.0", () => console.log("API on", config.port));
