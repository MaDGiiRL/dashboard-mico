// server/src/routes/events.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function eventsRoutes(app) {
    app.post("/events", { preHandler: requireRole(["admin", "editor"]) }, async (req, reply) => {
        try {
            const body = z
                .object({
                    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                    title: z.string().min(1),
                    location: z.string().optional().default(""),
                    description: z.string().optional().default(""),
                    starts_at: z.string().min(1),
                    ends_at: z.string().nullable().optional().default(null),
                    source: z.string().optional().default("DB"),
                    external_id: z.string().nullable().optional().default(null),
                })
                .parse(req.body);

            const rows = await q(
                `
        insert into events(day, title, location, description, starts_at, ends_at, source, external_id, is_active)
        values ($1,$2,$3,$4,$5,$6,$7,$8,true)
        returning *
        `,
                [body.day, body.title, body.location, body.description, body.starts_at, body.ends_at, body.source, body.external_id]
            );

            return rows[0] || null;
        } catch (e) {
            return reply.code(400).send({ error: e.message || "Bad request" });
        }
    });

    app.patch("/events/:id", { preHandler: requireRole(["admin", "editor"]) }, async (req, reply) => {
        try {
            const params = z.object({ id: z.coerce.number() }).parse(req.params);

            const patch = z
                .object({
                    title: z.string().min(1).optional(),
                    location: z.string().optional(),
                    description: z.string().optional(),
                    starts_at: z.string().optional(),
                    ends_at: z.string().nullable().optional(),
                    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
                    source: z.string().optional(),
                    external_id: z.string().nullable().optional(),
                    is_active: z.boolean().optional(),
                })
                .strict()
                .parse(req.body);

            const entries = Object.entries(patch);
            if (!entries.length) return reply.code(400).send({ error: "Empty patch" });

            const sets = [];
            const vals = [];
            let i = 1;

            for (const [k, v] of entries) {
                sets.push(`${k}=$${i++}`);
                vals.push(v);
            }
            vals.push(params.id);

            const rows = await q(
                `
        update events
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

    app.delete("/events/:id", { preHandler: requireRole(["admin", "editor"]) }, async (req, reply) => {
        try {
            const params = z.object({ id: z.coerce.number() }).parse(req.params);

            const rows = await q(
                `
        update events set is_active=false, updated_at=now()
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
