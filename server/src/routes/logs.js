import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function logsRoutes(app) {
    app.get("/activity-logs", async (req, reply) => {
        try {
            requireRole(["admin", "editor", "viewer"])(req);

            const query = z.object({
                section: z.string().optional(),
                day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
                limit: z.coerce.number().min(1).max(200).default(50),
            }).parse(req.query);

            let sql = `select * from activity_logs where 1=1`;
            const params = [];
            let idx = 1;

            if (query.section) {
                sql += ` and section=$${idx++}`;
                params.push(query.section);
            }
            if (query.day) {
                sql += ` and occurred_at >= $${idx++}::date and occurred_at < ($${idx++}::date + interval '1 day')`;
                params.push(query.day, query.day);
            }
            sql += ` order by occurred_at desc limit $${idx++}`;
            params.push(query.limit);

            const rows = await q(sql, params);
            return { rows };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
