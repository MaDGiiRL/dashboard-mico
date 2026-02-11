// server/src/index.js
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ index.js è in /server/src → .env sta in /server → quindi ../.env
const envPath = path.resolve(__dirname, "../.env");

// Debug esistenza
console.log("🔎 Looking for .env at:", envPath);
console.log("🔎 .env exists?", fs.existsSync(envPath));

// ✅ override=true: se hai variabili di sistema già settate, vince il file .env
const result = dotenv.config({ path: envPath, override: true });

if (result.error) {
  console.error("❌ dotenv error:", result.error);
} else {
  console.log("✅ dotenv parsed keys:", Object.keys(result.parsed || {}));
}

// Ora importa il resto DOPO dotenv
import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";

import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { crudRoutes } from "./routes/crud.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { appointmentNotesRoutes } from "./routes/appointment_notes.js";
import { issuesRoutes } from "./routes/issues.js";
import { logsRoutes } from "./routes/logs.js";
import { cocStatusUpsertRoutes } from "./routes/coc_status_upsert.js";
import { anaItemsRoutes } from "./routes/ana_items.js";
import { cocCommunesRoutes } from "./routes/coc_communes.js";
import { accessRequestsRoutes } from "./routes/access_requests.js";
import { rssRoutes } from "./routes/rss.js";
import { cfdRoutes } from "./routes/cfd.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: config.corsOrigin,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.get("/health", async () => ({ ok: true }));

await authRoutes(app);
await adminRoutes(app);
await accessRequestsRoutes(app);
await crudRoutes(app);
await dashboardRoutes(app);
await appointmentNotesRoutes(app);
await issuesRoutes(app);
await logsRoutes(app);
await rssRoutes(app);
await cocStatusUpsertRoutes(app);
await anaItemsRoutes(app);
await cocCommunesRoutes(app);
await cfdRoutes(app);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
