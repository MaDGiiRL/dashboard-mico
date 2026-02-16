// server/src/routes/dashboard.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function dashboardRoutes(app) {
    app.get(
        "/days/:day/dashboard",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const params = z
                    .object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
                    .parse(req.params);

                const day = params.day;

                // =========================
                // RACES (DB)
                // =========================
                const races = await q(
                    `
          select
            r.id,
            r.day,
            r.name,
            r.sport,
            r.venue,
            r.description,
            r.starts_at,
            r.ends_at,
            r.notes,
            r.is_active,
            r.created_at,
            r.updated_at
          from races r
          where r.day = $1::date
            and r.is_active = true
          order by r.starts_at asc
          `,
                    [day]
                );

                // =========================
                // APPOINTMENTS (DB)
                // =========================
                const appointments = await q(
                    `
          select
            a.id,
            a.day,
            a.title,
            a.location,
            a.description,
            a.starts_at,
            a.ends_at,
            a.notes,
            a.source,
            a.external_id,
            a.is_ops_fixed,
            a.is_active,
            a.created_at,
            a.updated_at
          from appointments a
          where a.day = $1::date
            and a.is_active = true
          order by a.starts_at asc
          `,
                    [day]
                );

                // =========================
                // NOTE ENTRIES (robusto)
                // - prova schema "nuovo": created_by_user_id / created_by_name / created_by_email
                // - fallback schema "vecchio": senza colonne extra
                // =========================
                let noteEntries = [];
                try {
                    noteEntries = await q(
                        `
            select
              ne.id,
              ne.day,
              ne.source,
              ne.external_id,
              ne.body,
              ne.created_at,
              ne.updated_at,
              ne.created_by_user_id,
              ne.created_by_name,
              ne.created_by_email
            from note_entries ne
            where ne.day = $1::date
            order by ne.created_at asc
            `,
                        [day]
                    );
                } catch (e) {
                    // fallback: tabella senza colonne author
                    noteEntries = await q(
                        `
            select
              ne.id,
              ne.day,
              ne.source,
              ne.external_id,
              ne.body,
              ne.created_at,
              ne.updated_at
            from note_entries ne
            where ne.day = $1::date
            order by ne.created_at asc
            `,
                        [day]
                    );
                }

                // =========================
                // COC STATUS
                // =========================
                const cocStatus = await q(
                    `
          select
            cs.day,
            cm.name as commune_name,
            cs.is_open,
            cs.open_mode,
            cs.open_from,
            cs.open_to,
            cs.room_phone,
            cs.notes,
            cs.opened_at,
            cs.closed_at,
            cs.updated_at
          from coc_status cs
          join coc_communes cm on cm.id = cs.commune_id
          where cs.day = $1
          order by cm.name asc
          `,
                    [day]
                );

                // =========================
                // COC ORDINANCES
                // =========================
                const cocOrdinances = await q(
                    `
          select
            co.day,
            cm.name as commune_name,
            co.ordinance,
            co.updated_at
          from coc_ordinances co
          join coc_communes cm on cm.id = co.commune_id
          where co.day = $1
          order by cm.name asc
          `,
                    [day]
                );

                // =========================
                // COC CONTACTS
                // =========================
                const cocContacts = await q(
                    `
          select
            ccc.id,
            cm.name as commune_name,
            ccc.contact_name,
            ccc.phone,
            ccc.created_at
          from coc_commune_contacts ccc
          join coc_communes cm on cm.id = ccc.commune_id
          order by cm.name asc, ccc.created_at asc
          `
                );

                // =========================
                // ANA ITEMS (giorno + global)
                // =========================
                const anaItems = await q(
                    `
          select
            ai.id,
            ai.day,
            ai.place,
            ai.section_id,
            ai.section_title,
            ai.item_text,
            ai.created_at
          from ana_items ai
          where (ai.day = $1::date or ai.day is null)
          order by ai.created_at desc
          `,
                    [day]
                );

                return {
                    races,
                    appointments,
                    noteEntries,
                    cocStatus,
                    cocOrdinances,
                    cocContacts,
                    anaItems,
                };
            } catch (e) {
                req.log.error({ err: e }, "❌ dashboard error");
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
