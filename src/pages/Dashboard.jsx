// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

import RssSportFeed from "../components/RssSportFeed.jsx";
import Modal from "../components/Modal.jsx";

import { b1RacesForDay } from "../data/b1_calendar_2026.js";
import { opsAppointmentsForDay } from "../data/ops_calendar_2026.js";

import Swal from "sweetalert2";

import {
    CalendarDays,
    MapPinned,
    AlertTriangle,
    Minus,
    Plus,
    LocateFixed,
    PlusCircle,
    Trash2,
    Pencil,
    MessageSquarePlus,
    Send,
    X,
} from "lucide-react";

/* ---------------- SweetAlert helpers ---------------- */
function toastOk(title = "Salvato") {
    return Swal.fire({
        icon: "success",
        title,
        toast: true,
        position: "top-end",
        timer: 1600,
        showConfirmButton: false,
    });
}

function toastErr(err, title = "Errore") {
    const msg = err?.data?.error || err?.message || "Errore sconosciuto";
    return Swal.fire({
        icon: "error",
        title,
        text: msg,
        confirmButtonText: "Ok",
    });
}

async function confirmDanger(text = "Sei sicuro?") {
    const res = await Swal.fire({
        icon: "warning",
        title: "Conferma",
        text,
        showCancelButton: true,
        confirmButtonText: "Sì, elimina",
        cancelButtonText: "Annulla",
        confirmButtonColor: "#e11d48",
    });
    return res.isConfirmed;
}

/* ---------------- helpers ---------------- */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
function fmtHM(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function toDTLocal(isoLike) {
    if (!isoLike) return "";
    const s = String(isoLike);
    if (s.includes("T")) return s.slice(0, 16);
    return "";
}
function forceDayOnDTLocal(dayISO, dtLocal) {
    if (!dtLocal) return "";
    const t = String(dtLocal).slice(11, 16);
    return `${dayISO}T${t}`;
}
function normalizeDateTime(dayISO, v) {
    if (!v) return null;
    const s = String(v).trim();

    if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        const hhmm = s.slice(0, 5);
        return `${dayISO}T${hhmm}`;
    }

    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        return s.replace(" ", "T").slice(0, 19);
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
        return s.slice(0, 19);
    }

    return s;
}
function parseToDate(dayISO, v) {
    const norm = normalizeDateTime(dayISO, v);
    if (!norm) return null;
    const d = new Date(norm);
    return Number.isNaN(d.getTime()) ? null : d;
}
function toMinutesAny(dayISO, v) {
    const d = parseToDate(dayISO, v);
    if (!d) return null;
    return d.getHours() * 60 + d.getMinutes();
}
function timeRangeAny(dayISO, startVal, endVal) {
    const sD = parseToDate(dayISO, startVal);
    if (!sD) return "—";
    const eD = endVal ? parseToDate(dayISO, endVal) : null;
    const s = sD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = eD ? eD.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
    return e ? `${s}–${e}` : s;
}
function noteKeyForItem(item) {
    const src = String(item?.source || "DB").toUpperCase();
    if (typeof item?.id === "number") return `DB::${item.id}`;
    const ext = item?.external_id ?? item?.id ?? item?.title ?? item?.name ?? "";
    return `${src}::${String(ext)}`;
}
function formatTs(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
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
    input2:
        "w-full rounded-2xl px-3 py-2 text-sm outline-none " +
        "bg-white border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 " +
        "focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500/30",
};

function Input({ className, ...props }) {
    return <input {...props} className={cx(UI.input, className)} />;
}
function Input2({ className, ...props }) {
    return <input {...props} className={cx(UI.input2, className)} />;
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

function MiniBtn({ onClick, title, children, disabled, iconOnly = false, className, type = "button" }) {
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={cx(
                "rounded-2xl px-3 py-2 text-sm transition disabled:opacity-50 flex items-center gap-2",
                "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm",
                "ring-1 ring-white/45",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                iconOnly ? "px-2" : "",
                className
            )}
        >
            {children}
        </button>
    );
}

