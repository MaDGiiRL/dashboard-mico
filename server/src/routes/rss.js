// server/routes/rss.js
import { z } from "zod";

export async function rssRoutes(app) {
    app.get("/rss", async (req, reply) => {
        const query = z.object({ url: z.string().url() }).parse(req.query);
        const u = new URL(query.url);

        const allowed = ["www.adnkronos.com", "adnkronos.com"];
        if (!allowed.includes(u.hostname)) {
            return reply.status(403).send({ error: "Host not allowed" });
        }

        try {
            const upstream = await fetch(query.url, {
                // spesso serve UA "vero" per evitare blocchi/406
                headers: {
                    Accept: "application/rss+xml, application/xml, text/xml, */*",
                    "User-Agent":
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
                    "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
                redirect: "follow",
            });

            if (!upstream.ok) {
                const snippet = await upstream.text().catch(() => "");
                req.log?.warn?.(
                    { status: upstream.status, ct: upstream.headers.get("content-type") },
                    "RSS upstream not ok"
                );

                // ritorna lo status reale (così capisci subito se è 403/429/...)
                return reply.status(upstream.status).send({
                    error: `Upstream HTTP ${upstream.status}`,
                    contentType: upstream.headers.get("content-type") || null,
                    // non mandare HTML enorme: solo un pezzetto
                    snippet: snippet.slice(0, 400),
                });
            }

            const body = await upstream.text();
            return reply
                .header("Content-Type", "application/xml; charset=utf-8")
                .header("Cache-Control", "public, max-age=30")
                .send(body);
        } catch (e) {
            req.log?.error?.({ err: e }, "RSS fetch failed");
            return reply.status(502).send({ error: `Fetch failed: ${e?.message || String(e)}` });
        }
    });
}
