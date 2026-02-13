import { verifyJwt } from "./jwt.js";
import { q } from "../db.js";

export async function requireAuth(req, reply) {
    try {
        const h = req.headers.authorization;
        if (!h || !h.startsWith("Bearer ")) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }

        const token = h.slice("Bearer ".length).trim();
        if (!token) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }

        const decoded = verifyJwt(token);

        // ✅ ruolo e stato da DB (evita token vecchi dopo disable/role change)
        const dbUser = (await q("select id, email, role, is_active from users where id=$1", [decoded.id]))[0];
        if (!dbUser || !dbUser.is_active) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }

        req.user = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
        };
    } catch {
        reply.code(401).send({ error: "Invalid token" });
    }
}

export function requireRole(roles) {
    return async function (req, reply) {
        await requireAuth(req, reply);
        if (reply.sent) return;

        if (!req.user) {
            reply.code(401).send({ error: "Unauthorized" });
            return;
        }

        if (!roles.includes(req.user.role)) {
            reply.code(403).send({ error: "Forbidden" });
            return;
        }
    };
}
