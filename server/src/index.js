import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "./config.js";

import { authRoutes } from "./routes/auth.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { issueReportsRouter } from "./routes/issuesReports.js";
import { appointmentsRoutes } from "./routes/appointments.js";
import { racesRoutes } from "./routes/races.js";
import { eventsRoutes } from "./routes/events.js";
import { noteEntriesRoutes } from "./routes/note_entries.js";
import { rssRoutes } from "./routes/rss.js";
import { mapBlipsRoutes } from "./routes/map_blips.js";
import { cocCommunesRoutes } from "./routes/coc_communes.js";
import { cocStatusRoutes } from "./routes/coc_status.js";
import { cocOrdinancesRoutes } from "./routes/coc_ordinances.js";
import { cocNotesRoutes } from "./routes/coc_notes.js";
import { utilityLinksRoutes } from "./routes/utility_links.js";
import { pcRoutes } from "./routes/pc.js";
import { safetyBellunoRoutes } from "./routes/safety_belluno.js";
import { anaRoutes } from "./routes/ana.js";

import { accessRequestsRoutes } from "./routes/access_requests.js";
import { adminRoutes } from "./routes/admin.js";
import { crudRoutes } from "./routes/crud.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: config.corsOrigin,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

await app.register(multipart, {
  limits: { fileSize: 20 * 1024 * 1024 },
});

// 🔥 error handler globale
app.setErrorHandler((err, req, reply) => {
  req.log.error(
    { err, url: req.url, method: req.method, user: req.user || null },
    "🔥 Unhandled error"
  );
  if (reply.sent) return;
  reply.code(err.statusCode || 500).send({ error: err.message || "Internal Server Error" });
});

app.get("/health", async () => ({ ok: true }));

await authRoutes(app);
await dashboardRoutes(app);

// ✅ public access request
await accessRequestsRoutes(app);

// ✅ admin + generic crud
await adminRoutes(app);
await crudRoutes(app);
await issueReportsRouter(app);
// ---- resto del tuo backend ----
await noteEntriesRoutes(app);
await appointmentsRoutes(app);
await racesRoutes(app);
await eventsRoutes(app);
await mapBlipsRoutes(app);
await cocCommunesRoutes(app);
await cocStatusRoutes(app);
await cocOrdinancesRoutes(app);
await cocNotesRoutes(app);

await safetyBellunoRoutes(app);
await pcRoutes(app);
await anaRoutes(app);
await utilityLinksRoutes(app);

await rssRoutes(app);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
