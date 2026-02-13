// server/src/routes/coc_ordinances.js
import { z } from "zod";
import { q } from "../db.js";
import { requireRole } from "../auth/middleware.js";

export async function cocOrdinancesRoutes(app) {
    // toggle flag (solo sì/no)
    app.post(
        "/coc-ordinances/flag",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const body = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        commune_name: z.string().min(2),
                        ordinance: z.boolean(), // ✅ usa ordinance
                    })
                    .parse(req.body);

                const name = body.commune_name.trim();

                // trova/crea comune
                let c = await q(
                    `select id, name from coc_communes where lower(name)=lower($1) limit 1`,
                    [name]
                );
                if (!c?.[0]) {
                    const ins = await q(
                        `insert into coc_communes(name) values($1) returning id, name`,
                        [name]
                    );
                    c = ins;
                }

                const up = await q(
                    `
          insert into coc_ordinances(day, commune_id, ordinance)
          values($1,$2,$3)
          on conflict(day, commune_id) do update
          set ordinance=excluded.ordinance,
              updated_at=now()
          returning day, commune_id, ordinance, file_name, file_size, updated_at
          `,
                    [body.day, c[0].id, body.ordinance]
                );

                return { ok: true, row: { ...up[0], commune_name: c[0].name } };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // upload pdf (multipart field: file)
    app.post(
        "/coc-ordinances/upload",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const meta = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        commune_name: z.string().min(2),
                    })
                    .parse(req.query);

                const mp = await req.file(); // field: file
                if (!mp) return reply.status(400).send({ error: "File mancante" });

                const mime = mp.mimetype || "";
                if (!mime.includes("pdf")) return reply.status(400).send({ error: "Carica un PDF" });

                const buf = await mp.toBuffer();
                const name = String(meta.commune_name).trim();

                // trova/crea comune
                let c = await q(
                    `select id, name from coc_communes where lower(name)=lower($1) limit 1`,
                    [name]
                );
                if (!c?.[0]) {
                    const ins = await q(
                        `insert into coc_communes(name) values($1) returning id, name`,
                        [name]
                    );
                    c = ins;
                }

                const up = await q(
                    `
          insert into coc_ordinances(
            day, commune_id,
            ordinance,
            file_name, file_mime, file_size, file_bytes
          )
          values ($1,$2,true,$3,$4,$5,$6)
          on conflict(day, commune_id) do update
          set ordinance=true,
              file_name=excluded.file_name,
              file_mime=excluded.file_mime,
              file_size=excluded.file_size,
              file_bytes=excluded.file_bytes,
              updated_at=now()
          returning day, commune_id, ordinance, file_name, file_size, updated_at
          `,
                    [
                        meta.day,
                        c[0].id,
                        mp.filename || "ordinanza.pdf",
                        mp.mimetype || "application/pdf",
                        buf.length,
                        buf,
                    ]
                );

                return { ok: true, row: { ...up[0], commune_name: c[0].name } };
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );

    // download pdf
    app.get(
        "/coc-ordinances/download",
        { preHandler: requireRole(["admin", "editor", "viewer"]) },
        async (req, reply) => {
            try {
                const query = z
                    .object({
                        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
                        commune_name: z.string().min(2),
                    })
                    .parse(req.query);

                const name = query.commune_name.trim();

                const c = await q(
                    `select id, name from coc_communes where lower(name)=lower($1) limit 1`,
                    [name]
                );
                if (!c?.[0]) return reply.status(404).send({ error: "Comune non trovato" });

                const rows = await q(
                    `
          select file_name, file_mime, file_bytes
          from coc_ordinances
          where day=$1 and commune_id=$2 and file_bytes is not null
          limit 1
          `,
                    [query.day, c[0].id]
                );

                if (!rows?.[0]) return reply.status(404).send({ error: "PDF non presente" });

                const r = rows[0];
                reply.header("Content-Type", r.file_mime || "application/pdf");
                reply.header("Content-Disposition", `attachment; filename="${r.file_name || "ordinanza.pdf"}"`);
                return reply.send(r.file_bytes);
            } catch (e) {
                return reply.status(400).send({ error: e?.message || "Bad request" });
            }
        }
    );
}