function PrimaryBtn({ children, className, ...props }) {
    return (
        <button
            {...props}
            className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white bg-neutral-900 hover:bg-neutral-800",
                "focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-60 disabled:hover:bg-neutral-900",
                className
            )}
        >
            {children}
        </button>
    );
}
function DangerBtn({ children, className, ...props }) {
    return (
        <button
            {...props}
            className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-500",
                "focus:outline-none focus:ring-4 focus:ring-rose-500/20 disabled:opacity-60 disabled:hover:bg-rose-600",
                className
            )}
        >
            {children}
        </button>
    );
}

/* KPI */
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

/* ---------------- Calendar (DOT timeline) ---------------- */
function DotTimelineDay({ dayISO, races = [], appts = [], zoom = 1, setZoom, onItemClick, canWrite, onAddClick }) {
    const PX_PER_HOUR_BASE = 70;
    const TOP_PAD = 14;
    const HOURS = 24;
    const VIEW_START_HOUR = 11;
    const VISIBLE_HOURS = 7;

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

    function metaFor(kind, item) {
        const src = String(item?.source || "").toUpperCase();
        const isRace = kind === "race";
        if (isRace) {
            if (src === "B1") return { chip: "B1", dot: "bg-indigo-600", ring: "ring-indigo-500/20" };
            return { chip: "DB", dot: "bg-violet-600", ring: "ring-violet-500/20" };
        }
        if (src === "OPS") return { chip: "OPS", dot: "bg-emerald-600", ring: "ring-emerald-500/20" };
        return { chip: "DB", dot: "bg-sky-600", ring: "ring-sky-500/20" };
    }

    const raceDots = useMemo(() => {
        return (races || [])
            .map((r) => {
                const s = toMinutesAny(dayISO, r.starts_at);
                if (s === null) return null;
                return { kind: "race", raw: r, s };
            })
            .filter(Boolean)
            .sort((a, b) => a.s - b.s);
    }, [races, dayISO]);

    const apptDots = useMemo(() => {
        return (appts || [])
            .map((a) => {
                const s = toMinutesAny(dayISO, a.starts_at);
                if (s === null) return null;
                return { kind: "appt", raw: a, s };
            })
            .filter(Boolean)
            .sort((a, b) => a.s - b.s);
    }, [appts, dayISO]);

    function DotRow({ kind, item, y, x }) {
        const m = metaFor(kind, item);
        const title = item?.name || item?.title || "—";
        const t = timeRangeAny(dayISO, item?.starts_at, item?.ends_at);
        const loc = (item?.venue || item?.location || "").trim();

        return (
            <div className="group absolute flex items-center" style={{ top: y, left: x }}>
                {/* DOT */}
                <button
                    type="button"
                    onClick={() => onItemClick?.({ kind, item })}
                    className="rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                    title={`${t} • ${title}${loc ? ` • ${loc}` : ""}`}
                >
                    <span className={cx("block h-3 w-3 rounded-full", m.dot, "ring-2", m.ring, "shadow-md transition group-hover:scale-110")} />
                </button>

                {/* ✅ SOLO TITOLO */}
                <button
                    type="button"
                    onClick={() => onItemClick?.({ kind, item })}
                    className={cx(
                        "ml-2 max-w-[280px] truncate rounded-full px-3 py-1",
                        "text-[11px] font-extrabold",
                        "bg-white/80 hover:bg-white ring-1 ring-black/10 shadow-sm",
                        "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                    )}
                >
                    {title}
                </button>

                {/* POPOVER elegante */}
                <div className="pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition absolute z-50 left-6 -top-2">
                    <div className="min-w-[260px] max-w-[340px] rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] ring-1 ring-black/10">
                        <div className={cx("h-1.5 rounded-t-2xl", m.dot)} />
                        <div className="p-4">
                            <div className="text-[11px] font-extrabold text-neutral-700">{t}</div>
                            <div className="mt-1 text-sm font-extrabold text-neutral-900">{title}</div>
                            <div className="mt-1 text-xs text-neutral-600">{loc || "—"}</div>
                            <div className="mt-2 text-[10px] text-neutral-400 font-semibold">Clicca per dettagli</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const labelW = 56;
    const gutter = 14;
    const laneW = "calc((100% - 56px - 14px - 14px) / 2)";
    const leftStart = `${labelW + gutter}px`;
    const rightStart = `calc(${labelW + gutter}px + ${laneW} + 14px)`;

    return (
        <div className={cx(UI.card, UI.softRing)}>
            <div className={UI.accent} />

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
                        {canWrite && (
                            <MiniBtn title="Aggiungi evento" onClick={onAddClick}>
                                <PlusCircle size={16} /> Aggiungi
                            </MiniBtn>
                        )}

                        <MiniBtn title="Zoom -" disabled={zoom <= 0.7 + 1e-6} onClick={() => setZoom((z) => clamp(Number(z) - 0.15, 0.7, 1.9))} iconOnly>
                            <Minus size={16} />
                        </MiniBtn>

                        <div className="text-xs min-w-[72px] text-center font-extrabold text-neutral-700">{Math.round(zoom * 100)}%</div>

                        <MiniBtn title="Zoom +" disabled={zoom >= 1.9 - 1e-6} onClick={() => setZoom((z) => clamp(Number(z) + 0.15, 0.7, 1.9))} iconOnly>
                            <Plus size={16} />
                        </MiniBtn>

                        <MiniBtn title="Vai a 11:00" onClick={() => scrollToHour(11, { smooth: true })}>
                            <LocateFixed size={16} /> 11–15
                        </MiniBtn>

                        <MiniBtn title="Vai a ora" disabled={!showNow} onClick={() => scrollToNow({ smooth: true })}>
                            <LocateFixed size={16} /> Ora
                        </MiniBtn>
                    </div>
                </div>
            </div>

            <div className="p-5 bg-white/40">
                <div
                    ref={scrollRef}
                    className={cx("relative rounded-3xl overflow-y-auto", "bg-white/35", "ring-1 ring-black/10")}
                    style={{
                        height: visibleHeight,
                        backgroundImage:
                            "linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                        backgroundPosition: "0 0",
                    }}
                >
                    <div className="relative" style={{ height }}>
                        {/* hour labels */}
                        {Array.from({ length: 25 }).map((_, i) => {
                            const y = TOP_PAD + i * pxPerHour;
                            return (
                                <div key={i} className="absolute left-0" style={{ top: y }}>
                                    <div className="w-14 text-[11px] text-right pr-2 font-extrabold text-neutral-700">{String(i).padStart(2, "0")}:00</div>
                                </div>
                            );
                        })}

                        {/* NOW */}
                        {showNow && nowY !== null ? (
                            <div className="absolute left-0 right-0 pointer-events-none" style={{ top: nowY }}>
                                <div className="h-[2px] bg-rose-600 shadow-[0_0_0_1px_rgba(255,255,255,0.6)]" />
                            </div>
                        ) : null}

                        {/* center divider */}
                        <div
                            className="absolute top-0 bottom-0"
                            style={{
                                left: `calc(${labelW + gutter}px + ${laneW} + 7px)`,
                                width: 1,
                                background: "rgba(0,0,0,0.10)",
                            }}
                        />

                        {/* items */}
                        <div className="absolute left-0 right-0 top-0 bottom-0">
                            {raceDots.map((d, idx) => (
                                <DotRow
                                    key={`race-${d.raw.id ?? d.raw.external_id ?? idx}-${idx}`}
                                    kind="race"
                                    item={d.raw}
                                    y={laneY(d.s)}
                                    x={leftStart}
                                />
                            ))}

                            {apptDots.map((d, idx) => (
                                <DotRow
                                    key={`appt-${d.raw.id ?? d.raw.external_id ?? idx}-${idx}`}
                                    kind="appt"
                                    item={d.raw}
                                    y={laneY(d.s)}
                                    x={rightStart}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Tag tone="indigo">Gare (B1)</Tag>
                    <Tag tone="emerald">Appuntamenti (OPS)</Tag>
                    <Tag tone="sky">DB</Tag>
                    <Tag tone="rose">Ora</Tag>
                </div>
            </div>
        </div>
    );
}

/* ---------------- Page ---------------- */
export default function Dashboard() {
    const auth = useAuth();
    const canWrite = !!auth?.canWrite;
    const qc = useQueryClient();

    const [day, setDay] = useState(todayISO());
    const [timelineZoom, setTimelineZoom] = useState(1);

    const [open, setOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalPayload, setModalPayload] = useState(null);

    // ✅ MODALE "AGGIUNGI"
    const [addOpen, setAddOpen] = useState(false);
    const [addKind, setAddKind] = useState("appt"); // "race" | "appt"
    const [addForm, setAddForm] = useState({
        starts_at: "",
        ends_at: "",
        title: "",
        where: "",
        description: "",
    });

    const dash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });

    const data = dash.data;

    // STATIC
    const b1Static = useMemo(() => b1RacesForDay(day), [day]);
    const opsStatic = useMemo(() => opsAppointmentsForDay(day), [day]);

    // DB
    const b1Db = data?.races || [];
    const opsDb = data?.appointments || [];

    // merge
    const races = useMemo(() => {
        const s = (b1Static || []).map((r) => ({ ...r, source: "B1", external_id: r.external_id || r.id, readonly: true }));
        const d = (b1Db || []).map((r) => ({ ...r, source: "DB", external_id: String(r.id), readonly: false }));
        return [...s, ...d].sort((a, b) => new Date(normalizeDateTime(day, a.starts_at) || 0) - new Date(normalizeDateTime(day, b.starts_at) || 0));
    }, [b1Static, b1Db, day]);

    const appts = useMemo(() => {
        const s = (opsStatic || []).map((a) => ({ ...a, source: "OPS", external_id: a.external_id ?? a.id ?? a.title, readonly: true }));
        const d = (opsDb || []).map((a) => ({ ...a, source: String(a.source || "DB"), external_id: a.external_id ?? String(a.id), readonly: false }));
        return [...s, ...d].sort((a, b) => new Date(normalizeDateTime(day, a.starts_at) || 0) - new Date(normalizeDateTime(day, b.starts_at) || 0));
    }, [opsStatic, opsDb, day]);

    const racesCount = races.length;
    const appointmentsCount = appts.length;
    const issuesCount = data?.issuesOpen?.length ?? 0;

    const rssKeywords = useMemo(() => ["Milano", "Cortina"], []);
    const rssProxyBase = useMemo(() => `${import.meta.env.VITE_API_URL}/rss`, []);

    // ✅ NOTE ENTRIES (dal backend)
    const noteEntries = data?.noteEntries || [];
    const noteEntriesByKey = useMemo(() => {
        const m = new Map();
        for (const n of noteEntries) {
            const src = String(n.source || "").toUpperCase();
            const ext = String(n.external_id || "");
            const k = `${src}::${ext}`;
            const arr = m.get(k) || [];
            arr.push(n);
            m.set(k, arr);
        }
        for (const [k, arr] of m.entries()) {
            arr.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            m.set(k, arr);
        }
        return m;
    }, [noteEntries]);

    // ✅ mutations note entries
    const createNoteEntry = useMutation({
        mutationFn: (payload) => api.createNoteEntry(payload),
        onSuccess: () => {
            toastOk("Nota pubblicata");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore pubblicazione nota"),
    });

    const updateNoteEntry = useMutation({
        mutationFn: ({ id, patch }) => api.updateNoteEntry(id, patch),
        onSuccess: () => {
            toastOk("Nota aggiornata");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore update nota"),
    });

    const deleteNoteEntry = useMutation({
        mutationFn: (id) => api.deleteNoteEntry(id),
        onSuccess: () => {
            toastOk("Nota eliminata");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore eliminazione nota"),
    });

    // other mutations
    const createRace = useMutation({
        mutationFn: (payload) => api.createRace(payload),
        onSuccess: () => {
            toastOk("Gara salvata");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore creazione gara"),
    });

    const createAppointment = useMutation({
        mutationFn: (payload) => api.createAppointment(payload),
        onSuccess: () => {
            toastOk("Appuntamento salvato");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore creazione appuntamento"),
    });

    const updateRace = useMutation({
        mutationFn: ({ id, patch }) => api.updateRace(id, patch),
        onSuccess: () => {
            toastOk("Gara aggiornata");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore update gara"),
    });

    const updateAppointment = useMutation({
        mutationFn: ({ id, patch }) => api.updateAppointment(id, patch),
        onSuccess: () => {
            toastOk("Appuntamento aggiornato");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore update appuntamento"),
    });

    const deleteRace = useMutation({
        mutationFn: (id) => api.deleteRace(id),
        onSuccess: () => {
            toastOk("Gara eliminata");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore eliminazione gara"),
    });

    const deleteAppointment = useMutation({
        mutationFn: (id) => api.deleteAppointment(id),
        onSuccess: () => {
            toastOk("Appuntamento eliminato");
            qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore eliminazione appuntamento"),
    });

    // modal edit state (event)
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        where: "",
        starts_at: "",
        ends_at: "",
        description: "",
    });

    // modal note state
    const [newNoteBody, setNewNoteBody] = useState("");
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteBody, setEditingNoteBody] = useState("");

    function onTimelineItemClick({ kind, item }) {
        const title = item?.name || item?.title || (kind === "race" ? "Gara" : "Appuntamento");
        setModalTitle(title);
        setModalPayload({ kind, item });
        setEditMode(false);

        setNewNoteBody("");
        setEditingNoteId(null);
        setEditingNoteBody("");

        setOpen(true);
    }

    const it = modalPayload?.item;
    const kind = modalPayload?.kind;

    const isReadonly = !!it?.readonly || String(it?.source || "").toUpperCase() === "B1" || String(it?.source || "").toUpperCase() === "OPS";
    const isDbRow = !isReadonly && typeof it?.id === "number";
    const currentNoteKey = it ? noteKeyForItem(it) : null;

    const currentKeyEntries = useMemo(() => {
        if (!currentNoteKey) return [];
        return noteEntriesByKey.get(currentNoteKey) || [];
    }, [currentNoteKey, noteEntriesByKey]);

    useEffect(() => {
        if (!it) return;
        setEditMode(false);

        const title = it.name || it.title || "";
        const where = it.venue || it.location || "";
        const description = it.description || "";

        setEditForm({
            title,
            where,
            description,
            starts_at: toDTLocal(it.starts_at),
            ends_at: it.ends_at ? toDTLocal(it.ends_at) : "",
        });

        setNewNoteBody("");
        setEditingNoteId(null);
        setEditingNoteBody("");
    }, [it]);

    function openAddModal() {
        setAddKind("appt");
        setAddForm({ starts_at: "", ends_at: "", title: "", where: "", description: "" });
        setAddOpen(true);
    }

    function submitAdd() {
        if (!addForm.title.trim() || !addForm.starts_at) {
            toastErr({ message: "Titolo e ora inizio obbligatori" }, "Dati mancanti");
            return;
        }

        const starts_at = forceDayOnDTLocal(day, addForm.starts_at);
        const ends_at = addForm.ends_at ? forceDayOnDTLocal(day, addForm.ends_at) : null;

        if (addKind === "race") {
            createRace.mutate(
                {
                    day,
                    name: addForm.title.trim(),
                    sport: "",
                    venue: addForm.where || "",
                    description: addForm.description || "",
                    starts_at,
                    ends_at,
                    notes: "",
                },
                {
                    onSuccess: () => {
                        setAddOpen(false);
                        setAddForm({ starts_at: "", ends_at: "", title: "", where: "", description: "" });
                    },
                }
            );
        } else {
            createAppointment.mutate(
                {
                    day,
                    title: addForm.title.trim(),
                    location: addForm.where || "",
                    description: addForm.description || "",
                    starts_at,
                    ends_at,
                    notes: "",
                    source: "DB",
                    external_id: null,
                    is_ops_fixed: false,
                },
                {
                    onSuccess: () => {
                        setAddOpen(false);
                        setAddForm({ starts_at: "", ends_at: "", title: "", where: "", description: "" });
                    },
                }
            );
        }
    }

    return (
        <div className="space-y-6">
            {/* Header + KPI */}
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

                                <div className="mt-2 text-xs text-neutral-500">
                                    DB races: <b>{b1Db?.length ?? 0}</b> • DB appts: <b>{opsDb?.length ?? 0}</b> • note entries: <b>{noteEntries?.length ?? 0}</b>
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

            {/* ✅ Calendar: DOT timeline */}
            <DotTimelineDay
                dayISO={day}
                races={races}
                appts={appts}
                zoom={timelineZoom}
                setZoom={setTimelineZoom}
                onItemClick={onTimelineItemClick}
                canWrite={canWrite}
                onAddClick={openAddModal}
            />

            {/* RSS */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-5 bg-white/40">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-lg font-extrabold text-neutral-900">Ultime Notizie</div>
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

            {/* ✅ MODALE "AGGIUNGI" */}
            <Modal open={addOpen} title="Aggiungi evento (DB)" onClose={() => setAddOpen(false)}>
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        <MiniBtn title="Appuntamento" onClick={() => setAddKind("appt")}>
                            <PlusCircle size={16} /> Appuntamento
                        </MiniBtn>
                        <MiniBtn title="Gara" onClick={() => setAddKind("race")}>
                            <PlusCircle size={16} /> Gara
                        </MiniBtn>
                        <Tag tone={addKind === "race" ? "indigo" : "emerald"}>
                            Tipo: {addKind === "race" ? "Gara" : "Appuntamento"}
                        </Tag>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="sm:col-span-2">
                            <div className="text-xs font-semibold text-neutral-700 mb-1">Nome evento</div>
                            <Input2 value={addForm.title} onChange={(e) => setAddForm((s) => ({ ...s, title: e.target.value }))} placeholder={addKind === "race" ? "Nome gara" : "Titolo appuntamento"} />
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-neutral-700 mb-1">Ora inizio</div>
                            <Input2 type="datetime-local" value={addForm.starts_at} onChange={(e) => setAddForm((s) => ({ ...s, starts_at: e.target.value }))} />
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-neutral-700 mb-1">Ora fine</div>
                            <Input2 type="datetime-local" value={addForm.ends_at} onChange={(e) => setAddForm((s) => ({ ...s, ends_at: e.target.value }))} />
                        </div>

                        <div className="sm:col-span-2">
                            <div className="text-xs font-semibold text-neutral-700 mb-1">Dove</div>
                            <Input2 value={addForm.where} onChange={(e) => setAddForm((s) => ({ ...s, where: e.target.value }))} placeholder={addKind === "race" ? "Venue (opzionale)" : "Location (opzionale)"} />
                        </div>

                        <div className="sm:col-span-2">
                            <div className="text-xs font-semibold text-neutral-700 mb-1">Descrizione (opzionale)</div>
                            <textarea
                                value={addForm.description}
                                onChange={(e) => setAddForm((s) => ({ ...s, description: e.target.value }))}
                                rows={5}
                                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15"
                                placeholder="Descrizione / dettagli operativi…"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <MiniBtn title="Chiudi" onClick={() => setAddOpen(false)}>
                            Annulla
                        </MiniBtn>

                        <PrimaryBtn disabled={!addForm.title.trim() || !addForm.starts_at || createRace.isPending || createAppointment.isPending} onClick={submitAdd}>
                            {createRace.isPending || createAppointment.isPending ? "Salvataggio…" : "Salva"}
                        </PrimaryBtn>
                    </div>
                </div>
            </Modal>

            {/* Modal details */}
            <Modal open={open} title={modalTitle} onClose={() => setOpen(false)}>
                {!it ? (
                    <div className="text-sm text-neutral-600">—</div>
                ) : (
                    <div className="space-y-4">
                        {/* header evento */}
                        <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Tag tone="neutral">
                                    Tipo: <b className="ml-1">{kind}</b>
                                </Tag>
                                <Tag tone="neutral">
                                    Source: <b className="ml-1">{String(it.source || "DB")}</b>
                                </Tag>
                                <Tag tone="neutral">
                                    ID: <span className="ml-1 font-mono text-xs">{String(it.id ?? it.external_id ?? "—")}</span>
                                </Tag>
                                {currentNoteKey ? (
                                    <Tag tone="sky">
                                        Note: <b className="ml-1">{currentKeyEntries.length}</b>
                                    </Tag>
                                ) : null}
                            </div>

                            <div className="mt-3 text-sm text-neutral-900 font-extrabold">{it?.name || it?.title || "—"}</div>
                            <div className="mt-1 text-xs text-neutral-600">
                                {timeRangeAny(day, it?.starts_at, it?.ends_at)} • {(it?.venue || it?.location || "").trim() || "—"}
                            </div>
                            {it?.description ? <div className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">{it.description}</div> : null}
                        </div>

                        {/* NOTE ENTRIES */}
                        <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-semibold text-neutral-700">Note operative</div>
                                    <Tag tone="neutral">{currentKeyEntries.length}</Tag>
                                </div>

                                {canWrite ? (
                                    <Tag tone="fuchsia">
                                        autore: <b className="ml-1">{auth.user?.display_name || auth.user?.name || auth.user?.email || "utente"}</b>
                                    </Tag>
                                ) : (
                                    <Tag tone="neutral">sola lettura</Tag>
                                )}
                            </div>

                            {/* list */}
                            <div className="mt-3 space-y-3">
                                {currentKeyEntries.length ? (
                                    currentKeyEntries.map((n) => {
                                        const isEditing = editingNoteId === n.id;
                                        return (
                                            <div
                                                key={n.id}
                                                className={cx(
                                                    "rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-sm",
                                                    "bg-gradient-to-br from-white via-white to-neutral-50"
                                                )}
                                            >
                                                <div className="h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />
                                                <div className="px-4 py-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-[11px] font-extrabold text-neutral-900 bg-white/70 ring-1 ring-black/5 px-2 py-0.5 rounded-full">
                                                                    {n.created_by_name || "Utente"}
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-neutral-500">{formatTs(n.created_at)}</span>
                                                                {n.updated_at && n.updated_at !== n.created_at ? (
                                                                    <span className="text-[10px] font-semibold text-neutral-400">(mod.)</span>
                                                                ) : null}
                                                            </div>

                                                            {!isEditing ? (
                                                                <div className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">{n.body}</div>
                                                            ) : (
                                                                <div className="mt-2">
                                                                    <textarea
                                                                        value={editingNoteBody}
                                                                        onChange={(e) => setEditingNoteBody(e.target.value)}
                                                                        rows={3}
                                                                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15"
                                                                    />
                                                                    <div className="mt-2 flex justify-end gap-2">
                                                                        <MiniBtn
                                                                            title="Annulla"
                                                                            onClick={() => {
                                                                                setEditingNoteId(null);
                                                                                setEditingNoteBody("");
                                                                            }}
                                                                        >
                                                                            <X size={16} /> Annulla
                                                                        </MiniBtn>
                                                                        <PrimaryBtn
                                                                            disabled={updateNoteEntry.isPending || !editingNoteBody.trim()}
                                                                            onClick={() => {
                                                                                updateNoteEntry.mutate({ id: n.id, patch: { body: editingNoteBody.trim() } });
                                                                                setEditingNoteId(null);
                                                                                setEditingNoteBody("");
                                                                            }}
                                                                        >
                                                                            {updateNoteEntry.isPending ? "Salvo…" : "Salva"}
                                                                        </PrimaryBtn>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {canWrite ? (
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <MiniBtn
                                                                    title="Modifica nota"
                                                                    iconOnly
                                                                    disabled={isEditing}
                                                                    onClick={() => {
                                                                        setEditingNoteId(n.id);
                                                                        setEditingNoteBody(n.body || "");
                                                                    }}
                                                                >
                                                                    <Pencil size={16} />
                                                                </MiniBtn>

                                                                <MiniBtn
                                                                    title="Elimina nota"
                                                                    iconOnly
                                                                    onClick={async () => {
                                                                        const ok = await confirmDanger("Eliminare questa nota?");
                                                                        if (!ok) return;
                                                                        deleteNoteEntry.mutate(n.id);
                                                                        if (editingNoteId === n.id) {
                                                                            setEditingNoteId(null);
                                                                            setEditingNoteBody("");
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </MiniBtn>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-sm text-neutral-500">Nessuna nota.</div>
                                )}
                            </div>

                            {/* create */}
                            {canWrite ? (
                                <div className="mt-4 rounded-2xl bg-white/75 ring-1 ring-black/5 p-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquarePlus size={16} className="text-neutral-700" />
                                        <div className="text-xs font-semibold text-neutral-700">Nuova nota</div>
                                    </div>

                                    <div className="mt-2">
                                        <textarea
                                            value={newNoteBody}
                                            onChange={(e) => setNewNoteBody(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15"
                                            placeholder="Scrivi una nota operativa…"
                                        />
                                        <div className="mt-2 flex justify-end">
                                            <PrimaryBtn
                                                disabled={createNoteEntry.isPending || !newNoteBody.trim() || !currentNoteKey}
                                                onClick={() => {
                                                    if (!currentNoteKey) return;
                                                    const [src, ext] = currentNoteKey.split("::");
                                                    createNoteEntry.mutate({
                                                        day,
                                                        source: src,
                                                        external_id: ext,
                                                        body: newNoteBody.trim(),
                                                    });
                                                    setNewNoteBody("");
                                                }}
                                            >
                                                <Send className="inline mr-2" size={16} />
                                                {createNoteEntry.isPending ? "Pubblico…" : "Pubblica"}
                                            </PrimaryBtn>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* EDIT/DELETE DB row */}
                        {canWrite && isDbRow ? (
                            <div className="rounded-2xl bg-white/70 ring-1 ring-black/5 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-semibold text-neutral-700">Modifica / elimina (solo DB)</div>

                                    {!editMode ? (
                                        <MiniBtn title="Modifica" onClick={() => setEditMode(true)}>
                                            <Pencil size={16} /> Modifica
                                        </MiniBtn>
                                    ) : (
                                        <MiniBtn title="Annulla" onClick={() => setEditMode(false)}>
                                            Annulla
                                        </MiniBtn>
                                    )}
                                </div>

                                {editMode && (
                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Input2 value={editForm.title} onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} placeholder={kind === "race" ? "Nome gara" : "Titolo"} />
                                        <Input2 value={editForm.where} onChange={(e) => setEditForm((s) => ({ ...s, where: e.target.value }))} placeholder={kind === "race" ? "Venue" : "Location"} />

                                        <Input2 type="datetime-local" value={editForm.starts_at} onChange={(e) => setEditForm((s) => ({ ...s, starts_at: e.target.value }))} />
                                        <Input2 type="datetime-local" value={editForm.ends_at} onChange={(e) => setEditForm((s) => ({ ...s, ends_at: e.target.value }))} />

                                        <div className="sm:col-span-2">
                                            <div className="text-xs font-semibold text-neutral-700 mb-1">Descrizione</div>
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                                                rows={4}
                                                className="w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-indigo-500/15"
                                                placeholder="Descrizione / dettagli…"
                                            />
                                        </div>

                                        <div className="sm:col-span-2 flex justify-end gap-2">
                                            <PrimaryBtn
                                                onClick={() => {
                                                    if (!editForm.title.trim() || !editForm.starts_at) {
                                                        toastErr({ message: "Titolo e ora inizio obbligatori" }, "Dati mancanti");
                                                        return;
                                                    }

                                                    const starts_at = forceDayOnDTLocal(day, editForm.starts_at);
                                                    const ends_at = editForm.ends_at ? forceDayOnDTLocal(day, editForm.ends_at) : null;

                                                    const patch =
                                                        kind === "race"
                                                            ? { name: editForm.title.trim(), venue: editForm.where || "", starts_at, ends_at, description: editForm.description || "" }
                                                            : { title: editForm.title.trim(), location: editForm.where || "", starts_at, ends_at, description: editForm.description || "" };

                                                    if (kind === "race") updateRace.mutate({ id: it.id, patch });
                                                    else updateAppointment.mutate({ id: it.id, patch });

                                                    setEditMode(false);
                                                }}
                                            >
                                                Salva modifiche
                                            </PrimaryBtn>

                                            <DangerBtn
                                                onClick={async () => {
                                                    const ok = await confirmDanger("Eliminare (soft-delete) questo record DB?");
                                                    if (!ok) return;

                                                    if (kind === "race") deleteRace.mutate(it.id);
                                                    else deleteAppointment.mutate(it.id);

                                                    setOpen(false);
                                                }}
                                            >
                                                <Trash2 className="inline mr-2" size={16} />
                                                Elimina
                                            </DangerBtn>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </Modal>
        </div>
    );
}
