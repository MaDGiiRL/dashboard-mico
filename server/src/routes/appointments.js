// server/src/routes/appointments.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

/**
 * Converte input (datetime-local / time / "YYYY-MM-DD HH:MM") in una stringa
 * "YYYY-MM-DDTHH:MM:SS" da castare a timestamptz lato Postgres.
 * Se arriva solo un orario, usa dayISO.
 */
function toIsoTs(dayISO, v) {
    if (!v) return null;
    const s = String(v).trim();

    // "YYYY-MM-DDTHH:MM" or "YYYY-MM-DDTHH:MM:SS"
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
        return s.length >= 19 ? s.slice(0, 19) : `${s}:00`;
    }

    // "YYYY-MM-DD HH:MM" or "YYYY-MM-DD HH:MM:SS"
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        const t = s.replace(" ", "T");
        return t.length >= 19 ? t.slice(0, 19) : `${t}:00`;
    }

    // "HH:MM" or "HH:MM:SS"
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        const hhmmss = s.length === 5 ? `${s}:00` : s;
        if (!dayISO) return null;
        return `${dayISO}T${hhmmss}`;
    }

    return null;
}

export async function appointmentsRoutes(app) {
    app.post(
        "/appointments",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const body = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        title: z.string().min(1),
                        location: z.string().optional().default(""),
                        description: z.string().optional().default(""),
                        starts_at: z.string().min(1),
                        ends_at: z.string().nullable().optional().default(null),
                        notes: z.string().optional().default(""),
                        source: z.string().optional().default("DB"),
                        external_id: z.string().nullable().optional().default(null),
                        is_ops_fixed: z.boolean().optional().default(false),
                    })
                    .parse(req.body);

                await q(`insert into op_days(day) values($1) on conflict (day) do nothing`, [body.day]);

                const startsTs = toIsoTs(body.day, body.starts_at);
                const endsTs = body.ends_at ? toIsoTs(body.day, body.ends_at) : null;

                if (!startsTs) return reply.code(400).send({ error: "starts_at non valido" });
                if (body.ends_at && !endsTs) return reply.code(400).send({ error: "ends_at non valido" });

                const rows = await q(
                    `
          insert into appointments(
            day, starts_at, ends_at, title, location, notes, description,
            source, external_id, is_ops_fixed, is_active
          )
          values (
            $1, $2::timestamptz, $3::timestamptz, $4, $5, $6, $7,
            $8, $9, $10, true
          )
          returning *
          `,
                    [
                        body.day,
                        startsTs,
                        endsTs,
                        body.title,
                        body.location,
                        body.notes,
                        body.description,
                        body.source,
                        body.external_id,
                        body.is_ops_fixed,
                    ]
                );

                return rows[0] || null;
            } catch (e) {
                return reply.code(400).send({ error: e.message || "Bad request" });
            }
        }
    );

    app.patch(
        "/appointments/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number() }).parse(req.params);

                const patch = z
                    .object({
                        title: z.string().min(1).optional(),
                        location: z.string().optional(),
                        description: z.string().optional(),
                        starts_at: z.string().optional(),
                        ends_at: z.string().nullable().optional(),
                        notes: z.string().optional(),
                        source: z.string().optional(),
                        external_id: z.string().nullable().optional(),
                        is_ops_fixed: z.boolean().optional(),
                        is_active: z.boolean().optional(),
                    })
                    .strict()
                    .parse(req.body);

                // serve day per ricostruire timestamp se arriva solo HH:MM
                const cur = await q(`select day from appointments where id=$1`, [params.id]);
                const dayISO = cur?.[0]?.day;
                if (!dayISO) return reply.code(404).send({ error: "Not found" });

                const sets = [];
                const vals = [];
                let i = 1;

                for (const [k, v] of Object.entries(patch)) {
                    if (k === "starts_at") {
                        const ts = toIsoTs(dayISO, v);
                        if (!ts) return reply.code(400).send({ error: "starts_at non valido" });
                        sets.push(`starts_at=$${i++}::timestamptz`);
                        vals.push(ts);
                        continue;
                    }
                    if (k === "ends_at") {
                        if (v === null) {
                            sets.push(`ends_at=null`);
                            continue;
                        }
                        const ts = toIsoTs(dayISO, v);
                        if (!ts) return reply.code(400).send({ error: "ends_at non valido" });
                        sets.push(`ends_at=$${i++}::timestamptz`);
                        vals.push(ts);
                        continue;
                    }

                    sets.push(`${k}=$${i++}`);
                    vals.push(v);
                }

                if (!sets.length) return reply.code(400).send({ error: "Empty patch" });

                vals.push(params.id);

                const rows = await q(
                    `
          update appointments
          set ${sets.join(", ")}, updated_at=now()
          where id=$${i}
          returning *
          `,
                    vals
                );

                return rows[0] || null;
            } catch (e) {
                return reply.code(400).send({ error: e.message || "Bad request" });
            }
        }
    );

    app.delete(
        "/appointments/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number() }).parse(req.params);

                const rows = await q(
                    `
          update appointments set is_active=false, updated_at=now()
          where id=$1 and is_active=true
          returning *
          `,
                    [params.id]
                );

                return rows[0] || null;
            } catch (e) {
                return reply.code(400).send({ error: e.message || "Bad request" });
            }
        }
    );
}
