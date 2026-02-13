// server/src/routes/coc_notes.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function cocNotesRoutes(app) {
    // list
    app.get(
        "/coc-notes",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const query = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        commune_name: z.string().min(2),
                    })
                    .parse(req.query);

                const name = query.commune_name.trim();

                const c = await q(
                    `select id, name from coc_communes where lower(name)=lower($1) limit 1`,
                    [name]
                );
                if (!c?.[0]) return { rows: [] };

                const rows = await q(
                    `
          select id, day, body, created_at, created_by_name
          from coc_notes
          where day=$1 and commune_id=$2
          order by created_at asc
          `,
                    [query.day, c[0].id]
                );

                return { rows };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // create (✅ trova o crea comune)
    app.post(
        "/coc-notes",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const body = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        commune_name: z.string().min(2),
                        body: z.string().min(1),
                    })
                    .parse(req.body);

                const actorName =
                    req.user?.display_name || req.user?.name || req.user?.email || "Utente";

                const name = body.commune_name.trim();

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

                const rows = await q(
                    `
          insert into coc_notes(day, commune_id, body, created_by_user_id, created_by_name)
          values($1,$2,$3,$4,$5)
          returning id, day, body, created_at, created_by_name
          `,
                    [body.day, c[0].id, body.body.trim(), req.user?.sub ?? null, actorName]
                );

                return rows[0];
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // delete
    app.delete(
        "/coc-notes/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                const rows = await q(`delete from coc_notes where id=$1 returning id`, [params.id]);
                if (!rows?.[0]) return reply.status(404).send({ error: "Not found" });
                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
