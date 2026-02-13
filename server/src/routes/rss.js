// server/src/routes/rss.js
import { z } from "zod";

export async function rssRoutes(app) {
  app.get("/rss", async (req, reply) => {
    // validate query
    let query;
    try {
      query = z.object({ url: z.string().url() }).parse(req.query);
    } catch (e) {
      return reply.code(400).send({ error: "Missing/invalid url" });
    }

    const u = new URL(query.url);

    // allowlist per sicurezza
    const allowedHosts = new Set(["www.adnkronos.com", "adnkronos.com"]);
    if (!allowedHosts.has(u.hostname)) {
      return reply.code(403).send({ error: "Host not allowed" });
    }

    try {
      const upstream = await fetch(query.url, {
        method: "GET",
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
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
        return reply.code(upstream.status).send({
          error: `Upstream HTTP ${upstream.status}`,
          contentType: upstream.headers.get("content-type") || null,
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
      return reply.code(502).send({ error: `Fetch failed: ${e?.message || String(e)}` });
    }
  });
}
