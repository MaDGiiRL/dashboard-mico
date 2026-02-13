// server/src/routes/coc_communes.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

const ContactSchema = z.object({
    contact_name: z.string().min(1),
    phone: z.string().min(3),
});

export async function cocCommunesRoutes(app) {
    // list (opzionale)
    app.get(
        "/coc-communes",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (_req, reply) => {
            try {
                const communes = await q(
                    `select id, name, created_at
           from coc_communes
           order by name asc`
                );

                const contacts = await q(
                    `select id, commune_id, contact_name, phone, created_at
           from coc_commune_contacts
           order by created_at asc`
                );

                return { communes, contacts };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // upsert + REPLACE contacts (non append)
    app.post(
        "/coc-communes/upsert",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const body = z
                    .object({
                        name: z.string().min(2),
                        contacts: z.array(ContactSchema).optional().default([]),
                    })
                    .parse(req.body);

                const name = body.name.trim();

                // find case-insensitive
                const found = await q(
                    `select id, name from coc_communes where lower(name)=lower($1) limit 1`,
                    [name]
                );

                let commune;
                if (found?.[0]) {
                    commune = found[0];
                } else {
                    const ins = await q(
                        `insert into coc_communes(name) values($1) returning id, name`,
                        [name]
                    );
                    commune = ins[0];
                }

                // replace contacts
                await q(`delete from coc_commune_contacts where commune_id=$1`, [
                    commune.id,
                ]);

                for (const c of body.contacts) {
                    await q(
                        `insert into coc_commune_contacts(commune_id, contact_name, phone)
             values ($1,$2,$3)`,
                        [commune.id, c.contact_name.trim(), c.phone.trim()]
                    );
                }

                const contacts = await q(
                    `select id, contact_name, phone, created_at
           from coc_commune_contacts
           where commune_id=$1
           order by created_at asc`,
                    [commune.id]
                );

                return { ...commune, contacts };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
