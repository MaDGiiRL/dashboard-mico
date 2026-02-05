import { q } from "../db.js";

export async function logActivity({
    actor,
    section,
    entityType,
    entityId = null,
    action,
    summary = null,
    before = null,
    after = null,
}) {
    await q(
        `insert into activity_logs
     (actor_user_id, actor_name, actor_role, section, entity_type, entity_id, action, summary, before, after)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
            actor?.sub ?? null,
            actor?.name ?? null,
            actor?.role ?? null,
            section,
            entityType,
            entityId,
            action,
            summary,
            before,
            after,
        ]
    );
}
