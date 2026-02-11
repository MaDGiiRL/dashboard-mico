import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

/**
 * Helper: risposta 400 per Zod
 */
function zod400(reply, e) {
    return reply.status(400).send({
        error: "Bad request",
        issues:
            e.issues?.map((x) => ({
                path: x.path?.join("."),
                message: x.message,
            })) || [],
    });
}

export async function issuesRoutes(app) {
    /* =========================
       GET /issues/:id/comments
       ========================= */
    app.get("/issues/:id/comments", async (req, reply) => {
        try {
            // auth + ruolo
            requireRole(["admin", "editor", "viewer"])(req);

            const params = z.object({
                id: z.string().uuid(),
            }).parse(req.params);

            const rows = await q(
                `select *
                 from issue_comments
                 where issue_id = $1
                 order by created_at asc`,
                [params.id]
            );

            return reply.send({ rows });
        } catch (e) {
            req.log?.error?.(e);

            if (e?.name === "ZodError") return zod400(reply, e);
            if (e?.message === "Unauthorized")
                return reply.status(401).send({ error: "Unauthorized" });
            if (e?.message === "Forbidden")
                return reply.status(403).send({ error: "Forbidden" });

            return reply.status(500).send({ error: "Failed to load issue comments" });
        }
    });

    /* =========================
       POST /issues/:id/comments
       ========================= */
    app.post("/issues/:id/comments", async (req, reply) => {
        try {
            requireRole(["admin", "editor"])(req);

            const params = z.object({
                id: z.string().uuid(),
            }).parse(req.params);

            const body = z.object({
                message: z.string().min(1).max(4000),
            }).parse(req.body);

            const issue = (
                await q(`select * from issues where id=$1`, [params.id])
            )[0];

            if (!issue) {
                return reply.status(404).send({ error: "Issue not found" });
            }

            const row = (
                await q(
                    `insert into issue_comments (issue_id, author_name, message)
                     values ($1, $2, $3)
                     returning *`,
                    [params.id, req.user?.name || "?", body.message]
                )
            )[0];

            await logActivity({
                actor: req.user,
                section: "issues",
                entityType: "issue_comment",
                entityId: row.id,
                action: "comment",
                summary: `Commento su criticità: ${issue.title}`,
                after: row,
            });

            return reply.send({ row });
        } catch (e) {
            req.log?.error?.(e);

            if (e?.name === "ZodError") return zod400(reply, e);
            if (e?.message === "Unauthorized")
                return reply.status(401).send({ error: "Unauthorized" });
            if (e?.message === "Forbidden")
                return reply.status(403).send({ error: "Forbidden" });

            return reply.status(500).send({ error: "Failed to add issue comment" });
        }
    });
}
