// server/src/routes/ana.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function anaRoutes(app) {
    // =========================
    // ITEMS
    // =========================

    // GET /ana/items?day=YYYY-MM-DD|&place=...
    app.get(
        "/ana/items",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const Q = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
                        place: z.string().min(1).optional(),
                    })
                    .parse(req.query || {});

                const rows = await q(
                    `
          select
            ai.id,
            ai.day,
            ai.place,
            ai.section_id,
            ai.section_title,
            ai.item_text,
            ai.created_at
          from ana_items ai
          where
            ($1::date is null or ai.day = $1::date)
            and ($2::text is null or ai.place = $2::text)
          order by ai.created_at desc
          `,
                    [Q.day ?? null, Q.place ?? null]
                );

                return { rows };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // POST /ana/items
    app.post(
        "/ana/items",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const B = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), // null = globale
                        place: z.string().min(1),
                        section_id: z.string().nullable().optional(),
                        section_title: z.string().nullable().optional(),
                        item_text: z.string().min(1),
                    })
                    .parse(req.body);

                const row = await q(
                    `
          insert into ana_items(day, place, section_id, section_title, item_text, created_by_user_id)
          values ($1::date, $2, $3, $4, $5, $6)
          returning
            id, day, place, section_id, section_title, item_text, created_at
          `,
                    [
                        B.day ?? null,
                        B.place,
                        B.section_id ?? null,
                        B.section_title ?? null,
                        B.item_text,
                        req.user?.id ?? null,
                    ]
                ).then((r) => r[0]);

                return { row };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // ✅ PATCH /ana/items/:id  (modifica voce + spostamento sezione)
    app.patch(
        "/ana/items/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);

                const B = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
                        place: z.string().min(1).optional(),
                        section_id: z.string().nullable().optional(),
                        section_title: z.string().nullable().optional(),
                        item_text: z.string().min(1).optional(),
                    })
                    .refine((x) => Object.keys(x).length > 0, "Nessun campo da aggiornare")
                    .parse(req.body);

                const sets = [];
                const vals = [];
                let i = 1;

                if ("day" in B) {
                    sets.push(`day = $${i++}::date`);
                    vals.push(B.day ?? null);
                }
                if ("place" in B) {
                    sets.push(`place = $${i++}::text`);
                    vals.push(B.place);
                }
                if ("section_id" in B) {
                    sets.push(`section_id = $${i++}::text`);
                    vals.push(B.section_id ?? null);
                }
                if ("section_title" in B) {
                    sets.push(`section_title = $${i++}::text`);
                    vals.push(B.section_title ?? null);
                }
                if ("item_text" in B) {
                    sets.push(`item_text = $${i++}::text`);
                    vals.push(B.item_text);
                }

                if (!sets.length) {
                    return reply.status(400).send({ error: "Nessun campo da aggiornare" });
                }

                vals.push(params.id);

                const row = await q(
                    `
          update ana_items
          set ${sets.join(", ")}
          where id = $${i}
          returning id, day, place, section_id, section_title, item_text, created_at
          `,
                    vals
                ).then((r) => r[0]);

                return { row };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // DELETE /ana/items/:id
    app.delete(
        "/ana/items/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                await q(`delete from ana_items where id = $1`, [params.id]);
                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // =========================
    // NOTES
    // =========================

    // GET /ana/notes?day=...&place=...&section_id=...&section_title=...
    app.get(
        "/ana/notes",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const Q = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
                        place: z.string().min(1).optional(),
                        section_id: z.string().min(1).optional(),
                        section_title: z.string().min(1).optional(),
                    })
                    .parse(req.query || {});

                const rows = await q(
                    `
          select
            an.id,
            an.day,
            an.place,
            an.section_id,
            an.section_title,
            an.body,
            an.created_at
          from ana_notes an
          where
            ($1::date is null or an.day = $1::date)
            and ($2::text is null or an.place = $2::text)
            and ($3::text is null or an.section_id = $3::text)
            and ($4::text is null or an.section_title = $4::text)
          order by an.created_at desc
          `,
                    [Q.day ?? null, Q.place ?? null, Q.section_id ?? null, Q.section_title ?? null]
                );

                return { rows };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // POST /ana/notes
    app.post(
        "/ana/notes",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const B = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(), // null = globale
                        place: z.string().min(1),
                        section_id: z.string().nullable().optional(),
                        section_title: z.string().nullable().optional(),
                        body: z.string().min(1),
                    })
                    .parse(req.body);

                const row = await q(
                    `
          insert into ana_notes(day, place, section_id, section_title, body, created_by_user_id)
          values ($1::date, $2, $3, $4, $5, $6)
          returning
            id, day, place, section_id, section_title, body, created_at
          `,
                    [
                        B.day ?? null,
                        B.place,
                        B.section_id ?? null,
                        B.section_title ?? null,
                        B.body,
                        req.user?.id ?? null,
                    ]
                ).then((r) => r[0]);

                return { row };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // DELETE /ana/notes/:id
    app.delete(
        "/ana/notes/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                await q(`delete from ana_notes where id = $1`, [params.id]);
                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // =========================
    // (OPZIONALE) RENAME SEZIONE
    // =========================
    app.post(
        "/ana/sections/rename",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const B = z
                    .object({
                        place: z.string().min(1),
                        from_title: z.string().min(1),
                        to_title: z.string().min(1),
                        section_id: z.string().nullable().optional(),
                    })
                    .parse(req.body);

                await q(
                    `
          update ana_items
          set section_title = $3
          where place = $1
            and lower(section_title) = lower($2)
            and ($4::text is null or section_id = $4::text)
          `,
                    [B.place, B.from_title, B.to_title, B.section_id ?? null]
                );

                await q(
                    `
          update ana_notes
          set section_title = $3
          where place = $1
            and lower(section_title) = lower($2)
            and ($4::text is null or section_id = $4::text)
          `,
                    [B.place, B.from_title, B.to_title, B.section_id ?? null]
                );

                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
