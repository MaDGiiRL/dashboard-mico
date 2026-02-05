import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

export async function issuesRoutes(app) {
    app.get("/issues/:id/comments", async (req, reply) => {
        try {
            requireRole(["admin", "editor", "viewer"])(req);
            const p = z.object({ id: z.string().uuid() }).parse(req.params);
            const rows = await q(`select * from issue_comments where issue_id=$1 order by created_at asc`, [p.id]);
            return { rows };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });

    app.post("/issues/:id/comments", async (req, reply) => {
        try {
            requireRole(["admin", "editor"])(req);
            const p = z.object({ id: z.string().uuid() }).parse(req.params);
            const b = z.object({ message: z.string().min(1) }).parse(req.body);

            const issue = (await q(`select * from issues where id=$1`, [p.id]))[0];
            if (!issue) return reply.status(404).send({ error: "Issue not found" });

            const row = (await q(
                `insert into issue_comments (issue_id, author_name, message)
         values ($1,$2,$3) returning *`,
                [p.id, req.user?.name || "?", b.message]
            ))[0];

            await logActivity({
                actor: req.user,
                section: "issues",
                entityType: "issue_comment",
                entityId: row.id,
                action: "comment",
                summary: `Commento su criticità: ${issue.title}`,
                after: row,
            });

            return { row };
        } catch (e) {
            return reply.status(400).send({ error: e.message || "Bad request" });
        }
    });
}
