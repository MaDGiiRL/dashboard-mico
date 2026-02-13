import { z } from "zod";
import { q } from "../db.js";
import { verifyPassword } from "../auth/password.js";
import { signJwt } from "../auth/jwt.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

export async function authRoutes(app) {
    app.post("/auth/login", async (req, reply) => {
        try {
            const body = z
                .object({
                    email: z.string().email(),
                    password: z.string().min(1),
                })
                .parse(req.body);

            const email = body.email.trim().toLowerCase();

            const user = (
                await q(
                    "select id, email, password_hash, display_name, role, is_active from users where lower(email)=lower($1) limit 1",
                    [email]
                )
            )[0];

            if (!user) return reply.code(401).send({ error: "Credenziali non valide" });
            if (!user.is_active) return reply.code(403).send({ error: "Account disabilitato" });

            const ok = await verifyPassword(body.password, user.password_hash);
            if (!ok) return reply.code(401).send({ error: "Credenziali non valide" });

            const token = signJwt({ id: user.id, email: user.email, role: user.role });

            await logActivity({
                actor: { id: user.id, email: user.email, role: user.role },
                section: "auth",
                entityType: "session",
                entityId: null,
                action: "login",
                summary: `Login ${user.email}`,
                meta: { ip: req.ip, ua: req.headers["user-agent"] || "" },
            });

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    display_name: user.display_name,
                    role: user.role,
                    is_active: user.is_active,
                },
            };
        } catch (e) {
            return reply.code(400).send({ error: e.message || "Bad request" });
        }
    });

    app.get("/me", async (req, reply) => {
        await requireAuth(req, reply);
        if (reply.sent) return;

        const user = (await q("select id, email, display_name, role, is_active from users where id=$1", [req.user.id]))[0];
        if (!user || !user.is_active) return reply.code(401).send({ error: "Unauthorized" });

        return { user };
    });

    app.post("/auth/logout", async (req, reply) => {
        await requireRole(["admin", "editor", "viewer"])(req, reply);
        if (reply.sent) return;

        await logActivity({
            actor: req.user,
            section: "auth",
            entityType: "session",
            entityId: null,
            action: "logout",
            summary: `Logout ${req.user?.email || req.user?.id}`,
            meta: { ip: req.ip, ua: req.headers["user-agent"] || "" },
        });

        return { ok: true };
    });
}
