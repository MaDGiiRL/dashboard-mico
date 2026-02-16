// server/src/audit/audit.js
import { q } from "../db.js";

function asIntOrNull(v) {
    if (v === null || v === undefined) return null;
    // se ti arriva "123" ok, se ti arriva uuid -> NaN -> null
    const n = Number(v);
    return Number.isInteger(n) ? n : null;
}

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
        const actorIdInt = asIntOrNull(actor?.id);

        const metaObj = meta && typeof meta === "object" ? { ...meta } : {};
        // tieniti l'id uuid per debug/audit
        if (actor?.id) metaObj.actor_uuid = String(actor.id);

        await q(
            `insert into activity_logs
        (actor_id, actor_email, actor_role, section, entity_type, entity_id, action, summary, before, after, meta)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb)`,
            [
                actorIdInt, // ✅ solo int oppure null
                actor?.email ?? null,
                actor?.role ?? null,
                section ?? null,
                entityType ?? null,
                entityId != null ? String(entityId) : null,
                action ?? null,
                summary ?? null,
                before ? JSON.stringify(before) : null,
                after ? JSON.stringify(after) : null,
                Object.keys(metaObj).length ? JSON.stringify(metaObj) : null,
            ]
        );
    } catch (e) {
        console.error("❌ logActivity failed:", e?.message || e);
    }
}
