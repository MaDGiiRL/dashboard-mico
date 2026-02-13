// server/src/routes/utility_links.js
import { z } from "zod";
import { q } from "../db.js";

const CreateSchema = z.object({
    title: z.string().min(1).max(120),
    href: z.string().url(),
    subtitle: z.string().max(200).optional().nullable(),
    sort_order: z.number().int().optional().default(0),
});

export async function utilityLinksRoutes(app) {
    // Se hai un hook auth globale, aggancialo qui (se non esiste, non succede nulla)
    const authOpts = app.authenticate ? { preHandler: [app.authenticate] } : {};

    // LIST
    app.get("/utility-links", authOpts, async () => {
        return await q(
            `SELECT id, title, href, subtitle, sort_order
       FROM utility_links
       WHERE is_active = true
       ORDER BY sort_order ASC, id ASC`
        );
    });

    // CREATE
    app.post("/utility-links", authOpts, async (req, reply) => {
        const body = CreateSchema.parse(req.body);

        const rows = await q(
            `INSERT INTO utility_links (title, href, subtitle, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, href, subtitle, sort_order`,
            [body.title, body.href, body.subtitle ?? null, body.sort_order ?? 0]
        );

        reply.code(201);
        return rows[0];
    });

    // DELETE (soft delete)
    app.delete("/utility-links/:id", authOpts, async (req, reply) => {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return reply.code(400).send({ error: "Bad id" });

        await q(`UPDATE utility_links SET is_active=false WHERE id=$1`, [id]);
        reply.code(204).send();
    });
}
