// server/src/routes/map_blips.js
import { z } from "zod";
import { q } from "../db.js";

const CreateSchema = z.object({
    layer_id: z.string().min(1).max(60),
    title: z.string().min(1).max(120),
    lat: z.coerce.number().min(-90).max(90),   // ✅ accetta stringhe "46.5"
    lng: z.coerce.number().min(-180).max(180),// ✅ accetta stringhe "12.1"
    note: z.string().max(500).optional().nullable(),
});

export async function mapBlipsRoutes(app) {
    const authOpts = app.authenticate ? { preHandler: [app.authenticate] } : {};

    app.get("/map-blips", authOpts, async (req, reply) => {
        try {
            const rows = await q(
                `SELECT id, layer_id, title, lat, lng, note, created_at
         FROM map_blips
         WHERE is_active = true
         ORDER BY id DESC`
            );
            return rows;
        } catch (e) {
            req.log.error(e);
            return reply.code(500).send({ error: e?.message || "DB error" });
        }
    });

    app.post("/map-blips", authOpts, async (req, reply) => {
        let body;
        try {
            body = CreateSchema.parse(req.body);
        } catch (e) {
            // ✅ invece di 500 → 400 con dettaglio
            return reply.code(400).send({
                error: "Payload non valido",
                details: e?.errors || String(e),
            });
        }

        try {
            const rows = await q(
                `INSERT INTO map_blips (layer_id, title, lat, lng, note)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, layer_id, title, lat, lng, note, created_at`,
                [body.layer_id, body.title, body.lat, body.lng, body.note ?? null]
            );

            reply.code(201);
            return rows[0];
        } catch (e) {
            req.log.error(e);
            return reply.code(500).send({ error: e?.message || "DB error" });
        }
    });

    app.delete("/map-blips/:id", authOpts, async (req, reply) => {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return reply.code(400).send({ error: "Bad id" });

        try {
            await q(`UPDATE map_blips SET is_active=false WHERE id=$1`, [id]);
            reply.code(204).send();
        } catch (e) {
            req.log.error(e);
            return reply.code(500).send({ error: e?.message || "DB error" });
        }
    });
}
