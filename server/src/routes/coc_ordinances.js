// server/routes/coc_ordinances.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function cocOrdinancesRoutes(app) {
    app.post("/coc-ordinances/upsert", async (req, reply) => {
        try {
            requireRole(["admin", "editor", "viewer"])(req);

            const body = z
                .object({
                    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                    commune_name: z.string().min(2),
                    ordinance: z.boolean(),
                })
                .parse(req.body);

            const name = body.commune_name.trim();

            const found = await q(
                `select id, name from coc_communes where lower(name)=lower($1) limit 1`,
                [name]
            );

            if (!found.rows?.[0]) throw new Error(`Comune non trovato in coc_communes: "${name}"`);

            const commune_id = found.rows[0].id; // ✅ UUID

            const up = await q(
                `insert into coc_ordinances(day, commune_id, ordinance)
         values($1,$2,$3)
         on conflict(day, commune_id)
         do update set ordinance=excluded.ordinance, updated_at=now()
         returning id, day, commune_id, ordinance, updated_at`,
                [body.day, commune_id, body.ordinance]
            );

            return {
                ...up.rows[0],
                commune_name: found.rows[0].name,
            };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
