// routes/access_requests.js
import { z } from "zod";
import { q } from "../db.js";

export async function accessRequestsRoutes(app) {
    // pubblico: RequestAccess page
    app.post("/access-requests", async (req, reply) => {
        try {
            const body = z.object({
                name: z.string().min(2),
                email: z.string().email(),
                ente: z.string().optional().nullable(),
                note: z.string().optional().nullable(),
            }).parse(req.body);

            const email = body.email.trim().toLowerCase();
            const display_name = body.name.trim();
            const organization = (body.ente || "").trim() || null;
            const reason = (body.note || "").trim() || null;

            // evita richiesta se utente già esiste
            const u = await q("select id from users where lower(email)=lower($1) limit 1", [email]);
            if (u?.[0]) return reply.status(409).send({ error: "Utente già presente. Contatta l'amministrazione." });

            // evita spam: richiesta pending già presente
            const existing = await q(
                "select id from access_requests where lower(email)=lower($1) and status='pending' order by created_at desc limit 1",
                [email]
            );
            if (existing?.[0]) return reply.status(409).send({ error: "Hai già una richiesta in valutazione." });

            const created = (await q(
                `insert into access_requests (display_name, email, organization, reason, status)
         values ($1,$2,$3,$4,'pending')
         returning id, display_name, email, organization, reason, status, created_at`,
                [display_name, email, organization, reason]
            ))[0];

            return { ok: true, request: created };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
