// server/routes/appointment_notes.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function appointmentNotesRoutes(app) {
  // upsert
  app.post("/appointment-notes", async (req, reply) => {
    try {
      requireRole(["admin", "editor"])(req);

      const body = z
        .object({
          day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          source: z.string().min(1),
          external_id: z.string().min(1),
          notes: z.string().optional().default(""),
        })
        .parse(req.body);

      const rows = await q(
        `
        insert into appointment_notes(day, source, external_id, notes)
        values ($1, $2, $3, $4)
        on conflict (day, source, external_id)
        do update set notes = excluded.notes, updated_at = now()
        returning day, source, external_id, notes, updated_at
      `,
        [body.day, body.source, body.external_id, body.notes]
      );

      return rows[0] || null;
    } catch (e) {
      return reply.status(400).send({ error: e.message || "Bad request" });
    }
  });

  // get notes per giorno
  app.get("/appointment-notes/:day", async (req, reply) => {
    try {
      requireRole(["admin", "editor", "viewer"])(req);

      const params = z
        .object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
        .parse(req.params);

      const day = params.day;

      const rows = await q(
        `
        select day, source, external_id, notes, updated_at
        from appointment_notes
        where day = $1
      `,
        [day]
      );

      return { day, rows };
    } catch (e) {
      return reply.status(400).send({ error: e.message || "Bad request" });
    }
  });
}
