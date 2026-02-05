import { z } from "zod";
import { q } from "../db.js";
import { hashPassword } from "../auth/password.js";
import { requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

export async function adminRoutes(app) {
    app.get("/admin/users", async (req, reply) => {
        try {
            requireRole(["admin"])(req);
            const users = await q("select id, email, display_name, role, is_active, created_at from users order by created_at desc");
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
         returning id, email, display_name, role`,
                [body.email, password_hash, body.display_name, body.role]
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

            const params = z.object({ id: z.string().uuid() }).parse(req.params);
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
}
