import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

const RowSchema = z.object({
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekday_it: z.string().nullable().optional().default(null),
    month_label: z.string().nullable().optional().default(null),

    logistics_officer: z.string().nullable().optional().default(null),
    turns_ssv: z.string().nullable().optional().default(null),
    sor_marghera: z.string().nullable().optional().default(null),

    borca_morning: z.string().nullable().optional().default(null),
    borca_evening: z.string().nullable().optional().default(null),
    substitute_reinforcement: z.string().nullable().optional().default(null),

    referent: z.string().nullable().optional().default(null),
    borca_vehicle: z.string().nullable().optional().default(null),
    reperibili: z.string().nullable().optional().default(null),

    room_sor_marghera: z.string().nullable().optional().default(null),
    room_borca: z.string().nullable().optional().default(null),
    room_extra: z.string().nullable().optional().default(null),

    race_time: z.string().nullable().optional().default(null),
    safety_room_hours: z.string().nullable().optional().default(null),
    notes: z.string().nullable().optional().default(null),
});

export async function cocLogisticsRoutes(app) {
    app.get(
        "/coc-logistics",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const query = z
                    .object({
                        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
                        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
                    })
                    .parse(req.query);

                let rows;
                if (query.from && query.to) {
                    rows = await q(
                        `
            select *
            from coc_logistics_daily
            where day between $1 and $2
            order by day asc
            `,
                        [query.from, query.to]
                    );
                } else {
                    rows = await q(
                        `
            select *
            from coc_logistics_daily
            order by day asc
            `
                    );
                }

                return { rows };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    app.post(
        "/coc-logistics/upsert",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const body = RowSchema.parse(req.body);

                const rows = await q(
                    `
          insert into coc_logistics_daily(
            day, weekday_it, month_label,
            logistics_officer, turns_ssv, sor_marghera,
            borca_morning, borca_evening, substitute_reinforcement,
            referent, borca_vehicle, reperibili,
            room_sor_marghera, room_borca, room_extra,
            race_time, safety_room_hours, notes
          )
          values(
            $1,$2,$3,
            $4,$5,$6,
            $7,$8,$9,
            $10,$11,$12,
            $13,$14,$15,
            $16,$17,$18
          )
          on conflict(day) do update
          set
            weekday_it = excluded.weekday_it,
            month_label = excluded.month_label,
            logistics_officer = excluded.logistics_officer,
            turns_ssv = excluded.turns_ssv,
            sor_marghera = excluded.sor_marghera,
            borca_morning = excluded.borca_morning,
            borca_evening = excluded.borca_evening,
            substitute_reinforcement = excluded.substitute_reinforcement,
            referent = excluded.referent,
            borca_vehicle = excluded.borca_vehicle,
            reperibili = excluded.reperibili,
            room_sor_marghera = excluded.room_sor_marghera,
            room_borca = excluded.room_borca,
            room_extra = excluded.room_extra,
            race_time = excluded.race_time,
            safety_room_hours = excluded.safety_room_hours,
            notes = excluded.notes,
            updated_at = now()
          returning *
          `,
                    [
                        body.day,
                        body.weekday_it,
                        body.month_label,
                        body.logistics_officer,
                        body.turns_ssv,
                        body.sor_marghera,
                        body.borca_morning,
                        body.borca_evening,
                        body.substitute_reinforcement,
                        body.referent,
                        body.borca_vehicle,
                        body.reperibili,
                        body.room_sor_marghera,
                        body.room_borca,
                        body.room_extra,
                        body.race_time,
                        body.safety_room_hours,
                        body.notes,
                    ]
                );

                return { ok: true, row: rows[0] };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    app.delete(
        "/coc-logistics/:id",
        { preHandler: requireRole(["admin", "editor"]) },
        async (req, reply) => {
            try {
                const params = z.object({ id: z.coerce.number().int().positive() }).parse(req.params);
                const rows = await q(`delete from coc_logistics_daily where id=$1 returning id`, [params.id]);
                if (!rows?.[0]) return reply.status(404).send({ error: "Not found" });
                return { ok: true };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}