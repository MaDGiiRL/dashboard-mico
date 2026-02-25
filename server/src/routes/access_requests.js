import { z } from "zod";
import { q } from "../db.js";
import bcrypt from "bcryptjs";

export async function accessRequestsRoutes(app) {
    app.post("/access-requests", async (req, reply) => {
        try {
            const body = z
                .object({
                    name: z.string().min(2),
                    email: z.string().email(),
                    ente: z.string().optional().nullable(),
                    password: z.string().min(8),
                })
                .parse(req.body);

            const email = body.email.trim().toLowerCase();
            const display_name = body.name.trim();
            const organization = (body.ente || "").trim() || null;

            const u = await q(
                "select id from users where lower(email)=lower($1) limit 1",
                [email]
            );
            if (u?.[0])
                return reply
                    .status(409)
                    .send({ error: "Utente già presente. Contatta l'amministrazione." });

            const existing = await q(
                "select id from access_requests where lower(email)=lower($1) and status='pending' order by created_at desc limit 1",
                [email]
            );
            if (existing?.[0])
                return reply.status(409).send({ error: "Hai già una richiesta in valutazione." });

            const password_hash = await bcrypt.hash(body.password, 12);

            // ✅ NIENTE reason
            const created = (
                await q(
                    `insert into access_requests (display_name, email, organization, password_hash, status)
           values ($1,$2,$3,$4,'pending')
           returning id, display_name, email, organization, status, created_at`,
                    [display_name, email, organization, password_hash]
                )
            )[0];

            return { ok: true, request: created };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}