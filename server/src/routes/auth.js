import { z } from "zod";
import { q } from "../db.js";
import { verifyPassword } from "../auth/password.js";
import { signJwt } from "../auth/jwt.js";
import { requireAuth } from "../auth/middleware.js";

export async function authRoutes(app) {
    app.post("/auth/login", async (req, reply) => {
        try {
            const body = z
                .object({
                    email: z.string().email(),
                    password: z.string().min(6),
                })
                .parse(req.body);

            const rows = await q("select * from users where email=$1 and is_active=true", [body.email]);
            const user = rows[0];
            if (!user) return reply.status(401).send({ error: "Invalid credentials" });

            const ok = await verifyPassword(body.password, user.password_hash);
            if (!ok) return reply.status(401).send({ error: "Invalid credentials" });

            const token = signJwt({
                sub: user.id,
                role: user.role,
                name: user.display_name,
                email: user.email,
            });

            return reply.send({
                token,
                user: { id: user.id, email: user.email, name: user.display_name, role: user.role },
            });
        } catch (e) {
            req.log?.error?.(e);

            if (e?.name === "ZodError") {
                return reply.status(400).send({
                    error: "Bad request",
                    issues: e.issues?.map((x) => ({ path: x.path?.join("."), message: x.message })) || [],
                });
            }

            // IMPORTANTISSIMO: torna il messaggio vero in dev
            return reply.status(500).send({
                error: "Login failed",
                detail: e?.message || String(e),
            });
        }
    });

    app.get("/me", async (req, reply) => {
        try {
            requireAuth(req);
            return reply.send({ user: req.user });
        } catch {
            return reply.status(401).send({ error: "Unauthorized" });
        }
    });
}
