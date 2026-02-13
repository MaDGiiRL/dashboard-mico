// server/src/routes/dashboard.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function dashboardRoutes(app) {
    // GET /days/:day/dashboard
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
                // COC ORDINANCES  ✅ FIX: usa colonne reali
                // tabella: id, day, commune_id, ordinance, updated_at
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

                // (se vuoi anche anaNotes nel dashboard, aggiungiamo pure,
                // ma nel tuo AnaInventory già le carichi via api.listAnaNotes)

                return {
                    cocStatus,
                    cocOrdinances,
                    cocContacts,
                    anaItems, // ✅
                };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
