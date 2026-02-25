import { z } from "zod";
import { q, qAsUser } from "../db.js";
import { hashPassword } from "../auth/password.js";
import { requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

const ID_PARAM = z.object({ id: z.coerce.number().int().positive() });

export async function adminRoutes(app) {
    // ===== USERS =====

    app.get("/admin/users", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        const users = await q(
            "select id, email, display_name, role, is_active, created_at from users order by created_at desc"
        );
        return { users };
    });

    app.post("/admin/users", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        try {
            const body = z
                .object({
                    email: z.string().email(),
                    password: z.string().min(8),
                    display_name: z.string().min(2),
                    role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
                })
                .parse(req.body);

            const password_hash = await hashPassword(body.password);

            const created = (
                await qAsUser(
                    req.user,
                    `insert into users (email, password_hash, display_name, role)
           values ($1,$2,$3,$4)
           returning id, email, display_name, role, is_active, created_at`,
                    [body.email.trim().toLowerCase(), password_hash, body.display_name.trim(), body.role]
                )
            )[0];

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
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        try {
            const params = ID_PARAM.parse(req.params);
            const body = z.object({ role: z.enum(["admin", "editor", "viewer"]) }).parse(req.body);

            const before = (await q("select id, email, display_name, role from users where id=$1", [params.id]))[0];
            if (!before) return reply.status(404).send({ error: "Not found" });

            const after = (
                await qAsUser(
                    req.user,
                    "update users set role=$1, updated_at=now() where id=$2 returning id, email, display_name, role",
                    [body.role, params.id]
                )
            )[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "user",
                entityId: params.id,
                action: "update_role",
                summary: `Ruolo ${after.email}: ${before.role} → ${after.role}`,
                before,
                after,
            });

            return { user: after };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    app.patch("/admin/users/:id/active", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        try {
            const params = ID_PARAM.parse(req.params);
            const body = z.object({ is_active: z.coerce.boolean() }).parse(req.body);

            const before = (await q("select id, email, is_active from users where id=$1", [params.id]))[0];
            if (!before) return reply.status(404).send({ error: "Not found" });

            const after = (
                await qAsUser(
                    req.user,
                    "update users set is_active=$1, updated_at=now() where id=$2 returning id, email, is_active",
                    [body.is_active, params.id]
                )
            )[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "user",
                entityId: params.id,
                action: "set_active",
                summary: `Utente ${after.email} is_active: ${before.is_active} → ${after.is_active}`,
                before,
                after,
            });

            return { user: after };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    // ===== ACCESS REQUESTS =====

    app.get("/admin/access-requests", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        const status = String(req.query?.status || "all");
        const allowed = new Set(["pending", "approved", "rejected", "revoked", "all"]);
        const s = allowed.has(status) ? status : "all";

        // ✅ nuovo schema: niente reason
        const baseSql = `
      select id, display_name, email, organization, status, created_at
      from access_requests
    `;

        const rows =
            s === "all"
                ? await q(`${baseSql} order by created_at desc`)
                : await q(`${baseSql} where status=$1 order by created_at desc`, [s]);

        return { rows };
    });

    app.post("/admin/access-requests/:id/approve", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        try {
            const params = ID_PARAM.parse(req.params);
            const body = z
                .object({
                    role: z.enum(["viewer", "editor", "admin"]).default("viewer"),
                })
                .parse(req.body || {});

            // ✅ leggiamo password_hash dalla richiesta
            const ar = (
                await q(
                    "select id, email, display_name, organization, status, password_hash from access_requests where id=$1",
                    [params.id]
                )
            )[0];
            if (!ar) return reply.status(404).send({ error: "Not found" });
            if (ar.status !== "pending") return reply.status(409).send({ error: "Richiesta già processata" });

            const existing = (await q("select id from users where lower(email)=lower($1) limit 1", [ar.email]))[0];
            if (existing) return reply.status(409).send({ error: "Esiste già un utente con questa email" });

            if (!ar.password_hash) {
                return reply.status(400).send({ error: "Richiesta senza password. Richiedi all’utente di reinviarla." });
            }

            const createdUser = (
                await qAsUser(
                    req.user,
                    `insert into users (email, password_hash, display_name, role, is_active)
           values ($1,$2,$3,$4,true)
           returning id, email, display_name, role, is_active, created_at`,
                    [String(ar.email).toLowerCase(), ar.password_hash, ar.display_name, body.role]
                )
            )[0];

            const updatedReq = (
                await qAsUser(
                    req.user,
                    `update access_requests
           set status='approved'
           where id=$1
           returning id, display_name, email, organization, status, created_at`,
                    [params.id]
                )
            )[0];

            await logActivity({
                actor: req.user,
                section: "admin",
                entityType: "access_request",
                entityId: params.id,
                action: "approve",
                summary: `Approvata richiesta accesso ${updatedReq.email} → creato utente (${createdUser.role})`,
                after: { request: updatedReq, user: createdUser },
            });

            // ✅ niente temp_password
            return { ok: true, request: updatedReq, user: createdUser };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    app.post("/admin/access-requests/:id/reject", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        try {
            const params = ID_PARAM.parse(req.params);

            const ar = (await q("select * from access_requests where id=$1", [params.id]))[0];
            if (!ar) return reply.status(404).send({ error: "Not found" });
            if (ar.status !== "pending") return reply.status(409).send({ error: "Richiesta già processata" });

            const updated = (
                await qAsUser(
                    req.user,
                    `update access_requests
           set status='rejected'
           where id=$1
           returning id, display_name, email, organization, status, created_at`,
                    [params.id]
                )
            )[0];

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

    app.post("/admin/access-requests/:id/revoke", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        try {
            const params = ID_PARAM.parse(req.params);

            const ar = (await q("select * from access_requests where id=$1", [params.id]))[0];
            if (!ar) return reply.status(404).send({ error: "Not found" });
            if (ar.status !== "approved") return reply.status(409).send({ error: "Puoi revocare solo richieste approved" });

            const updated = (
                await qAsUser(
                    req.user,
                    `update access_requests
           set status='revoked'
           where id=$1
           returning id, display_name, email, organization, status, created_at`,
                    [params.id]
                )
            )[0];

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

    // ===== LOGS =====

    // GET /admin/activity-logs?limit=200
    app.get("/admin/activity-logs", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        const limit = Math.min(Number(req.query?.limit || 200), 500);

        const rows = await q(
            `
    select
      id,
      occurred_at,
      actor_user_id,
      actor_name,
      actor_role,
      section,
      entity_type,
      entity_id,
      action,
      summary,
      before,
      after
    from activity_logs
    order by occurred_at desc
    limit $1
    `,
            [limit]
        );

        return { rows };
    });

    app.get("/admin/db-audit", async (req, reply) => {
        await requireRole(["admin"])(req, reply);
        if (reply.sent) return;

        const limit = Math.min(Number(req.query?.limit || 200), 500);

        const rows = await q(
            `
        select
          ac.id,
          ac.changed_at,
          ac.table_name,
          ac.op,
          ac.actor_user_id,
          ac.actor_email,
          ac.actor_role,
          u.display_name as actor_name
        from audit_changes ac
        left join users u on u.id = ac.actor_user_id
        order by ac.changed_at desc
        limit $1
        `,
            [limit]
        );

        return { rows };
    });
}