// server/src/routes/safety_belluno.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

const ContactSchema = z.object({
    operator: z.string().nullable().optional().default(null),
    interno: z.string().nullable().optional().default(null),
    external_dial: z.string().nullable().optional().default(null),
    responder_group: z.string().nullable().optional().default(null),
    responder_digit: z.string().nullable().optional().default(null),
    responder_note: z.string().nullable().optional().default(null),
});

export async function safetyBellunoRoutes(app) {
    // LIST contatti (+ note opzionali)
    app.get(
        "/safety-belluno/contacts",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const query = z
                    .object({
                        with_notes: z.coerce.number().optional().default(0),
                    })
                    .parse(req.query);

                const contacts = await q(
                    `
          select id, operator, interno, external_dial, responder_group, responder_digit, responder_note,
                 created_at, updated_at
          from safety_contacts
          order by created_at desc
          `
                );

                if (!query.with_notes) return { contacts, notes: [] };

                const notes = await q(
                    `
          select n.id, n.contact_id, n.body, n.created_at, n.created_by_name
          from safety_contact_notes n
          order by n.created_at asc
          `
                );

                return { contacts, notes };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // CREATE contatto
    app.post(
        "/safety-belluno/contacts",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const body = ContactSchema.parse(req.body);

                const rows = await q(
                    `
          insert into safety_contacts(
            operator, interno, external_dial, responder_group, responder_digit, responder_note
          )
          values ($1,$2,$3,$4,$5,$6)
          returning *
          `,
                    [
                        body.operator?.trim() || null,
                        body.interno?.trim() || null,
                        body.external_dial?.trim() || null,
                        body.responder_group?.trim() || null,
                        body.responder_digit?.trim() || null,
                        body.responder_note?.trim() || null,
                    ]
                );

                return { ok: true, contact: rows[0] };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // UPDATE contatto (patch full)
    app.patch(
        "/safety-belluno/contacts/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                const body = ContactSchema.parse(req.body);

                const rows = await q(
                    `
          update safety_contacts
          set operator=$2,
              interno=$3,
              external_dial=$4,
              responder_group=$5,
              responder_digit=$6,
              responder_note=$7,
              updated_at=now()
          where id=$1
          returning *
          `,
                    [
                        params.id,
                        body.operator?.trim() || null,
                        body.interno?.trim() || null,
                        body.external_dial?.trim() || null,
                        body.responder_group?.trim() || null,
                        body.responder_digit?.trim() || null,
                        body.responder_note?.trim() || null,
                    ]
                );

                if (!rows?.[0]) return reply.status(404).send({ error: "Not found" });
                return { ok: true, contact: rows[0] };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // DELETE contatto (cascata note)
    app.delete(
        "/safety-belluno/contacts/:id",
        { preHandler: requireRole(["admin"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                const rows = await q(`delete from safety_contacts where id=$1 returning id`, [params.id]);
                if (!rows?.[0]) return reply.status(404).send({ error: "Not found" });
                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // LIST note di un contatto
    app.get(
        "/safety-belluno/contacts/:id/notes",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);

                const rows = await q(
                    `
          select id, contact_id, body, created_at, created_by_name
          from safety_contact_notes
          where contact_id=$1
          order by created_at asc
          `,
                    [params.id]
                );

                return { rows };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // ADD note (append)
    app.post(
        "/safety-belluno/contacts/:id/notes",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                const body = z.object({ body: z.string().min(1) }).parse(req.body);

                const actorName =
                    req.user?.display_name || req.user?.name || req.user?.email || "Utente";

                const c = await q(`select id from safety_contacts where id=$1 limit 1`, [params.id]);
                if (!c?.[0]) return reply.status(404).send({ error: "Contatto non trovato" });

                const rows = await q(
                    `
          insert into safety_contact_notes(contact_id, body, created_by_user_id, created_by_name)
          values($1,$2,$3,$4)
          returning id, contact_id, body, created_at, created_by_name
          `,
                    [params.id, body.body.trim(), req.user?.sub ?? null, actorName]
                );

                return { ok: true, note: rows[0] };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // DELETE nota
    app.delete(
        "/safety-belluno/notes/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                const rows = await q(`delete from safety_contact_notes where id=$1 returning id`, [params.id]);
                if (!rows?.[0]) return reply.status(404).send({ error: "Not found" });
                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
