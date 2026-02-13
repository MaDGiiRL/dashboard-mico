import { z } from "zod";
import { q, qAsUser } from "../db.js";
import { requireRole } from "../auth/middleware.js";
import { logActivity } from "../audit/audit.js";

const idParam = z.object({ id: z.string().uuid() });

export async function crudRoutes(app) {
    const resources = [
        { table: "op_days", section: "days", entityType: "op_day", orderBy: "day desc" },
        { table: "appointments", section: "appointments", entityType: "appointment", orderBy: "starts_at asc" },
        { table: "coc_communes", section: "coc", entityType: "commune", orderBy: "name asc" },
        { table: "coc_status", section: "coc", entityType: "coc_status", orderBy: "updated_at desc" },
        { table: "safety_room_presence", section: "safety", entityType: "safety_presence", orderBy: "person_name asc" },
        { table: "contingents", section: "contingents", entityType: "contingent", orderBy: "updated_at desc" },
        { table: "contingent_teams", section: "contingents", entityType: "contingent_team", orderBy: "team_name asc" },
        { table: "aib_oncall", section: "aib", entityType: "aib_oncall", orderBy: "person_name asc" },
        { table: "aib_weekday_teams", section: "aib", entityType: "aib_weekday_team", orderBy: "location asc" },
        { table: "volunteer_weekend_teams", section: "volunteers", entityType: "volunteer_team", orderBy: "team_name asc" },
        { table: "vehicles", section: "vehicles", entityType: "vehicle", orderBy: "name asc" },
        { table: "vehicle_deployments", section: "vehicles", entityType: "vehicle_deployment", orderBy: "updated_at desc" },
        { table: "races", section: "races", entityType: "race", orderBy: "starts_at asc" },
        { table: "map_features", section: "map", entityType: "map_feature", orderBy: "updated_at desc" },
        { table: "issues", section: "issues", entityType: "issue", orderBy: "updated_at desc" },
        { table: "weather_bulletins", section: "weather", entityType: "weather_bulletin", orderBy: "created_at desc" },
        { table: "contacts", section: "contacts", entityType: "contact", orderBy: "full_name asc" },
    ];

    for (const r of resources) {
        const base = `/api/${r.table}`;

        app.get(base, async (req, reply) => {
            await requireRole(["admin", "editor", "viewer"])(req, reply);
            if (reply.sent) return;

            const order = r.orderBy ? `order by ${r.orderBy}` : "order by updated_at desc";
            const rows = await q(`select * from ${r.table} ${order}`);
            return { rows };
        });

        app.post(base, async (req, reply) => {
            await requireRole(["admin", "editor"])(req, reply);
            if (reply.sent) return;

            try {
                const payload = req.body || {};
                const keys = Object.keys(payload);
                if (keys.length === 0) return reply.status(400).send({ error: "Empty payload" });

                const cols = keys.map((k) => `"${k}"`).join(",");
                const vals = keys.map((_, i) => `$${i + 1}`).join(",");
                const params = keys.map((k) => payload[k]);

                const created = (await qAsUser(req.user, `insert into ${r.table} (${cols}) values (${vals}) returning *`, params))[0];

                await logActivity({
                    actor: req.user,
                    section: r.section,
                    entityType: r.entityType,
                    entityId: created.id || null,
                    action: "create",
                    summary: `Creato ${r.entityType}`,
                    after: created,
                });

                return { row: created };
            } catch (e) {
                return reply.status(400).send({ error: e.message || "Bad request" });
            }
        });

        app.patch(`${base}/:id`, async (req, reply) => {
            await requireRole(["admin", "editor"])(req, reply);
            if (reply.sent) return;

            try {
                const { id } = idParam.parse(req.params);
                const patch = req.body || {};

                const before = (await q(`select * from ${r.table} where id=$1`, [id]))[0];
                if (!before) return reply.status(404).send({ error: "Not found" });

                const keys = Object.keys(patch);
                if (keys.length === 0) return reply.status(400).send({ error: "Empty patch" });

                const sets = keys.map((k, i) => `"${k}"=$${i + 2}`).join(",");
                const params = [id, ...keys.map((k) => patch[k])];

                const after = (await qAsUser(req.user, `update ${r.table} set ${sets}, updated_at=now() where id=$1 returning *`, params))[0];

                await logActivity({
                    actor: req.user,
                    section: r.section,
                    entityType: r.entityType,
                    entityId: id,
                    action: "update",
                    summary: `Aggiornato ${r.entityType}`,
                    before,
                    after,
                });

                return { row: after };
            } catch (e) {
                return reply.status(400).send({ error: e.message || "Bad request" });
            }
        });

        app.delete(`${base}/:id`, async (req, reply) => {
            await requireRole(["admin"])(req, reply);
            if (reply.sent) return;

            try {
                const { id } = idParam.parse(req.params);

                const before = (await q(`select * from ${r.table} where id=$1`, [id]))[0];
                if (!before) return reply.status(404).send({ error: "Not found" });

                await qAsUser(req.user, `delete from ${r.table} where id=$1`, [id]);

                await logActivity({
                    actor: req.user,
                    section: r.section,
                    entityType: r.entityType,
                    entityId: id,
                    action: "delete",
                    summary: `Eliminato ${r.entityType}`,
                    before,
                });

                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e.message || "Bad request" });
            }
        });
    }
}
