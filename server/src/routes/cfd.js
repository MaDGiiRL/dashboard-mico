// server/routes/cfd.js
import { z } from "zod";

function stripTags(s) {
    return String(s || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function uniqByUrl(items) {
    const seen = new Set();
    const out = [];
    for (const it of items) {
        const key = it.url;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(it);
    }
    return out;
}

export async function cfdRoutes(app) {
    app.get("/cfd/bulletins", async (req, reply) => {
        const query = z
            .object({
                url: z.string().url().optional(),
                limit: z.coerce.number().min(1).max(80).optional(),
            })
            .parse(req.query);

        const pageUrl = query.url || "https://www.regione.veneto.it/web/protezione-civile/cfd";
        const limit = query.limit ?? 30;

        const u = new URL(pageUrl);

        // allowlist
        const allowed = ["www.regione.veneto.it", "regione.veneto.it"];
        if (!allowed.includes(u.hostname)) {
            return reply.status(403).send({ error: "Host not allowed" });
        }

        let html = "";
        try {
            const upstream = await fetch(pageUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
            });

            if (!upstream.ok) {
                return reply.status(502).send({ error: `Upstream HTTP ${upstream.status}` });
            }

            html = await upstream.text();
        } catch (e) {
            return reply.status(502).send({ error: e?.message || "Upstream fetch failed" });
        }

        // Prendi <a href="...pdf...">...</a> e anche doc tipici
        const anchors = [];
        const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

        let m;
        while ((m = re.exec(html))) {
            const hrefRaw = m[1] || "";
            const inner = m[2] || "";
            const href = hrefRaw.trim();

            // filtra pdf / documenti comuni (pdf, doc, docx)
            if (!/\.(pdf|doc|docx)(\?|#|$)/i.test(href)) continue;

            let abs;
            try {
                abs = new URL(href, pageUrl).toString();
            } catch {
                continue;
            }

            const title = stripTags(inner) || stripTags(href) || "Documento";
            anchors.push({ title, url: abs });
        }

        // fallback: se i link non sono in <a> (raro), prova regex grezza su .pdf
        let out = uniqByUrl(anchors);

        if (!out.length) {
            const rePdf = /(https?:\/\/[^\s"'<>]+?\.(pdf|doc|docx)(\?[^\s"'<>]*)?)/gi;
            const found = [];
            let mm;
            while ((mm = rePdf.exec(html))) {
                found.push({ title: "Documento CFD", url: mm[1] });
            }
            out = uniqByUrl(found);
        }

        // ordina “best effort”: metti prima roba con “Bollettino” o “Avviso”
        out.sort((a, b) => {
            const aw = /bollettino|avviso|cfd|meteo|idro/i.test(a.title) ? 0 : 1;
            const bw = /bollettino|avviso|cfd|meteo|idro/i.test(b.title) ? 0 : 1;
            if (aw !== bw) return aw - bw;
            return a.title.localeCompare(b.title);
        });

        out = out.slice(0, limit);

        return reply
            .header("Cache-Control", "public, max-age=300")
            .send({ source: pageUrl, items: out });
    });
}
