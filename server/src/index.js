import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";

import { authRoutes } from "./routes/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { crudRoutes } from "./routes/crud.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { issuesRoutes } from "./routes/issues.js";
import { logsRoutes } from "./routes/logs.js";

const app = Fastify({ logger: true });

await app.register(cors, {
    origin: config.corsOrigin,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
});

app.get("/health", async () => ({ ok: true }));

await authRoutes(app);
await adminRoutes(app);
await crudRoutes(app);
await dashboardRoutes(app);
await issuesRoutes(app);
await logsRoutes(app);

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
    app.log.error(err);
    process.exit(1);
});
