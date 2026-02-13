// src/components/RssSportFeed.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ExternalLink, Newspaper, AlertTriangle, Clock, Flame, Dot } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

/* ------------------ RSS parsing helpers ------------------ */

function decodeHtml(input) {
    const doc = new DOMParser().parseFromString(input || "", "text/html");
    return doc.documentElement.textContent ?? (input || "");
}
function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    return (doc.body.textContent || "").trim();
}
function parseRssXml(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");
    const parserError = xml.querySelector("parsererror");
    if (parserError) throw new Error("XML non valido o feed non RSS.");

    const channelTitle = xml.querySelector("channel > title")?.textContent?.trim() || "";
    const itemNodes = Array.from(xml.querySelectorAll("item"));

    const items = itemNodes
        .map((node) => {
            const title = decodeHtml(node.querySelector("title")?.textContent?.trim() || "");
            const link = node.querySelector("link")?.textContent?.trim() || "";
            const guid = node.querySelector("guid")?.textContent?.trim() || link;

            const pubDateRaw = node.querySelector("pubDate")?.textContent?.trim();
            let pubDate = null;
            if (pubDateRaw) {
                const d = new Date(pubDateRaw);
                if (!Number.isNaN(d.getTime())) pubDate = d;
            }

            const descriptionRaw =
                node.querySelector("description")?.textContent?.trim() ||
                node.querySelector("content\\:encoded")?.textContent?.trim() ||
                "";

            const description = descriptionRaw ? stripHtml(decodeHtml(descriptionRaw)) : "";
            return { title, link, guid, pubDate, description };
        })
        .filter((x) => x.title && x.link);

    items.sort((a, b) => (b.pubDate?.getTime?.() || 0) - (a.pubDate?.getTime?.() || 0));
    return { title: decodeHtml(channelTitle), items };
}

/* ------------------ UI helpers ------------------ */

function formatTime(d) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(d);
}
function formatDayLabel(d) {
    if (!d) return "Prima";
    const dt = new Date(d);
    const today = new Date();
    const y1 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const y2 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
    const diffDays = Math.round((y1 - y2) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Oggi";
    if (diffDays === 1) return "Ieri";
    return "Prima";
}
function minutesAgo(d) {
    if (!d) return null;
    const ms = Date.now() - d.getTime();
    if (Number.isNaN(ms)) return null;
    return Math.max(0, Math.floor(ms / 60000));
}

/* ------------------ keyword filter ------------------ */

function normalize(s) {
    return (s || "").toLowerCase();
}
function itemMatchesKeywords(item, keywords) {
    if (!keywords || keywords.length === 0) return true;
    const hay = normalize(`${item?.title || ""} ${item?.description || ""}`);
    return keywords.some((k) => hay.includes(normalize(k)));
}

/* ------------------ atoms ------------------ */

function Pill({ tone = "neutral", children }) {
    const tones = {
        neutral: "bg-black/5 text-neutral-700",
        hot: "bg-rose-500/12 text-rose-900",
        fresh: "bg-sky-500/12 text-sky-900",
    };
    return (
        <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone] || tones.neutral)}>
            {children}
        </span>
    );
}

function SkeletonNewsroom() {
    return (
        <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-white/65 p-3 shadow-sm">
                    <div className="h-4 w-5/6 rounded bg-neutral-200/80" />
                    <div className="mt-2 h-3 w-2/5 rounded bg-neutral-200/70" />
                </div>
            ))}
        </div>
    );
}

/* ------------------ component ------------------ */

