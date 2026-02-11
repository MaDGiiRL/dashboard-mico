// server/auth/middleware.js
import { verifyJwt } from "./jwt.js";

export function requireAuth(req) {
    const h = req.headers.authorization;
    if (!h || !h.startsWith("Bearer ")) throw new Error("Unauthorized");

    const token = h.slice("Bearer ".length).trim();
    if (!token) throw new Error("Unauthorized");

    req.user = verifyJwt(token);
}

export function requireRole(roles) {
    return (req) => {
        requireAuth(req);
        if (!req.user) throw new Error("Unauthorized");
        if (!roles.includes(req.user.role)) throw new Error("Forbidden");
    };
}
