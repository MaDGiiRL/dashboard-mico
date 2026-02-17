// server/src/routes/issuesReports.js
import { z } from "zod";
import { q, qAsUser } from "../db.js";
import { requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

const CreateIssueSchema = z.object({
  title: z.string().min(3),
  message: z.string().min(10),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
  page: z.string().optional().nullable(),
  user_agent: z.string().optional().nullable(),
});

const ListSchema = z.object({
  status: z.enum(["open", "closed", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

const IdParam = z.object({ id: z.coerce.number().int().positive() });
const SetStatusSchema = z.object({ status: z.enum(["open", "closed"]) });

export async function issueReportsRouter(app) {
  /**
   * POST /issue-reports
   * Chiunque loggato (viewer/editor/admin) può segnalare
   */
  app.post("/issue-reports", async (req, reply) => {
    await requireRole(["viewer", "editor", "admin"])(req, reply);
    if (reply.sent) return;

    try {
      const body = CreateIssueSchema.parse(req.body || {});

      const ua = body.user_agent ?? req.headers["user-agent"] ?? null;

      const created = (
        await qAsUser(
          req.user,
          `
          insert into issue_reports
            (reporter_user_id, reporter_email, reporter_name, reporter_role, page, user_agent, title, message, severity, status)
          values
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open')
          returning
            id, created_at, reporter_user_id, reporter_email, reporter_name, reporter_role,
            page, user_agent, title, message, severity, status
          `,
          [
            req.user?.id ?? null,
            req.user?.email ?? null,
            req.user?.display_name ?? req.user?.name ?? null,
            req.user?.role ?? null,
            body.page ?? null,
            ua,
            body.title.trim(),
            body.message.trim(),
            body.severity,
          ]
        )
      )[0];

      await logActivity({
        actor: req.user,
        section: "issues",
        entityType: "issue_report",
        entityId: created.id,
        action: "create",
        summary: `Nuova segnalazione: ${created.title} (${created.severity})`,
        after: created,
      });

      return { row: created };
    } catch (e) {
      return reply.status(400).send({ error: e.message || "Bad request" });
    }
  });

  /**
   * GET /admin/issue-reports?status=open|closed|all&limit=200
   * Solo admin
   */
  app.get("/admin/issue-reports", async (req, reply) => {
    await requireRole(["admin"])(req, reply);
    if (reply.sent) return;

    const { status, limit } = ListSchema.parse(req.query || {});
    const lim = Math.min(limit, 500);

    const base = `
      select
        id, created_at,
        reporter_user_id, reporter_email, reporter_name, reporter_role,
        page, user_agent,
        title, message, severity, status
      from issue_reports
    `;

    const rows =
      status === "all"
        ? await q(`${base} order by created_at desc limit $1`, [lim])
        : await q(`${base} where status=$1 order by created_at desc limit $2`, [status, lim]);

    return { rows };
  });

  /**
   * POST /admin/issue-reports/:id/status  body: { status: "open"|"closed" }
   * Solo admin
   */
  app.post("/admin/issue-reports/:id/status", async (req, reply) => {
    await requireRole(["admin"])(req, reply);
    if (reply.sent) return;

    try {
      const params = IdParam.parse(req.params);
      const body = SetStatusSchema.parse(req.body || {});

      const before = (await q(`select * from issue_reports where id=$1`, [params.id]))[0];
      if (!before) return reply.status(404).send({ error: "Not found" });

      const after = (
        await qAsUser(
          req.user,
          `
          update issue_reports
          set status=$1
          where id=$2
          returning
            id, created_at,
            reporter_user_id, reporter_email, reporter_name, reporter_role,
            page, user_agent,
            title, message, severity, status
          `,
          [body.status, params.id]
        )
      )[0];

      await logActivity({
        actor: req.user,
        section: "issues",
        entityType: "issue_report",
        entityId: params.id,
        action: "set_status",
        summary: `Segnalazione #${params.id} status: ${before.status} → ${after.status}`,
        before,
        after,
      });

      return { row: after };
    } catch (e) {
      return reply.status(400).send({ error: e.message || "Bad request" });
    }
  });
}
