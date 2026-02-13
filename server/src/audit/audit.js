import { q } from "../db.js";

export async function logActivity({
    actor,
    section,
    entityType,
    entityId,
    action,
    summary,
    before = null,
    after = null,
    meta = null,
}) {
    try {
        await q(
            `insert into activity_logs
       (actor_id, actor_email, actor_role, section, entity_type, entity_id, action, summary, before, after, meta)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
            [
                actor?.id ?? null,
                actor?.email ?? null,
                actor?.role ?? null,
                section ?? null,
                entityType ?? null,
                entityId != null ? String(entityId) : null,
                action ?? null,
                summary ?? null,
                before ? JSON.stringify(before) : null,
                after ? JSON.stringify(after) : null,
                meta ? JSON.stringify(meta) : null,
            ]
        );
    } catch (e) {
        console.error("❌ logActivity failed:", e?.message || e);
    }
}
