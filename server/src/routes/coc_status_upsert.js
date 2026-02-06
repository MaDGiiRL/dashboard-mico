// server/routes/coc_status_upsert.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function cocStatusUpsertRoutes(app) {
    app.post("/coc-status/upsert", async (req, reply) => {
        try {
            // ✅ come richiesto: anche viewer può scrivere
            requireRole(["admin", "editor", "viewer"])(req);

            const body = z
                .object({
                    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                    commune_name: z.string().min(1),
                    is_open: z.boolean(),
                    room_phone: z.string().optional().nullable(),
                    notes: z.string().optional().nullable(),
                })
                .parse(req.body);

            const communeName = body.commune_name.trim();

            // 1) prova match tollerante
            let rows = await q(
                `select id, name
         from coc_communes
         where lower(name) = lower($1)
            or lower(name) like lower($2)
         order by case when lower(name)=lower($1) then 0 else 1 end, length(name) asc
         limit 1`,
                [communeName, `%${communeName}%`]
            );

            let commune_id;

            // 2) se non esiste → crealo automaticamente
            if (!rows.length) {
                const inserted = await q(
                    `insert into coc_communes(name)
           values($1)
           on conflict (name) do update set name = excluded.name
           returning id, name`,
                    [communeName]
                );
                commune_id = inserted[0].id;
            } else {
                commune_id = rows[0].id;
            }

            const now = new Date().toISOString();

            const opened_at = body.is_open ? now : null;
            const closed_at = body.is_open ? null : now;

            // ⚠️ richiede UNIQUE(day, commune_id) su coc_status
            const up = await q(
                `insert into coc_status(day, commune_id, opened_at, closed_at, room_phone, notes)
         values($1,$2,$3,$4,$5,$6)
         on conflict (day, commune_id) do update
         set opened_at = coalesce(coc_status.opened_at, excluded.opened_at),
             closed_at = excluded.closed_at,
             room_phone = coalesce(excluded.room_phone, coc_status.room_phone),
             notes = coalesce(excluded.notes, coc_status.notes),
             updated_at = now()
         returning *`,
                [
                    body.day,
                    commune_id,
                    opened_at,
                    closed_at,
                    body.room_phone || null,
                    body.notes || null,
                ]
            );

            return { ok: true, coc_status: up[0] };
        } catch (e) {
            console.error("coc-status/upsert error:", e);
            return reply.status(400).send({ error: e?.message || String(e) || "Bad request" });
        }
    });
}
