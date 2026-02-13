// server/src/routes/races.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

function toIsoTs(dayISO, v) {
    if (!v) return null;
    const s = String(v).trim();

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
        return s.length >= 19 ? s.slice(0, 19) : `${s}:00`;
    }

    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        const t = s.replace(" ", "T");
        return t.length >= 19 ? t.slice(0, 19) : `${t}:00`;
    }

    if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        const hhmmss = s.length === 5 ? `${s}:00` : s;
        if (!dayISO) return null;
        return `${dayISO}T${hhmmss}`;
    }

    return null;
}

export async function racesRoutes(app) {
    app.post("/races", { preHandler: requireRole(["admin", "editor"]) }, async (req, reply) => {
        try {
            const body = z
                .object({
                    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                    name: z.string().min(1),
                    sport: z.string().optional().default(""),
                    venue: z.string().optional().default(""),
                    description: z.string().optional().default(""),
                    starts_at: z.string().min(1),
                    ends_at: z.string().nullable().optional().default(null),
                    notes: z.string().optional().default(""),
                })
                .parse(req.body);

            await q(`insert into op_days(day) values($1) on conflict (day) do nothing`, [body.day]);

            const startsTs = toIsoTs(body.day, body.starts_at);
            const endsTs = body.ends_at ? toIsoTs(body.day, body.ends_at) : null;

            if (!startsTs) return reply.code(400).send({ error: "starts_at non valido" });
            if (body.ends_at && !endsTs) return reply.code(400).send({ error: "ends_at non valido" });

            const rows = await q(
                `
        insert into races(day, name, sport, venue, description, starts_at, ends_at, notes, is_active)
        values ($1,$2,$3,$4,$5, $6::timestamptz, $7::timestamptz, $8, true)
        returning *
        `,
                [body.day, body.name, body.sport, body.venue, body.description, startsTs, endsTs, body.notes]
            );

            return rows[0] || null;
        } catch (e) {
            return reply.code(400).send({ error: e.message || "Bad request" });
        }
    });

    app.patch("/races/:id", { preHandler: requireRole(["admin", "editor"]) }, async (req, reply) => {
        try {
            const params = z.object({ id: z.coerce.number() }).parse(req.params);

            const patch = z
                .object({
                    name: z.string().min(1).optional(),
                    sport: z.string().optional(),
                    venue: z.string().optional(),
                    description: z.string().optional(),
                    starts_at: z.string().optional(),
                    ends_at: z.string().nullable().optional(),
                    notes: z.string().optional(),
                    is_active: z.boolean().optional(),
                })
                .strict()
                .parse(req.body);

            const cur = await q(`select day from races where id=$1`, [params.id]);
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
        update races
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
    });

    app.delete("/races/:id", { preHandler: requireRole(["admin", "editor"]) }, async (req, reply) => {
        try {
            const params = z.object({ id: z.coerce.number() }).parse(req.params);

            const rows = await q(
                `
        update races set is_active=false, updated_at=now()
        where id=$1 and is_active=true
        returning *
        `,
                [params.id]
            );

            return rows[0] || null;
        } catch (e) {
            return reply.code(400).send({ error: e.message || "Bad request" });
        }
    });
}
