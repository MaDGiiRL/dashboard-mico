// server/src/routes/pc.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function pcRoutes(app) {
  // GET /pc/month?kind=olympics&month=2026-02
  app.get(
    "/pc/month",
    { preHandler: requireRole(["admin", "editor", "viewer"]) },
    async (req, reply) => {
      try {
        const Q = z
          .object({
            kind: z.enum(["olympics", "paralympics"]),
            month: z.string().regex(/^\d{4}-\d{2}$/),
          })
          .parse(req.query);

        const start = `${Q.month}-01`;

        const rows = await q(
          `
          select
            id,
            kind,
            day,
            shift,
            slot,
            person_name,
            person_phone
          from pc_assignments
          where kind = $1
            and day >= $2::date
            and day < ($2::date + interval '1 month')
            and slot > 0
          order by day asc, shift asc, slot asc
          `,
          [Q.kind, start]
        );

        const ui = await q(
          `
          select kind, day, active_shift
          from pc_day_ui
          where kind = $1
            and day >= $2::date
            and day < ($2::date + interval '1 month')
          `,
          [Q.kind, start]
        );

        return { rows, ui };
      } catch (e) {
        return reply.status(400).send({ error: e?.message || "Bad request" });
      }
    }
  );

  // POST /pc/day-ui  { kind, day, active_shift }
  app.post(
    "/pc/day-ui",
    { preHandler: requireRole(["admin", "editor"]) },
    async (req, reply) => {
      try {
        const B = z
          .object({
            kind: z.enum(["olympics", "paralympics"]),
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            active_shift: z.enum(["20-8", "8-20"]),
          })
          .parse(req.body);

        const row = await q(
          `
          insert into pc_day_ui(kind, day, active_shift)
          values ($1, $2::date, $3)
          on conflict (kind, day)
          do update set active_shift = excluded.active_shift, updated_at = now()
          returning kind, day, active_shift
          `,
          [B.kind, B.day, B.active_shift]
        ).then((r) => r[0]);

        return { row };
      } catch (e) {
        return reply.status(400).send({ error: e?.message || "Bad request" });
      }
    }
  );

  // POST /pc/move
  // { kind, from:{day,shift,slot}, to:{day,shift,slot} }
  // swap se destinazione occupata
  app.post(
    "/pc/move",
    { preHandler: requireRole(["admin", "editor"]) },
    async (req, reply) => {
      const client = await app.pg.connect();
      try {
        const B = z
          .object({
            kind: z.enum(["olympics", "paralympics"]),
            from: z.object({
              day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
              shift: z.enum(["20-8", "8-20"]),
              slot: z.coerce.number().int().min(1).max(3),
            }),
            to: z.object({
              day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
              shift: z.enum(["20-8", "8-20"]),
              slot: z.coerce.number().int().min(1).max(3),
            }),
          })
          .parse(req.body);

        await client.query("begin");

        const fromRow = await client
          .query(
            `
            select id
            from pc_assignments
            where kind=$1 and day=$2::date and shift=$3 and slot=$4
            for update
            `,
            [B.kind, B.from.day, B.from.shift, B.from.slot]
          )
          .then((r) => r.rows[0]);

        if (!fromRow) {
          await client.query("rollback");
          return reply.status(400).send({ error: "Slot sorgente vuoto" });
        }

        const toRow = await client
          .query(
            `
            select id
            from pc_assignments
            where kind=$1 and day=$2::date and shift=$3 and slot=$4
            for update
            `,
            [B.kind, B.to.day, B.to.shift, B.to.slot]
          )
          .then((r) => r.rows[0]);

        // parcheggio temporaneo: slot = 0 (non collide perché UNIQUE è solo slot>0)
        if (toRow) {
          await client.query(
            `
            update pc_assignments
            set slot = 0, updated_at=now()
            where id = $1
            `,
            [toRow.id]
          );
        }

        // from -> to
        await client.query(
          `
          update pc_assignments
          set day=$1::date, shift=$2, slot=$3, updated_at=now()
          where id=$4
          `,
          [B.to.day, B.to.shift, B.to.slot, fromRow.id]
        );

        // to -> from (ripristino)
        if (toRow) {
          await client.query(
            `
            update pc_assignments
            set day=$1::date, shift=$2, slot=$3, updated_at=now()
            where id=$4
            `,
            [B.from.day, B.from.shift, B.from.slot, toRow.id]
          );
        }

        await client.query("commit");
        return { ok: true, swapped: Boolean(toRow) };
      } catch (e) {
        try {
          await client.query("rollback");
        } catch {}
        return reply.status(400).send({ error: e?.message || "Bad request" });
      } finally {
        try {
          client.release();
        } catch {}
      }
    }
  );

  // POST /pc/assign
  // { kind, day, shift, slot, person_name, person_phone }
  app.post(
    "/pc/assign",
    { preHandler: requireRole(["admin", "editor"]) },
    async (req, reply) => {
      try {
        const B = z
          .object({
            kind: z.enum(["olympics", "paralympics"]),
            day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            shift: z.enum(["20-8", "8-20"]),
            slot: z.coerce.number().int().min(1).max(3),
            person_name: z.string().min(1),
            person_phone: z.string().min(1),
          })
          .parse(req.body);

        // IMPORTANTISSIMO: conflict target con WHERE slot > 0 (matcha l'indice parziale)
        const row = await q(
          `
          insert into pc_assignments(kind, day, shift, slot, person_name, person_phone)
          values ($1, $2::date, $3, $4, $5, $6)
          on conflict (kind, day, shift, slot) where slot > 0
          do update set
            person_name = excluded.person_name,
            person_phone = excluded.person_phone,
            updated_at = now()
          returning id, kind, day, shift, slot, person_name, person_phone
          `,
          [B.kind, B.day, B.shift, B.slot, B.person_name, B.person_phone]
        ).then((r) => r[0]);

        return { row };
      } catch (e) {
        return reply.status(400).send({ error: e?.message || "Bad request" });
      }
    }
  );
}
