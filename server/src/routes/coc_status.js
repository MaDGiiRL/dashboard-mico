// server/src/routes/coc_status.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

// accetta "HH:MM" oppure "YYYY-MM-DDTHH:MM" / "YYYY-MM-DDTHH:MM:SS"
function normalizeTs(day, v) {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s) return null;

    // solo time HH:MM -> combinalo col giorno
    if (/^\d{2}:\d{2}$/.test(s)) return `${day}T${s}:00`;

    // ISO senza secondi
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;

    // ISO con secondi
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return s;

    return null;
}

export async function cocStatusRoutes(app) {
    app.post(
        "/coc-status/upsert",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const body = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        commune_name: z.string().min(2),

                        // ⚠️ se la colonna is_open nel DB NON esiste, vedi NOTE sotto
                        is_open: z.boolean(),

                        open_mode: z.enum(["DAY", "H24"]).default("DAY"),
                        open_from: z.string().nullable().optional().default(null),
                        open_to: z.string().nullable().optional().default(null),

                        room_phone: z.string().nullable().optional().default(null),
                        notes: z.string().nullable().optional().default(null),
                    })
                    .parse(req.body);

                const name = body.commune_name.trim();

                // trova/crea comune
                let c = await q(
                    `select id, name from coc_communes where lower(name)=lower($1) limit 1`,
                    [name]
                );
                if (!c?.[0]) {
                    const ins = await q(
                        `insert into coc_communes(name) values($1) returning id, name`,
                        [name]
                    );
                    c = ins;
                }
                const commune_id = c[0].id;

                const open_from =
                    body.open_mode === "DAY" ? normalizeTs(body.day, body.open_from) : null;
                const open_to =
                    body.open_mode === "DAY" ? normalizeTs(body.day, body.open_to) : null;

                if (body.open_mode === "DAY" && body.open_from && !open_from) {
                    return reply.status(400).send({ error: "open_from non valido (HH:MM o ISO)" });
                }
                if (body.open_mode === "DAY" && body.open_to && !open_to) {
                    return reply.status(400).send({ error: "open_to non valido (HH:MM o ISO)" });
                }

                const nowIso = new Date().toISOString();
                const opened_at = body.is_open ? nowIso : null;
                const closed_at = body.is_open ? null : nowIso;

                // ✅ cast corretto a timestamptz
                const up = await q(
                    `
          insert into coc_status(
            day, commune_id,
            is_open,
            open_mode, open_from, open_to,
            room_phone, notes,
            opened_at, closed_at
          )
          values ($1,$2,$3,$4,$5::timestamptz,$6::timestamptz,$7,$8,$9::timestamptz,$10::timestamptz)
          on conflict(day, commune_id) do update
          set is_open=excluded.is_open,
              open_mode=excluded.open_mode,
              open_from=excluded.open_from,
              open_to=excluded.open_to,
              room_phone=coalesce(excluded.room_phone, coc_status.room_phone),
              notes=coalesce(excluded.notes, coc_status.notes),
              opened_at = case
                when excluded.is_open then coalesce(coc_status.opened_at, excluded.opened_at)
                else coc_status.opened_at
              end,
              closed_at = case
                when excluded.is_open then null
                else excluded.closed_at
              end,
              updated_at=now()
          returning *
          `,
                    [
                        body.day,
                        commune_id,
                        body.is_open,
                        body.open_mode,
                        open_from,
                        open_to,
                        body.room_phone,
                        body.notes,
                        opened_at,
                        closed_at,
                    ]
                );

                return { ok: true, row: up[0], commune_name: c[0].name };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