export default function RssSportFeed({
    feedUrl = "https://www.adnkronos.com/RSS_Sport.xml",
    proxyBase = API ? `${API}/rss` : null,
    refreshIntervalMs = 120_000,
    limit = 14,
    height = 640,
    showDescription = false,
    openInNewTab = true,
    variant = "sidebar",
    accent = "blue",
    keywords = ["Milano", "Cortina"],
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [channelTitle, setChannelTitle] = useState("");
    const [items, setItems] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);

    const abortRef = useRef(null);
    const seqRef = useRef(0);
    const kwKey = useMemo(() => JSON.stringify(keywords || []), [keywords]);

    const fetchUrl = useMemo(() => {
        if (!proxyBase) return feedUrl;
        const sep = proxyBase.includes("?") ? "&" : "?";
        return `${proxyBase}${sep}url=${encodeURIComponent(feedUrl)}`;
    }, [feedUrl, proxyBase]);

    async function load() {
        const seq = ++seqRef.current;

        setError(null);
        setLoading(true);

        // abort precedente
        abortRef.current?.abort?.();

        const ac = new AbortController();
        abortRef.current = ac;

        try {
            const res = await fetch(fetchUrl, {
                signal: ac.signal,
                cache: "no-store",
                headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            if (ac.signal.aborted) return;

            const text = await res.text();

            if (ac.signal.aborted) return;

            const parsed = parseRssXml(text);

            const filtered = (parsed.items || []).filter((it) => itemMatchesKeywords(it, keywords));
            if (seq !== seqRef.current) return;

            setChannelTitle(parsed.title || "ADNKRONOS Sport");
            setItems(filtered.slice(0, limit));
            setLastUpdated(new Date());
        } catch (e) {
            if (e?.name === "AbortError") return;
            if (seq !== seqRef.current) return;

            setError(
                e?.message ||
                "Impossibile caricare il feed. Se vedi CORS, assicurati di avere la route backend GET /rss."
            );
        } finally {
            if (seq === seqRef.current && !ac.signal.aborted) setLoading(false);
        }
    }

    // ✅ wrapper: MAI unhandled promise / AbortError in console
    async function loadSafe() {
        try {
            await load();
        } catch (e) {
            if (e?.name === "AbortError") return;
            // non deve mai esplodere in console come "Uncaught (in promise)"
            // eslint-disable-next-line no-console
            console.warn("RSS load error:", e);
        }
    }

    useEffect(() => {
        void loadSafe();
        return () => {
            // invalida le risposte tardive e abortisce il fetch in corso
            seqRef.current++;
            abortRef.current?.abort?.();
            abortRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchUrl, limit, kwKey]);

    useEffect(() => {
        if (!refreshIntervalMs || refreshIntervalMs < 10_000) return;
        const id = window.setInterval(() => void loadSafe(), refreshIntervalMs);
        return () => window.clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchUrl, refreshIntervalMs, limit, kwKey]);

    const A = useMemo(() => {
        const map = {
            blue: {
                stripe: "bg-gradient-to-b from-indigo-500 to-fuchsia-500",
                glow: "group-hover:shadow-[0_18px_55px_rgba(99,102,241,0.18)]",
                focus: "focus-visible:ring-indigo-500/20",
            },
            red: {
                stripe: "bg-gradient-to-b from-rose-500 to-amber-500",
                glow: "group-hover:shadow-[0_18px_55px_rgba(244,63,94,0.18)]",
                focus: "focus-visible:ring-rose-500/20",
            },
            green: {
                stripe: "bg-gradient-to-b from-emerald-500 to-sky-500",
                glow: "group-hover:shadow-[0_18px_55px_rgba(16,185,129,0.18)]",
                focus: "focus-visible:ring-emerald-500/20",
            },
        };
        return map[accent] || map.blue;
    }, [accent]);

    const grouped = useMemo(() => {
        const buckets = { Oggi: [], Ieri: [], Prima: [] };
        for (const it of items) {
            const k = formatDayLabel(it.pubDate);
            (buckets[k] ||= []).push(it);
        }
        return buckets;
    }, [items]);

    const outerStyle =
        height === "100%"
            ? { height: "100%" }
            : typeof height === "number"
                ? { height }
                : undefined;

    if (variant !== "sidebar") {
        return (
            <div className="rounded-3xl bg-white/70 shadow-sm">
                <div className="p-5 text-sm text-neutral-600">
                    Usa <code>variant="sidebar"</code>.
                </div>
            </div>
        );
    }

    return (
        <div
            className={cx(
                "h-full rounded-3xl overflow-hidden flex flex-col min-h-0",
                "bg-white/65 backdrop-blur-md",
                "shadow-[0_16px_44px_rgba(0,0,0,0.10)]"
            )}
            style={outerStyle}
        >
            {/* top accent */}
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

            {/* header */}
            <div className="sticky top-0 z-10 bg-white/55 backdrop-blur-md">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="text-[11px] text-neutral-600 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1">
                                <Clock size={12} />
                                {lastUpdated
                                    ? new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(lastUpdated)
                                    : "—"}
                            </span>
                            <span className="opacity-40">•</span>
                            <span>auto {Math.round(refreshIntervalMs / 1000)}s</span>
                        </div>
                        <div className="text-[12px] font-semibold text-neutral-900 truncate">
                            {channelTitle || "ADNKRONOS"}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadSafe()}
                        disabled={loading}
                        className={cx(
                            "rounded-2xl px-3 py-2 text-xs font-semibold transition flex items-center gap-2",
                            "bg-black/5 hover:bg-black/7 text-neutral-900 shadow-sm",
                            "focus-visible:outline-none focus-visible:ring-4",
                            A.focus,
                            loading ? "opacity-60" : ""
                        )}
                        title="Aggiorna"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Aggiorna</span>
                    </button>
                </div>
                <div className="h-px bg-black/5" />
            </div>

            {/* list */}
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="p-3">
                    {error ? (
                        <div className="rounded-2xl bg-rose-500/10 p-3">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={16} className="mt-0.5 text-rose-900" />
                                <div>
                                    <div className="text-sm font-semibold text-neutral-900">Errore feed</div>
                                    <div className="text-xs text-neutral-700 mt-1">{error}</div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {loading && items.length === 0 ? (
                        <SkeletonNewsroom />
                    ) : items.length === 0 ? (
                        <div className="text-sm text-neutral-700 p-3">
                            Nessun articolo che contenga <b>Milano</b> o <b>Cortina</b>.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {["Oggi", "Ieri", "Prima"].map((section) => {
                                const xs = grouped[section] || [];
                                if (!xs.length) return null;

                                return (
                                    <div key={section}>
                                        <div className="px-1 pb-2 flex items-center justify-between">
                                            <div className="text-[11px] font-extrabold uppercase tracking-wide text-neutral-600">
                                                {section}
                                            </div>
                                            <span className="text-[11px] text-neutral-500">{xs.length}</span>
                                        </div>

                                        <div className="space-y-2">
                                            {xs.map((it, idx) => {
                                                const mins = minutesAgo(it.pubDate);
                                                const hot = mins !== null && mins <= 180;
                                                const fresh = mins !== null && mins > 180 && mins <= 24 * 60;

                                                return (
                                                    <a
                                                        key={it.guid || `${it.link}-${idx}`}
                                                        href={it.link}
                                                        target={openInNewTab ? "_blank" : "_self"}
                                                        rel={openInNewTab ? "noreferrer" : undefined}
                                                        className="group block focus:outline-none"
                                                    >
                                                        <div
                                                            className={cx(
                                                                "relative rounded-2xl transition",
                                                                "bg-white/70 hover:bg-white/85",
                                                                "shadow-sm hover:shadow-md",
                                                                "focus-visible:ring-4",
                                                                A.focus,
                                                                A.glow
                                                            )}
                                                        >
                                                            {/* stripe */}
                                                            <div className={cx("absolute left-0 top-3 bottom-3 w-1 rounded-full", A.stripe)} />

                                                            <div className="pl-4 pr-3 py-3">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {hot ? (
                                                                            <Pill tone="hot">
                                                                                <Flame size={12} /> ora
                                                                            </Pill>
                                                                        ) : fresh ? (
                                                                            <Pill tone="fresh">oggi</Pill>
                                                                        ) : (
                                                                            <Pill tone="neutral">
                                                                                <Newspaper size={12} /> ADNKRONOS
                                                                            </Pill>
                                                                        )}

                                                                        <span className="text-[11px] text-neutral-600 inline-flex items-center gap-1">
                                                                            <Dot size={14} />
                                                                            {formatTime(it.pubDate)}
                                                                        </span>
                                                                    </div>

                                                                    <ExternalLink size={16} className="opacity-35 group-hover:opacity-90 text-neutral-700" />
                                                                </div>

                                                                <div className="mt-2 text-[13px] font-semibold leading-snug text-neutral-900 line-clamp-3">
                                                                    {it.title}
                                                                </div>

                                                                {showDescription && it.description ? (
                                                                    <div className="mt-2 text-[12px] leading-relaxed text-neutral-700 line-clamp-2">
                                                                        {it.description}
                                                                    </div>
                                                                ) : null}

                                                                <div className="mt-2 text-[11px] text-neutral-600 flex items-center gap-2">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Clock size={12} />
                                                                        {mins === null ? "—" : mins < 60 ? `${mins} min fa` : `${Math.floor(mins / 60)}h fa`}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
