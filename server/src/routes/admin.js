// routes/admin.js
import { z } from "zod";
import { q } from "../db.js";
import { hashPassword } from "../auth/password.js";
import { requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

const ID_PARAM = z.object({ id: z.coerce.number().int().positive() }); // ✅ NON uuid

export async function adminRoutes(app) {
    // ===== USERS =====

    app.get("/admin/users", async (req, reply) => {
        try {
            requireRole(["admin"])(req);
            const users = await q(
                "select id, email, display_name, role, is_active, created_at from users order by created_at desc"
            );
            return { users };
        } catch (e) {
            return reply.status(403).send({ error: e.message || "Forbidden" });
        }
    });

    app.post("/admin/users", async (req, reply) => {
        try {
            requireRole(["admin"])(req);

            const body = z.object({
                email: z.string().email(),
                password: z.string().min(8),
                display_name: z.string().min(2),
                role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
            }).parse(req.body);

            const password_hash = await hashPassword(body.password);

            const created = (await q(
                `insert into users (email, password_hash, display_name, role)
         values ($1,$2,$3,$4)
         returning id, email, display_name, role, is_active, created_at`,
                [body.email.trim().toLowerCase(), password_hash, body.display_name.trim(), body.role]
            ))[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "user",
                entityId: created.id,
                action: "create",
                summary: `Creato utente ${created.email} (${created.role})`,
                after: created,
            });

            return { user: created };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    app.patch("/admin/users/:id/role", async (req, reply) => {
        try {
            requireRole(["admin"])(req);

            const params = ID_PARAM.parse(req.params);
            const body = z.object({ role: z.enum(["admin", "editor", "viewer"]) }).parse(req.body);

            const before = (await q("select id, email, display_name, role from users where id=$1", [params.id]))[0];
            if (!before) return reply.status(404).send({ error: "Not found" });

            const after = (await q(
                "update users set role=$1, updated_at=now() where id=$2 returning id, email, display_name, role",
                [body.role, params.id]
            ))[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "user",
                entityId: params.id,
                action: "update",
                summary: `Ruolo ${after.email}: ${before.role} → ${after.role}`,
                before,
                after,
            });

            return { user: after };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    // ===== ACCESS REQUESTS =====

    // GET /admin/access-requests
    app.get("/admin/access-requests", async (req, reply) => {
        try {
            requireRole(["admin"])(req);

            // opzionale: ?status=pending|approved|rejected|revoked|all
            const status = String(req.query?.status || "all");
            const allowed = new Set(["pending", "approved", "rejected", "revoked", "all"]);
            const s = allowed.has(status) ? status : "all";

            const rows =
                s === "all"
                    ? await q(
                        `select id, display_name, email, organization, reason, status, created_at, decided_at, decided_by, decision_note
               from access_requests
               order by created_at desc`
                    )
                    : await q(
                        `select id, display_name, email, organization, reason, status, created_at, decided_at, decided_by, decision_note
               from access_requests
               where status=$1
               order by created_at desc`,
                        [s]
                    );

            return { rows };
        } catch (e) {
            return reply.status(403).send({ error: e.message || "Forbidden" });
        }
    });

    // POST /admin/access-requests/:id/approve  body: { role }
    app.post("/admin/access-requests/:id/approve", async (req, reply) => {
        try {
            requireRole(["admin"])(req);

            const params = ID_PARAM.parse(req.params);
            const body = z.object({
                role: z.enum(["viewer", "editor", "admin"]).default("viewer"),
                note: z.string().optional().nullable(),
            }).parse(req.body || {});

            const ar = (await q("select * from access_requests where id=$1", [params.id]))[0];
            if (!ar) return reply.status(404).send({ error: "Not found" });
            if (ar.status !== "pending") return reply.status(409).send({ error: "Richiesta già processata" });

            // se esiste già utente con quella email, approvare non ha senso
            const existing = (await q("select id from users where lower(email)=lower($1) limit 1", [ar.email]))[0];
            if (existing) return reply.status(409).send({ error: "Esiste già un utente con questa email" });

            // password temporanea (admin la comunica fuori dal sistema)
            const tempPassword = `Temp${Math.random().toString(36).slice(2, 8)}!`;
            const password_hash = await hashPassword(tempPassword);

            const createdUser = (await q(
                `insert into users (email, password_hash, display_name, role, is_active)
         values ($1,$2,$3,$4,true)
         returning id, email, display_name, role, is_active, created_at`,
                [String(ar.email).toLowerCase(), password_hash, ar.display_name, body.role]
            ))[0];

            const updatedReq = (await q(
                `update access_requests
         set status='approved', decided_by=$2, decided_at=now(), decision_note=$3
         where id=$1
         returning id, display_name, email, organization, reason, status, created_at, decided_at, decided_by, decision_note`,
                [params.id, req.user?.id ?? null, body.note || null]
            ))[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "access_request",
                entityId: params.id,
                action: "approve",
                summary: `Approvata richiesta accesso ${updatedReq.email} → creato utente (${createdUser.role})`,
                after: { request: updatedReq, user: createdUser },
            });

            // IMPORTANTE: se non vuoi MAI rimandare la temp password al frontend, rimuovi questa proprietà.
            return { ok: true, request: updatedReq, user: createdUser, temp_password: tempPassword };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    // POST /admin/access-requests/:id/reject body: { note }
    app.post("/admin/access-requests/:id/reject", async (req, reply) => {
        try {
            requireRole(["admin"])(req);

            const params = ID_PARAM.parse(req.params);
            const body = z.object({ note: z.string().optional().nullable() }).parse(req.body || {});

            const ar = (await q("select * from access_requests where id=$1", [params.id]))[0];
            if (!ar) return reply.status(404).send({ error: "Not found" });
            if (ar.status !== "pending") return reply.status(409).send({ error: "Richiesta già processata" });

            const updated = (await q(
                `update access_requests
         set status='rejected', decided_by=$2, decided_at=now(), decision_note=$3
         where id=$1
         returning id, display_name, email, organization, reason, status, created_at, decided_at, decided_by, decision_note`,
                [params.id, req.user?.id ?? null, body.note || null]
            ))[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "access_request",
                entityId: params.id,
                action: "reject",
                summary: `Rifiutata richiesta accesso ${updated.email}`,
                after: updated,
            });

            return { ok: true, request: updated };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    // POST /admin/access-requests/:id/revoke body: { note }
    // (Revoca SOLO se approved: porta stato a revoked. Non cancella l'utente: per quello gestisci user.is_active altrove.)
    app.post("/admin/access-requests/:id/revoke", async (req, reply) => {
        try {
            requireRole(["admin"])(req);

            const params = ID_PARAM.parse(req.params);
            const body = z.object({ note: z.string().optional().nullable() }).parse(req.body || {});

            const ar = (await q("select * from access_requests where id=$1", [params.id]))[0];
            if (!ar) return reply.status(404).send({ error: "Not found" });
            if (ar.status !== "approved") return reply.status(409).send({ error: "Puoi revocare solo richieste approved" });

            const updated = (await q(
                `update access_requests
         set status='revoked', decided_by=$2, decided_at=now(), decision_note=$3
         where id=$1
         returning id, display_name, email, organization, reason, status, created_at, decided_at, decided_by, decision_note`,
                [params.id, req.user?.id ?? null, body.note || null]
            ))[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "access_request",
                entityId: params.id,
                action: "revoke",
                summary: `Revocata richiesta accesso ${updated.email}`,
                after: updated,
            });

            return { ok: true, request: updated };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
