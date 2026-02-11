// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

import RssSportFeed from "../components/RssSportFeed.jsx";
import Modal from "../components/Modal.jsx";

import { b1RacesForDay } from "../data/b1_calendar_2026.js";
import { opsAppointmentsForDay } from "../data/ops_calendar_2026.js";

import { CalendarDays, MapPinned, AlertTriangle, Minus, Plus, LocateFixed } from "lucide-react";

/* helpers */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function timeRangeRace(r) {
    const s = new Date(r.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = r.ends_at ? new Date(r.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
    return e ? `${s}–${e}` : s;
}
function timeRange(isoStart, isoEnd) {
    const s = new Date(isoStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = isoEnd ? new Date(isoEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
    return e ? `${s}–${e}` : s;
}
function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function minutesSinceStartOfDay(d) {
    return d.getHours() * 60 + d.getMinutes();
}
function parseISOToDate(iso) {
    const x = new Date(iso);
    return Number.isNaN(x.getTime()) ? null : x;
}
function toMinutes(iso) {
    const d = parseISOToDate(iso);
    if (!d) return null;
    return d.getHours() * 60 + d.getMinutes();
}
function fmtHM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* premium tokens */
const UI = {
    card: cx("rounded-3xl overflow-hidden", "bg-white/55 backdrop-blur-md", "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"),
    accent: "h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500",
    dim: "text-neutral-600",
    dim2: "text-neutral-500",
    softRing: "ring-1 ring-white/45",
    input:
        "w-full rounded-2xl px-4 py-3 text-sm outline-none " +
        "bg-white/75 text-neutral-900 placeholder:text-neutral-400 " +
        "shadow-sm ring-1 ring-white/45 " +
        "focus:ring-4 focus:ring-indigo-500/15",
};

function Input({ className, ...props }) {
    return <input {...props} className={cx(UI.input, className)} />;
}

function Tag({ tone = "neutral", children }) {
    const tones = {
        neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
        indigo: "bg-indigo-500/10 text-indigo-900 ring-1 ring-indigo-500/15",
        emerald: "bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/15",
        rose: "bg-rose-500/10 text-rose-900 ring-1 ring-rose-500/15",
        sky: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
        fuchsia: "bg-fuchsia-500/10 text-fuchsia-900 ring-1 ring-fuchsia-500/15",
    };
    return (
        <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide", tones[tone] || tones.neutral)}>
            {children}
        </span>
    );
}

function MiniBtn({ onClick, title, children, disabled, iconOnly = false }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={cx(
                "rounded-2xl px-3 py-2 text-sm transition disabled:opacity-50 flex items-center gap-2",
                "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm",
                "ring-1 ring-white/45",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                iconOnly ? "px-2" : ""
            )}
        >
            {children}
        </button>
    );
}

function Kpi({ icon: Icon, title, value, tone = "indigo" }) {
    const tones = {
        indigo: { icon: "bg-indigo-500/12 text-indigo-700", bar: "from-indigo-500/10 via-white/65 to-white/55" },
        emerald: { icon: "bg-emerald-500/12 text-emerald-700", bar: "from-emerald-500/10 via-white/65 to-white/55" },
        rose: { icon: "bg-rose-500/12 text-rose-700", bar: "from-rose-500/10 via-white/65 to-white/55" },
    };
    const t = tones[tone] || tones.indigo;

    return (
        <div className={cx(UI.card, UI.softRing, "min-w-0")}>
            <div className={UI.accent} />
            <div className={cx("p-5 bg-gradient-to-b", t.bar)}>
                <div className="flex items-center justify-between gap-3">
                    <div className={cx("flex items-center gap-3 min-w-0", UI.dim2)}>
                        <span className={cx("h-11 w-11 rounded-2xl grid place-items-center shadow-sm ring-1 ring-white/55", t.icon)}>
                            {Icon ? <Icon size={18} /> : null}
                        </span>
                        <div className="min-w-0">
                            <div className="text-[12px] font-extrabold tracking-wide text-neutral-600">{title}</div>
                            <div className="mt-1 text-xs text-neutral-500">aggiornato</div>
                        </div>
                    </div>
                    <div className="text-4xl font-extrabold text-neutral-900 leading-none tabular-nums">{value}</div>
                </div>
            </div>
        </div>
    );
}

/* Timeline */
function TimelineDay({ dayISO, races = [], appts = [], zoom = 1, setZoom, onCardClick }) {
    const PX_PER_HOUR_BASE = 72;
    const TOP_PAD = 14;
    const HOURS = 24;

    const VIEW_START_HOUR = 11;
    const VISIBLE_HOURS = 6;

    const pxPerHour = PX_PER_HOUR_BASE * zoom;
    const height = TOP_PAD * 2 + HOURS * pxPerHour;
    const visibleHeight = TOP_PAD * 2 + VISIBLE_HOURS * pxPerHour;

    const scrollRef = useRef(null);

    const [nowMin, setNowMin] = useState(() => minutesSinceStartOfDay(new Date()));
    useEffect(() => {
        const t = setInterval(() => setNowMin(minutesSinceStartOfDay(new Date())), 30_000);
        return () => clearInterval(t);
    }, []);

    const showNow = dayISO === todayISO();
    const laneY = (min) => TOP_PAD + (min / 60) * pxPerHour;
    const nowY = showNow ? laneY(clamp(nowMin, 0, 24 * 60)) : null;

    function scrollToHour(hour, { smooth = true } = {}) {
        const el = scrollRef.current;
        if (!el) return;
        const targetMin = clamp(hour * 60, 0, 24 * 60);
        const targetY = Math.max(0, laneY(targetMin) - TOP_PAD);
        el.scrollTo({ top: targetY, behavior: smooth ? "smooth" : "auto" });
    }

    useEffect(() => {
        const raf = requestAnimationFrame(() => scrollToHour(VIEW_START_HOUR, { smooth: false }));
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dayISO, zoom]);

    function scrollToNow({ smooth = true } = {}) {
        const el = scrollRef.current;
        if (!el || !showNow) return;
        const target = Math.max(0, nowY - el.clientHeight * 0.45);
        el.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
    }

    const raceItems = useMemo(() => {
        return (races || [])
            .map((r) => {
                const s = toMinutes(r.starts_at);
                const e = toMinutes(r.ends_at) ?? (s !== null ? s + 45 : null);
                if (s === null) return null;
                return { raw: r, s, e: Math.max(s + 10, e) };
            })
            .filter(Boolean)
            .sort((a, b) => a.s - b.s);
    }, [races]);

    const apptItems = useMemo(() => {
        return (appts || [])
            .map((a) => {
                const s = toMinutes(a.starts_at);
                const e = toMinutes(a.ends_at) ?? (s !== null ? s + 45 : null);
                if (s === null) return null;
                return { raw: a, s, e: Math.max(s + 10, e) };
            })
            .filter(Boolean)
            .sort((a, b) => a.s - b.s);
    }, [appts]);

    function layoutColumns(items) {
        const colEnds = [];
        const placed = [];
        for (const it of items) {
            let col = -1;
            for (let i = 0; i < colEnds.length; i++) {
                if (it.s >= colEnds[i]) {
                    col = i;
                    break;
                }
            }
            if (col === -1) {
                col = colEnds.length;
                colEnds.push(0);
            }
            colEnds[col] = it.e;
            placed.push({ ...it, col });
        }
        const colCount = Math.max(1, colEnds.length);
        return { placed, colCount };
    }

    const raceLayout = useMemo(() => layoutColumns(raceItems), [raceItems]);
    const apptLayout = useMemo(() => layoutColumns(apptItems), [apptItems]);

    const raceLaid = raceLayout.placed;
    const apptLaid = apptLayout.placed;

    const raceCols = raceLayout.colCount;
    const apptCols = apptLayout.colCount;

    const Z_MIN = 0.6;
    const Z_MAX = 1.8;

    function metaFor(kind, item) {
        const src = String(item?.source || "").toUpperCase();
        const isRace = kind === "race";

        if (isRace) {
            if (src === "B1") {
                return {
                    chip: "B1",
                    dot: "bg-indigo-600",
                    top: "bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-600",
                    bg: "bg-gradient-to-br from-indigo-600/22 via-fuchsia-600/18 to-rose-600/20",
                    glow: "shadow-[0_16px_38px_rgba(79,70,229,0.18)]",
                    ring: "ring-1 ring-indigo-500/18",
                };
            }
            return {
                chip: "DB",
                dot: "bg-violet-600",
                top: "bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600",
                bg: "bg-gradient-to-br from-violet-600/22 via-indigo-600/16 to-fuchsia-600/18",
                glow: "shadow-[0_16px_38px_rgba(124,58,237,0.16)]",
                ring: "ring-1 ring-violet-500/18",
            };
        }

        if (src === "OPS") {
            return {
                chip: "OPS",
                dot: "bg-emerald-600",
                top: "bg-gradient-to-r from-emerald-600 via-sky-600 to-indigo-600",
                bg: "bg-gradient-to-br from-emerald-600/20 via-sky-600/16 to-indigo-600/16",
                glow: "shadow-[0_16px_38px_rgba(16,185,129,0.16)]",
                ring: "ring-1 ring-emerald-500/18",
            };
        }

        return {
            chip: "DB",
            dot: "bg-sky-600",
            top: "bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600",
            bg: "bg-gradient-to-br from-sky-600/20 via-indigo-600/16 to-violet-600/16",
            glow: "shadow-[0_16px_38px_rgba(2,132,199,0.15)]",
            ring: "ring-1 ring-sky-500/18",
        };
    }

    function TimelineCard({ kind, item }) {
        const isRace = kind === "race";
        const t = isRace ? timeRangeRace(item) : timeRange(item.starts_at, item.ends_at);
        const loc = (item.venue || item.location || "").trim();
        const title = item.name || item.title || "—";

        const m = metaFor(kind, item);

        return (
            <button
                type="button"
                onClick={() => onCardClick?.({ kind, item })}
                className={cx(
                    "group h-full w-full text-left rounded-3xl overflow-hidden transition",
                    // ✅ NO bianco: background uniforme
                    m.bg,
                    m.ring,
                    m.glow,
                    "hover:shadow-[0_20px_48px_rgba(0,0,0,0.18)]",
                    "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                )}
            >
                <div className={cx("h-1.5", m.top)} />

                <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={cx("h-2.5 w-2.5 rounded-full", m.dot)} />
                                <div className="text-[11px] font-extrabold text-neutral-900">{t}</div>
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide bg-white/35 ring-1 ring-white/35 text-neutral-900">
                                    {m.chip}
                                </span>
                            </div>

                            <div className="mt-1 text-[14px] font-extrabold text-neutral-900 leading-snug line-clamp-2">{title}</div>
                        </div>

                        <span
                            className={cx(
                                "max-w-[52%] truncate text-[11px] rounded-full px-2.5 py-1 font-semibold",
                                "bg-white/30 text-neutral-900 ring-1 ring-white/35"
                            )}
                            title={loc || (isRace ? "GARA" : "OPS")}
                        >
                            {loc || (isRace ? "GARA" : "OPS")}
                        </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <div className="text-[10px] uppercase tracking-wide font-extrabold text-neutral-800/80">
                            {isRace ? "Gara" : "Appuntamento"}
                        </div>
                        <div className="text-[11px] font-semibold text-neutral-800/70 group-hover:text-neutral-900/80">
                            Clicca per dettagli
                        </div>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <div className={cx(UI.card, UI.softRing)}>
            <div className={UI.accent} />

            {/* header programma */}
            <div className="px-5 py-4 bg-white/55">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="text-lg font-extrabold text-neutral-900">Programma</div>
                            {showNow ? <Tag tone="rose">ORA: {fmtHM(nowMin)}</Tag> : <Tag tone="sky">GIORNO</Tag>}
                        </div>
                        <div className={cx("text-xs mt-1", UI.dim2)}>{dayISO}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <MiniBtn
                            title="Zoom -"
                            disabled={zoom <= Z_MIN + 1e-6}
                            onClick={() => setZoom((z) => clamp(Number(z) - 0.15, Z_MIN, Z_MAX))}
                            iconOnly
                        >
                            <Minus size={16} />
                        </MiniBtn>

                        <div className="text-xs min-w-[72px] text-center font-extrabold text-neutral-700">{Math.round(zoom * 100)}%</div>

                        <MiniBtn
                            title="Zoom +"
                            disabled={zoom >= Z_MAX - 1e-6}
                            onClick={() => setZoom((z) => clamp(Number(z) + 0.15, Z_MIN, Z_MAX))}
                            iconOnly
                        >
                            <Plus size={16} />
                        </MiniBtn>

                        <MiniBtn title="Vai a 11:00" onClick={() => scrollToHour(VIEW_START_HOUR, { smooth: true })}>
                            <LocateFixed size={16} /> 11–15
                        </MiniBtn>

                        <MiniBtn title="Vai a ora" disabled={!showNow} onClick={() => scrollToNow({ smooth: true })}>
                            <LocateFixed size={16} /> Ora
                        </MiniBtn>
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="p-5 bg-white/40">
                <div
                    ref={scrollRef}
                    className={cx(
                        "relative rounded-3xl overflow-y-auto",
                        "bg-white/35",
                        "ring-1 ring-black/10",
                        "shadow-[inset_0_1px_0_rgba(255,255,255,0.70)]"
                    )}
                    style={{
                        height: visibleHeight,
                        backgroundImage:
                            "linear-gradient(to right, rgba(0,0,0,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.10) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                        backgroundPosition: "0 0",
                    }}
                >
                    {/* niente righe: solo label ore (opzionale) + cards */}
                    <div className="relative" style={{ height }}>
                        {/* SOLO label ore (no righe) */}
                        {Array.from({ length: HOURS + 1 }).map((_, i) => {
                            const y = TOP_PAD + i * pxPerHour;
                            return (
                                <div key={i} className="absolute left-0" style={{ top: y }}>
                                    <div className="w-14 text-[11px] text-right pr-2 font-extrabold text-neutral-700">
                                        {String(i).padStart(2, "0")}:00
                                    </div>
                                </div>
                            );
                        })}

                        {/* label centrale */}
                        <div className="absolute left-1/2 top-3 -translate-x-1/2 text-[11px] uppercase tracking-wide font-extrabold text-neutral-700">
                            Gare ↑ • Appuntamenti ↓
                        </div>

                        {/* cards */}
                        <div className="absolute left-0 right-0 top-0 bottom-0">
                            {raceLaid.map((it, idx) => {
                                const y = TOP_PAD + (it.s / 60) * pxPerHour;
                                const h = Math.max(104, ((it.e - it.s) / 60) * pxPerHour);

                                const leftBase = 72;
                                const laneW = "calc(50% - 86px)";
                                const colW = `calc((${laneW}) / ${raceCols})`;
                                const x = `calc(${leftBase}px + (${it.col} * ${colW}))`;

                                const r = it.raw;
                                return (
                                    <div
                                        key={`race-${r.external_id ?? r.id ?? idx}-${idx}`}
                                        className="absolute"
                                        style={{ top: y, left: x, width: colW, height: h }}
                                    >
                                        <TimelineCard kind="race" item={r} />
                                    </div>
                                );
                            })}

                            {apptLaid.map((it, idx) => {
                                const y = TOP_PAD + (it.s / 60) * pxPerHour;
                                const h = Math.max(104, ((it.e - it.s) / 60) * pxPerHour);

                                const laneStart = "calc(50% + 14px)";
                                const laneW = "calc(50% - 86px)";
                                const colW = `calc((${laneW}) / ${apptCols})`;
                                const x = `calc(${laneStart} + (${it.col} * ${colW}))`;

                                const a = it.raw;
                                return (
                                    <div
                                        key={`appt-${a.external_id ?? a.id ?? idx}-${idx}`}
                                        className="absolute"
                                        style={{ top: y, left: x, width: colW, height: h }}
                                    >
                                        <TimelineCard kind="appt" item={a} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Tag tone="indigo">Gare (B1)</Tag>
                    <Tag tone="emerald">Appuntamenti (OPS)</Tag>
                    <Tag tone="sky">DB</Tag>
                    <Tag tone="sky">Zoom</Tag>
                </div>
            </div>
        </div>
    );
}

/* page */
export default function Dashboard() {
    const auth = useAuth();
    const [day, setDay] = useState(todayISO());
    const [timelineZoom, setTimelineZoom] = useState(1);

    const [open, setOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalPayload, setModalPayload] = useState(null);

    const dash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });

    const data = dash.data;

    const b1Static = useMemo(() => b1RacesForDay(day), [day]);
    const opsStatic = useMemo(() => opsAppointmentsForDay(day), [day]);

    const b1Db = data?.races || [];
    const opsDb = data?.appointments || [];

    const races = useMemo(() => {
        const s = (b1Static || []).map((r) => ({ ...r, source: "B1", external_id: r.id }));
        const d = (b1Db || []).map((r) => ({ ...r, source: r.source || "DB", external_id: r.external_id ?? r.id }));
        return [...s, ...d].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }, [b1Static, b1Db]);

    const appts = useMemo(() => {
        const s = (opsStatic || []).map((a) => ({ ...a, source: "OPS", external_id: a.external_id ?? a.id ?? a.title }));
        const d = (opsDb || []).map((a) => ({ ...a, source: a.source || "DB", external_id: a.external_id ?? a.id }));
        return [...s, ...d].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    }, [opsStatic, opsDb]);

    const racesCount = races.length;
    const appointmentsCount = appts.length;
    const issuesCount = data?.issuesOpen?.length ?? 0;

    const rssKeywords = useMemo(() => ["Milano", "Cortina"], []);
    const rssProxyBase = useMemo(() => `${import.meta.env.VITE_API_URL}/rss`, []);

    function onTimelineCardClick({ kind, item }) {
        const title = item?.name || item?.title || (kind === "race" ? "Gara" : "Appuntamento");
        setModalTitle(title);
        setModalPayload({ kind, item });
        setOpen(true);
    }

    return (
        <div className="space-y-6">
            {/* Intro + KPI dentro */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className="p-6 bg-white/45 relative overflow-hidden">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="text-xs font-extrabold tracking-wide text-neutral-600">RESOCONTO GIORNALIERO</div>
                                    <Tag tone="fuchsia">OPERATIVO</Tag>
                                </div>

                                <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">Dashboard</h1>

                                <div className={cx("mt-2 text-xs flex flex-wrap items-center gap-2", UI.dim2)}>
                                    <span>
                                        user: <span className="font-semibold text-neutral-900">{auth.user?.email || "—"}</span>
                                    </span>
                                    <span className="text-neutral-400">•</span>
                                    <span>
                                        role: <span className="font-semibold text-neutral-900">{auth.role || "none"}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Kpi icon={MapPinned} title="Gare" value={racesCount} tone="indigo" />
                            <Kpi icon={CalendarDays} title="Appuntamenti" value={appointmentsCount} tone="emerald" />
                            <Kpi icon={AlertTriangle} title="Criticità aperte" value={issuesCount} tone="rose" />
                        </div>
                    </div>
                </div>
            </div>

            {/* PROGRAMMA */}
            <TimelineDay
                dayISO={day}
                races={races}
                appts={appts}
                zoom={timelineZoom}
                setZoom={setTimelineZoom}
                onCardClick={onTimelineCardClick}
            />

            {/* RSS SPORT (scroll interno) */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-5 bg-white/40">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-lg font-extrabold text-neutral-900">Programma</div>
                            <div className="text-xs text-neutral-500">Milano • Cortina</div>
                        </div>
                        <Tag tone="sky">AUTO</Tag>
                    </div>

                    <div className="mt-4 rounded-3xl bg-white/55 ring-1 ring-white/45 overflow-hidden">
                        <div className="max-h-[520px] overflow-y-auto p-3">
                            <RssSportFeed
                                variant="sidebar"
                                accent="blue"
                                proxyBase={rssProxyBase}
                                refreshIntervalMs={120_000}
                                limit={32}
                                height="auto"
                                showDescription={false}
                                openInNewTab={true}
                                keywords={rssKeywords}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal open={open} title={modalTitle} onClose={() => setOpen(false)}>
                <div className="space-y-3">
                    <div className="text-sm text-neutral-600">
                        Tipo: <span className="font-semibold text-neutral-900">{modalPayload?.kind}</span>
                    </div>
                    <pre className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-3 text-xs overflow-auto">
                        {JSON.stringify(modalPayload?.item || {}, null, 2)}
                    </pre>
                </div>
            </Modal>
        </div>
    );
}
