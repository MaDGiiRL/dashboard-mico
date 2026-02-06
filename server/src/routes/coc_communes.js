// server/routes/coc_communes.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function cocCommunesRoutes(app) {
    // ✅ crea se non esiste (case-insensitive), ritorna record
    app.post("/coc-communes/ensure", async (req, reply) => {
        try {
            requireRole(["admin", "editor", "viewer"])(req);

            const body = z
                .object({
                    name: z.string().min(2),
                })
                .parse(req.body);

            const name = body.name.trim();

            // prova a trovare (case-insensitive)
            const found = await q(
                `select * from coc_communes where lower(name)=lower($1) limit 1`,
                [name]
            );
            if (found.rows?.[0]) return found.rows[0];

            // inserisci
            const ins = await q(
                `insert into coc_communes(name) values($1) returning *`,
                [name]
            );
            return ins.rows[0];
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
