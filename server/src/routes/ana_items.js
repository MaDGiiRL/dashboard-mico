// server/routes/ana_items.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function anaItemsRoutes(app) {
    app.post("/ana-items", async (req, reply) => {
        try {
            // ✅ “tutti” = anche viewer
            requireRole(["admin", "editor", "viewer"])(req);

            const body = z
                .object({
                    // se vuoi globali: manda day=null
                    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
                    place: z.string().min(1),
                    section_id: z.string().optional().nullable(),
                    section_title: z.string().optional().nullable(),
                    item_text: z.string().min(1),
                })
                .parse(req.body);

            const row = await q(
                `insert into ana_inventory_items(day, place, section_id, section_title, item_text)
                 values($1,$2,$3,$4,$5)
                 returning *`,
                [body.day || null, body.place, body.section_id || null, body.section_title || null, body.item_text]
            );

            return { ok: true, item: row[0] };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    app.delete("/ana-items/:id", async (req, reply) => {
        try {
            // se vuoi che “tutti” possano cancellare, lascia viewer. (io lo lascio come richiesto)
            requireRole(["admin", "editor", "viewer"])(req);

            const params = z.object({ id: z.string().min(1) }).parse(req.params);

            await q(`delete from ana_inventory_items where id=$1`, [params.id]);
            return { ok: true };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
