// server/src/routes/note_entries.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

const ID_PARAM = z.object({ id: z.coerce.number().int().positive() });

export async function noteEntriesRoutes(app) {
    // LIST by day (opzionale, tu già le prendi dal dashboard)
    app.get(
        "/note-entries",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const query = z
                    .object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
                    .parse(req.query);

                const rows = await q(
                    `
          select
            id, day, source, external_id, body,
            created_at, updated_at,
            created_by_user_id, created_by_name
          from note_entries
          where day=$1
          order by created_at asc
          `,
                    [query.day]
                );

                return { rows };
            } catch (e) {
                return reply.status(400).send({ error: e.message || "Bad request" });
            }
        }
    );

    // CREATE
    app.post(
        "/note-entries",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const body = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        source: z.string().min(1),
                        external_id: z.string().min(1),
                        body: z.string().min(1),
                    })
                    .parse(req.body);

                const actorName =
                    req.user?.display_name ||
                    req.user?.name ||
                    req.user?.email ||
                    "Utente";

                const rows = await q(
                    `
          insert into note_entries(
            day, source, external_id, body,
            created_by_user_id, created_by_name
          )
          values ($1,$2,$3,$4,$5,$6)
          returning
            id, day, source, external_id, body,
            created_at, updated_at,
            created_by_user_id, created_by_name
          `,
                    [
                        body.day,
                        String(body.source).toUpperCase(),
                        String(body.external_id),
                        String(body.body),
                        req.user?.sub ?? null, // user id dal jwt (sub)
                        actorName,
                    ]
                );

                return rows[0];
            } catch (e) {
                return reply.status(400).send({ error: e.message || "Bad request" });
            }
        }
    );

    // UPDATE
    app.patch(
        "/note-entries/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = ID_PARAM.parse(req.params);
                const patch = z
                    .object({ body: z.string().min(1) })
                    .strict()
                    .parse(req.body);

                const rows = await q(
                    `
          update note_entries
          set body=$1, updated_at=now()
          where id=$2
          returning
            id, day, source, external_id, body,
            created_at, updated_at,
            created_by_user_id, created_by_name
          `,
                    [patch.body, params.id]
                );

                if (!rows[0]) return reply.status(404).send({ error: "Not found" });
                return rows[0];
            } catch (e) {
                return reply.status(400).send({ error: e.message || "Bad request" });
            }
        }
    );

    // DELETE
    app.delete(
        "/note-entries/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = ID_PARAM.parse(req.params);

                const rows = await q(
                    `
          delete from note_entries
          where id=$1
          returning id
          `,
                    [params.id]
                );

                if (!rows[0]) return reply.status(404).send({ error: "Not found" });
                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e.message || "Bad request" });
            }
        }
    );
}
