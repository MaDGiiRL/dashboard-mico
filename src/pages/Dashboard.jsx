// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

import Modal from "../components/Modal.jsx";

import { b1RacesForDay } from "../data/b1_calendar_2026.js";
import { opsAppointmentsForDay } from "../data/ops_calendar_2026.js";
import { anaAssetsForPlace, anaPlaces } from "../data/ana_assets_2026.js";
import { cocContactsAll } from "../data/coc_contacts_2026.js";

// ✅ Safety Belluno directory data
import {
    SAFETY_BELLUNO_EXTERNAL_NUMBER,
    safetyBellunoContactsAll,
} from "../data/safety_belluno_contacts_2026.js";

import {
    CalendarDays,
    MapPinned,
    Building2,
    Users,
    AlertTriangle,
    Boxes,
    StickyNote,
    Plus,
    Minus,
    DoorOpen,
    DoorClosed,
    Search,
    FileCheck2,
    Phone,
    List,
    X,
    LocateFixed,
} from "lucide-react";

/* ------------------ helpers ------------------ */

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

function timeRangeRace(r) {
    const s = new Date(r.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = r.ends_at
        ? new Date(r.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null;
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

function safeStr(x) {
    return x === null || x === undefined ? "" : String(x);
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

/* ------------------ Details formatting helpers ------------------ */

function normalizePhone(raw) {
    const s = String(raw || "").trim();
    if (!s) return null;

    const cleaned = s
        .replace(/(tel|cell|telefono|n\.|nr\.|numero)\s*:?/gi, " ")
        .replace(/[^\d+\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const href = cleaned.replace(/[^\d+]/g, "");
    if (!href || href.length < 6) return null;
    return { label: cleaned, href };
}

function extractPhonesFromLine(line) {
    const s = String(line || "");
    const matches = s.match(/(\+?\d[\d\s]{5,}\d)/g) || [];
    const out = [];
    for (const m of matches) {
        const p = normalizePhone(m);
        if (p) out.push(p);
    }
    return out;
}

function splitContactLines(text) {
    return String(text || "")
        .split(/\r?\n+/)
        .map((x) => x.trim())
        .filter(Boolean);
}

function parseContactsToRows(text) {
    const lines = splitContactLines(text);
    return lines.map((line) => {
        const phones = extractPhonesFromLine(line);

        let title = line;
        for (const p of phones) {
            title = title.replace(p.label, " ").replace(p.href, " ");
        }
        title = title.replace(/\s+/g, " ").replace(/[-–•]+/g, "-").trim();

        return { title: title || "Contatto", phones };
    });
}

function isLikelyBullets(text) {
    const lines = splitContactLines(text);
    if (lines.length <= 1) return false;
    const bulletish = lines.filter((l) => /^[-•*]/.test(l)).length;
    return bulletish >= Math.max(2, Math.floor(lines.length / 3));
}

/* ------------------ UI atoms ------------------ */

function MiniBtn({ onClick, title, children, disabled, tone = "neutral", iconOnly = false }) {
    const tones = {
        neutral: "border-neutral-800 bg-neutral-950/30 hover:bg-neutral-800/50 text-neutral-200",
        ops: "border-cyan-400/25 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-100",
        b1: "border-violet-400/25 bg-violet-500/10 hover:bg-violet-500/15 text-violet-100",
        coc: "border-amber-400/25 bg-amber-500/10 hover:bg-amber-500/15 text-amber-100",
        ana: "border-indigo-400/25 bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-100",
        danger: "border-red-400/25 bg-red-500/10 hover:bg-red-500/15 text-red-100",
    };

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={cx(
                "rounded-xl border px-3 py-2 text-sm transition",
                "disabled:opacity-50 disabled:hover:bg-neutral-950/30",
                "flex items-center gap-2",
                iconOnly ? "px-2" : "",
                tones[tone] || tones.neutral
            )}
        >
            {children}
        </button>
    );
}

function Chip({ children, tone = "neutral" }) {
    const tones = {
        neutral: "border-neutral-700 bg-neutral-900/40 text-neutral-200",
        good: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
        warn: "border-amber-400/25 bg-amber-500/10 text-amber-100",
        bad: "border-red-400/25 bg-red-500/10 text-red-100",
        info: "border-sky-400/25 bg-sky-500/10 text-sky-100",
    };
    return (
        <span className={cx("text-[11px] rounded-full border px-2 py-0.5", tones[tone] || tones.neutral)}>
            {children}
        </span>
    );
}

function Kpi({ icon: Icon, title, value }) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
                {Icon ? <Icon size={16} /> : null}
                <span>{title}</span>
            </div>
            <div className="text-2xl font-semibold text-neutral-100">{value}</div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-4">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="mt-1">{children}</div>
        </div>
    );
}

/** sezione moderna colorata */
function Section({ accent = "neutral", title, icon: Icon, right, children }) {
    const styles =
        accent === "b1"
            ? {
                wrap: "border-violet-500/25 bg-gradient-to-b from-violet-500/12 via-neutral-950/35 to-neutral-950/20",
                bar: "bg-gradient-to-b from-violet-400 to-fuchsia-400",
                icon: "text-violet-100",
                title: "text-violet-50",
            }
            : accent === "ops"
                ? {
                    wrap: "border-cyan-500/25 bg-gradient-to-b from-cyan-500/12 via-neutral-950/35 to-neutral-950/20",
                    bar: "bg-gradient-to-b from-cyan-300 to-sky-400",
                    icon: "text-cyan-50",
                    title: "text-cyan-50",
                }
                : accent === "coc"
                    ? {
                        wrap: "border-amber-500/25 bg-gradient-to-b from-amber-500/10 via-neutral-950/35 to-neutral-950/20",
                        bar: "bg-gradient-to-b from-amber-300 to-orange-400",
                        icon: "text-amber-50",
                        title: "text-amber-50",
                    }
                    : accent === "ana"
                        ? {
                            wrap: "border-indigo-500/25 bg-gradient-to-b from-indigo-500/10 via-neutral-950/35 to-neutral-950/20",
                            bar: "bg-gradient-to-b from-indigo-300 to-fuchsia-300",
                            icon: "text-indigo-50",
                            title: "text-indigo-50",
                        }
                        : accent === "danger"
                            ? {
                                wrap: "border-red-500/25 bg-gradient-to-b from-red-500/10 via-neutral-950/35 to-neutral-950/20",
                                bar: "bg-gradient-to-b from-red-300 to-rose-400",
                                icon: "text-red-50",
                                title: "text-red-50",
                            }
                            : {
                                wrap: "border-neutral-800 bg-neutral-950/30",
                                bar: "bg-neutral-700",
                                icon: "text-neutral-200",
                                title: "text-neutral-100",
                            };

    return (
        <div className={cx("rounded-2xl border overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03)]", styles.wrap)}>
            <div className="border-b border-neutral-800/70">
                <div className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex items-center gap-3">
                        <div className={cx("h-10 w-1.5 rounded-full", styles.bar)} />
                        {Icon ? (
                            <div className="h-10 w-10 rounded-2xl border border-neutral-800 bg-neutral-950/45 grid place-items-center">
                                <Icon size={18} className={styles.icon} />
                            </div>
                        ) : null}
                        <div className={cx("text-lg font-semibold truncate", styles.title)}>{title}</div>
                    </div>
                    {right ? <div className="shrink-0">{right}</div> : null}
                </div>
            </div>

            <div className="px-5 py-5">{children}</div>
        </div>
    );
}

function Input({ className, ...props }) {
    return (
        <input
            {...props}
            className={cx(
                "rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none",
                "focus:ring-2 focus:ring-neutral-300/10 focus:border-neutral-700",
                className
            )}
        />
    );
}

/* ------------------ Details body renderer ------------------ */

function DetailsBody({ label, text, kind }) {
    const t = String(text || "").trim();
    if (!t) {
        return (
            <Field label={label || "Dettagli"}>
                <div className="text-sm text-neutral-400">—</div>
            </Field>
        );
    }

    const lines = splitContactLines(t);

    // ✅ CONTATTI: titolo + numeri cliccabili
    if (kind === "contacts") {
        const rows = parseContactsToRows(t);

        return (
            <Field label={label || "Recapiti"}>
                <div className="space-y-3">
                    {rows.map((r, idx) => (
                        <div key={idx} className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-3">
                            <div className="text-sm text-neutral-100 font-medium">{r.title}</div>

                            {r.phones.length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {r.phones.map((p, j) => (
                                        <a
                                            key={j}
                                            href={`tel:${p.href}`}
                                            className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/40 px-3 py-1 text-xs text-neutral-100 hover:bg-neutral-800/40"
                                            title={`Chiama ${p.label}`}
                                        >
                                            <Phone size={14} />
                                            {p.label}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-2 text-xs text-neutral-500">Nessun numero trovato.</div>
                            )}
                        </div>
                    ))}
                </div>
            </Field>
        );
    }

    // ✅ LISTE (ANA “Voci”)
    if (kind === "list" || isLikelyBullets(t)) {
        const cleaned = lines.map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

        return (
            <Field label={label || "Elenco"}>
                <ul className="space-y-2">
                    {cleaned.map((l, i) => (
                        <li key={i} className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-3 text-sm text-neutral-200">
                            {l}
                        </li>
                    ))}
                </ul>
            </Field>
        );
    }

    // ✅ TESTO GENERICO
    return (
        <Field label={label || "Dettagli"}>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-4 text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {t}
            </div>
        </Field>
    );
}

/* ------------------ grab carousel (drag + touch) ------------------ */

function useGrabScroll() {
    const ref = useRef(null);
    const state = useRef({ down: false, x: 0, left: 0, moved: false });

    const isInteractiveTarget = (el) => {
        if (!el) return false;
        const interactive = el.closest?.("button,a,input,textarea,select,label,[role='button']");
        return Boolean(interactive);
    };

    const onPointerDown = (e) => {
        const el = ref.current;
        if (!el) return;
        if (isInteractiveTarget(e.target)) return;

        state.current.down = true;
        state.current.moved = false;
        state.current.x = e.clientX;
        state.current.left = el.scrollLeft;

        el.setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e) => {
        const el = ref.current;
        if (!el) return;
        if (!state.current.down) return;

        const dx = e.clientX - state.current.x;
        if (Math.abs(dx) > 10) state.current.moved = true;

        el.scrollLeft = state.current.left - dx;
    };

    const onPointerUp = (e) => {
        const el = ref.current;
        if (!el) return;

        state.current.down = false;
        el.releasePointerCapture?.(e.pointerId);
    };

    const onClickCapture = (e) => {
        if (isInteractiveTarget(e.target)) return;

        if (state.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            state.current.moved = false;
        }
    };

    return { ref, onPointerDown, onPointerMove, onPointerUp, onClickCapture };
}

function Carousel({ children, itemWidthClass = "w-[320px] sm:w-[380px] lg:w-[420px]" }) {
    const { ref, onPointerDown, onPointerMove, onPointerUp, onClickCapture } = useGrabScroll();

    return (
        <div className="relative">
            <div
                ref={ref}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClickCapture={onClickCapture}
                className={cx(
                    "mt-2 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth",
                    "cursor-grab active:cursor-grabbing select-none"
                )}
                style={{
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                }}
            >
                <style>{`
          .hide-scrollbar::-webkit-scrollbar{display:none;}
        `}</style>

                {React.Children.map(children, (child, idx) => (
                    <div data-card="1" className={cx("shrink-0 snap-start", itemWidthClass)} key={idx}>
                        {child}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ------------------ Timeline (zoom + scroll-to-now) ------------------ */

function TimelineDay({ dayISO, races = [], appts = [], zoom = 1, setZoom, onOpenRace, onOpenAppt }) {
    const PX_PER_HOUR_BASE = 72;
    const TOP_PAD = 14;
    const HOURS = 24;

    const pxPerHour = PX_PER_HOUR_BASE * zoom;
    const height = TOP_PAD * 2 + HOURS * pxPerHour;

    const scrollRef = useRef(null);

    const [nowMin, setNowMin] = useState(() => minutesSinceStartOfDay(new Date()));
    useEffect(() => {
        const t = setInterval(() => setNowMin(minutesSinceStartOfDay(new Date())), 30_000);
        return () => clearInterval(t);
    }, []);

    const showNow = dayISO === todayISO();
    const laneY = (min) => TOP_PAD + (min / 60) * pxPerHour;
    const nowY = showNow ? laneY(clamp(nowMin, 0, 24 * 60)) : null;

    function scrollToNow({ smooth = true } = {}) {
        const el = scrollRef.current;
        if (!el || !showNow) return;

        const target = Math.max(0, nowY - el.clientHeight * 0.45);
        el.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
    }

    // auto scroll: al mount + quando cambia zoom
    useEffect(() => {
        if (!showNow) return;
        const raf = requestAnimationFrame(() => scrollToNow({ smooth: false }));
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showNow, zoom]);

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

    function assignCols(items) {
        const colsEnd = [0, 0];
        return items.map((it) => {
            const col = it.s >= colsEnd[0] ? 0 : it.s >= colsEnd[1] ? 1 : 0;
            colsEnd[col] = it.e;
            return { ...it, col };
        });
    }

    const raceLaid = useMemo(() => assignCols(raceItems), [raceItems]);
    const apptLaid = useMemo(() => assignCols(apptItems), [apptItems]);

    const Z_MIN = 0.6;
    const Z_MAX = 1.8;

    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-800/70 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-lg font-semibold text-neutral-100">Timeline</div>
                    <div className="text-xs text-neutral-500">
                        {dayISO} {showNow ? `• ora: ${fmtHM(nowMin)}` : ""}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <MiniBtn
                        tone="neutral"
                        title="Zoom -"
                        disabled={zoom <= Z_MIN + 1e-6}
                        onClick={() => setZoom((z) => clamp(Number(z) - 0.15, Z_MIN, Z_MAX))}
                        iconOnly
                    >
                        <Minus size={16} />
                    </MiniBtn>

                    <div className="text-xs text-neutral-400 min-w-[68px] text-center">
                        {Math.round(zoom * 100)}%
                    </div>

                    <MiniBtn
                        tone="neutral"
                        title="Zoom +"
                        disabled={zoom >= Z_MAX - 1e-6}
                        onClick={() => setZoom((z) => clamp(Number(z) + 0.15, Z_MIN, Z_MAX))}
                        iconOnly
                    >
                        <Plus size={16} />
                    </MiniBtn>

                    <MiniBtn
                        tone="neutral"
                        title="Vai a ora"
                        disabled={!showNow}
                        onClick={() => scrollToNow({ smooth: true })}
                    >
                        <LocateFixed size={16} /> Ora
                    </MiniBtn>
                </div>
            </div>

            <div className="px-5 py-5">
                <div
                    ref={scrollRef}
                    className="rounded-2xl border border-neutral-800 bg-neutral-950/40 overflow-auto"
                    style={{ maxHeight: "70vh" }}
                >
                    <div className="relative" style={{ height }}>
                        {/* griglia ore */}
                        {Array.from({ length: HOURS + 1 }).map((_, i) => {
                            const y = TOP_PAD + i * pxPerHour;
                            return (
                                <div key={i} className="absolute left-0 right-0" style={{ top: y }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 text-[11px] text-neutral-500 text-right pr-2">
                                            {String(i).padStart(2, "0")}:00
                                        </div>
                                        <div className="flex-1 border-t border-neutral-800/70" />
                                    </div>
                                </div>
                            );
                        })}

                        {/* separatore centrale */}
                        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
                            <div className="absolute left-1/2 top-3 bottom-3 w-px bg-neutral-800/70" />
                            <div className="absolute left-0 right-0 top-0 h-10 bg-gradient-to-b from-neutral-950/70 to-transparent" />
                            <div className="absolute left-0 right-0 bottom-0 h-10 bg-gradient-to-t from-neutral-950/70 to-transparent" />
                        </div>

                        <div className="absolute left-1/2 top-3 -translate-x-1/2 text-[11px] uppercase tracking-wide text-neutral-500">
                            Gare ↑ • Appuntamenti ↓
                        </div>

                        {/* NOW line */}
                        {showNow ? (
                            <div className="absolute left-0 right-0" style={{ top: nowY }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-14" />
                                    <div className="flex-1 relative">
                                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-rose-300 shadow" />
                                        <div className="border-t-2 border-rose-300/80" />
                                    </div>
                                    <div className="w-14 text-[11px] text-rose-200">ORA</div>
                                </div>
                            </div>
                        ) : null}

                        {/* content */}
                        <div className="absolute left-0 right-0 top-0 bottom-0">
                            {/* GARE (sx) */}
                            {raceLaid.map((it, idx) => {
                                const y = laneY(it.s);
                                const h = Math.max(36, ((it.e - it.s) / 60) * pxPerHour);

                                const leftBase = 72;
                                const laneW = "calc(50% - 86px)";
                                const colW = `calc((${laneW}) / 2)`;
                                const x = `calc(${leftBase}px + (${it.col} * ${colW}))`;

                                const r = it.raw;

                                return (
                                    <button
                                        key={`race-${r.id}-${idx}`}
                                        type="button"
                                        onClick={() => onOpenRace(r)}
                                        className="absolute text-left"
                                        style={{ top: y, left: x, width: colW, height: h }}
                                        title="Apri dettagli / note"
                                    >
                                        <div className="h-full rounded-2xl border border-violet-500/25 bg-violet-500/10 hover:bg-violet-500/15 transition p-3 overflow-hidden">
                                            <div className="text-[11px] text-violet-200/90">
                                                {timeRangeRace(r)} • {r.venue || "—"}
                                            </div>
                                            <div className="mt-1 font-semibold text-neutral-100 truncate">{r.name}</div>
                                            {r.notes_live ? (
                                                <div className="mt-2 text-xs text-neutral-200/90 line-clamp-3 whitespace-pre-wrap">
                                                    {r.notes_live}
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-xs text-neutral-500">Nessuna nota.</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {/* APPUNTAMENTI (dx) */}
                            {apptLaid.map((it, idx) => {
                                const y = laneY(it.s);
                                const h = Math.max(36, ((it.e - it.s) / 60) * pxPerHour);

                                const laneStart = "calc(50% + 14px)";
                                const laneW = "calc(50% - 86px)";
                                const colW = `calc((${laneW}) / 2)`;
                                const x = `calc(${laneStart} + (${it.col} * ${colW}))`;

                                const a = it.raw;

                                return (
                                    <button
                                        key={`appt-${a.external_id}-${idx}`}
                                        type="button"
                                        onClick={() => onOpenAppt(a)}
                                        className="absolute text-left"
                                        style={{ top: y, left: x, width: colW, height: h }}
                                        title="Apri dettagli / note"
                                    >
                                        <div className="h-full rounded-2xl border border-cyan-400/25 bg-cyan-500/10 hover:bg-cyan-500/15 transition p-3 overflow-hidden">
                                            <div className="text-[11px] text-cyan-100/90">
                                                {timeRange(a.starts_at, a.ends_at)} • {a.location || "—"}
                                            </div>
                                            <div className="mt-1 font-semibold text-neutral-100 truncate">{a.title}</div>
                                            {a.notes ? (
                                                <div className="mt-2 text-xs text-neutral-200/90 line-clamp-3 whitespace-pre-wrap">
                                                    {a.notes}
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-xs text-neutral-500">Nessuna nota.</div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-violet-100">Gare (B1)</span>
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-1 text-cyan-100">Appuntamenti (OPS)</span>
                    <span className="rounded-full border border-rose-300/25 bg-rose-500/10 px-2 py-1 text-rose-100">Linea ora</span>
                </div>
            </div>
        </div>
    );
}

/* ------------------ page ------------------ */

export default function Dashboard() {
    const auth = useAuth();
    const qc = useQueryClient();
    const [day, setDay] = useState(todayISO());

    // ✅ timeline zoom
    const [timelineZoom, setTimelineZoom] = useState(1);

    // ✅ modal note
    const [noteModal, setNoteModal] = useState({
        open: false,
        day: null,
        source: "OPS",
        external_id: null,
        title: "",
        notes: "",
        tone: "neutral",
    });

    const openNoteModal = ({ day, source, external_id, title, notes, tone }) =>
        setNoteModal({
            open: true,
            day,
            source,
            external_id,
            title: title || "",
            notes: notes || "",
            tone: tone || "neutral",
        });

    const closeNoteModal = () =>
        setNoteModal({
            open: false,
            day: null,
            source: "OPS",
            external_id: null,
            title: "",
            notes: "",
            tone: "neutral",
        });

    // ✅ COC add modal
    const [cocAddModal, setCocAddModal] = useState({ open: false, name: "", autoOpen: true, ordinance: false });

    // ✅ ANA add modal
    const [anaAddModal, setAnaAddModal] = useState({
        open: false,
        place: "",
        section_id: null,
        section_title: "",
        item_text: "",
        scope: "global",
    });

    // ✅ “details” modals (recapiti / voci)
    const [detailsModal, setDetailsModal] = useState({
        open: false,
        title: "",
        tone: "neutral",
        contentLabel: "",
        contentText: "",
        kind: "text", // ✅ contacts | list | text
    });

    // ✅ filters / search
    const [cocFilter, setCocFilter] = useState("all"); // all|aperto|chiuso
    const [cocSearch, setCocSearch] = useState("");
    const [anaSearch, setAnaSearch] = useState("");

    // ✅ Safety Belluno directory (static + user added)
    const [safetySearch, setSafetySearch] = useState("");
    const [safetyAddModal, setSafetyAddModal] = useState({
        open: false,
        operator: "",
        interno: "",
        external_dial: "",
        responder_group: "",
        responder_digit: "",
        responder_note: "",
    });

    const SAFETY_LS_KEY = "safety_belluno_contacts_user_v1";

    const safetyUserRows = useMemo(() => {
        try {
            const raw = localStorage.getItem(SAFETY_LS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }, []);

    const [safetyUser, setSafetyUser] = useState(safetyUserRows);

    function persistSafetyUser(next) {
        setSafetyUser(next);
        try {
            localStorage.setItem(SAFETY_LS_KEY, JSON.stringify(next));
        } catch {
            // ignore
        }
    }

    const safetyStatic = useMemo(() => safetyBellunoContactsAll(), []);
    const safetyMerged = useMemo(() => {
        const all = [...safetyStatic, ...(Array.isArray(safetyUser) ? safetyUser : [])];

        const q = safetySearch.trim().toLowerCase();
        if (!q) return all;

        return all.filter((x) =>
            `${safeStr(x.operator)} ${safeStr(x.interno)} ${safeStr(x.external_dial)} ${safeStr(x.responder_group)} ${safeStr(
                x.responder_digit
            )} ${safeStr(x.responder_note)}`.toLowerCase().includes(q)
        );
    }, [safetyStatic, safetyUser, safetySearch]);

    // ANA picker
    const [anaPlace, setAnaPlace] = useState(() => anaPlaces()[0] || "San Vito di Cadore");
    const anaPack = useMemo(() => anaAssetsForPlace(anaPlace), [anaPlace]);

    const dash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });

    const data = dash.data;

    // notes
    const upsertNote = useMutation({
        mutationFn: ({ day, source, external_id, notes }) => api.upsertAppointmentNote({ day, source, external_id, notes }),
        onSuccess: async () => qc.invalidateQueries({ queryKey: ["dashboardDay", day] }),
        onError: (err) => (console.error(err), alert(err.message)),
    });

    // COC open/close
    const upsertCocStatus = useMutation({
        mutationFn: (payload) => api.upsertCocStatus(payload),
        onSuccess: async () => qc.invalidateQueries({ queryKey: ["dashboardDay", day] }),
        onError: (err) => (console.error(err), alert(err.message)),
    });

    // ensure commune + optional auto open + ordinance
    const ensureCocCommune = useMutation({
        mutationFn: ({ name }) => api.ensureCocCommune({ name }),
        onSuccess: async (row) => {
            const name = row?.name || cocAddModal.name;

            if (cocAddModal.autoOpen) await api.upsertCocStatus({ day, commune_name: name, is_open: true });
            if (cocAddModal.ordinance) await api.upsertCocOrdinance({ day, commune_name: name, ordinance: true });

            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            setCocAddModal({ open: false, name: "", autoOpen: true, ordinance: false });
        },
        onError: (err) => (console.error(err), alert(err.message)),
    });

    // ordinance toggle
    const upsertCocOrdinance = useMutation({
        mutationFn: (payload) => api.upsertCocOrdinance(payload),
        onSuccess: async () => qc.invalidateQueries({ queryKey: ["dashboardDay", day] }),
        onError: (err) => (console.error(err), alert(err.message)),
    });

    // ANA add item
    const addAnaItem = useMutation({
        mutationFn: (payload) => api.addAnaItem(payload),
        onSuccess: async () => qc.invalidateQueries({ queryKey: ["dashboardDay", day] }),
        onError: (err) => (console.error(err), alert(err.message)),
    });

    // static
    const b1RacesRaw = useMemo(() => b1RacesForDay(day), [day]);
    const opsRaw = useMemo(() => opsAppointmentsForDay(day), [day]);

    // notes map
    const notesMap = useMemo(() => {
        const m = new Map();
        for (const n of data?.appointmentNotes || []) m.set(`${n.source}:${n.external_id}`, n.notes || "");
        return m;
    }, [data?.appointmentNotes]);

    // ops merge
    const opsAppts = useMemo(
        () =>
            opsRaw.map((a) => ({
                ...a,
                source: "OPS",
                notes: notesMap.get(`OPS:${a.external_id}`) || "",
            })),
        [opsRaw, notesMap]
    );

    // b1 merge
    const b1Races = useMemo(
        () =>
            b1RacesRaw.map((r) => ({
                ...r,
                source: "B1",
                external_id: r.id,
                notes_live: notesMap.get(`B1:${r.id}`) || "",
            })),
        [b1RacesRaw, notesMap]
    );

    // COC: static -> filtered
    const cocAll = useMemo(() => cocContactsAll(), []);
    const cocStatic = useMemo(() => {
        let xs = cocAll;

        const q = cocSearch.trim().toLowerCase();
        if (q) {
            xs = xs.filter((x) => `${safeStr(x.commune)} ${safeStr(x.contacts)}`.toLowerCase().includes(q));
        }

        if (cocFilter !== "all") {
            xs = xs.filter((x) => String(x.coc_status).toLowerCase() === cocFilter);
        }

        return xs;
    }, [cocAll, cocSearch, cocFilter]);

    // COC overlay status map (DB) + ordinance map (DB)
    const cocStatusMap = useMemo(() => {
        const m = new Map();
        for (const row of data?.coc || []) m.set(String(row.commune_name || "").trim().toLowerCase(), row);
        return m;
    }, [data?.coc]);

    const cocOrdMap = useMemo(() => {
        const m = new Map();
        for (const row of data?.cocOrdinances || []) m.set(String(row.commune_name || "").trim().toLowerCase(), row);
        return m;
    }, [data?.cocOrdinances]);

    const cocMerged = useMemo(() => {
        return cocStatic.map((c) => {
            const k = String(c.commune || "").trim().toLowerCase();
            const db = cocStatusMap.get(k);
            const isOpen = db ? !db.closed_at : String(c.coc_status || "").toLowerCase() === "aperto";

            const ord = cocOrdMap.get(k);
            const ordinance = ord ? Boolean(ord.ordinance) : Boolean(c.ordinance);

            return {
                ...c,
                source: "COC",
                external_id: c.id,
                notes_live: notesMap.get(`COC:${c.id}`) || "",
                overlay: {
                    isOpen,
                    ordinance,
                    opened_at: db?.opened_at || null,
                    closed_at: db?.closed_at || null,
                    room_phone: db?.room_phone || null,
                },
            };
        });
    }, [cocStatic, cocStatusMap, cocOrdMap, notesMap]);

    // ANA: merge + search
    const anaDbItems = useMemo(() => data?.anaItems || [], [data?.anaItems]);

    const anaMergedSections = useMemo(() => {
        const base = (anaPack?.sections || []).map((s) => ({
            ...s,
            items: [...(s.items || [])],
            notes_live: notesMap.get(`ANA:${s.id}`) || "",
        }));

        const byId = new Map(base.map((s) => [String(s.id), s]));
        const byTitle = new Map(base.map((s) => [String(s.title).trim().toLowerCase(), s]));

        const place = anaPack?.place;
        const filtered = anaDbItems.filter((x) => !place || x.place === place);

        for (const it of filtered) {
            const target =
                (it.section_id && byId.get(String(it.section_id))) ||
                (it.section_title && byTitle.get(String(it.section_title).trim().toLowerCase()));

            if (target) target.items.push(it.item_text);
            else {
                base.push({
                    id: `db-${it.id}`,
                    title: it.section_title || "Extra",
                    items: [it.item_text],
                    notes_live: "",
                });
            }
        }

        const q = anaSearch.trim().toLowerCase();
        if (!q) return base;

        return base
            .map((s) => {
                const hitTitle = String(s.title || "").toLowerCase().includes(q);
                const items = (s.items || []).filter((x) => String(x).toLowerCase().includes(q));
                if (hitTitle) return s;
                if (items.length) return { ...s, items };
                return null;
            })
            .filter(Boolean);
    }, [anaPack, anaDbItems, notesMap, anaSearch]);

    // counts
    const racesCount = b1Races.length + (data?.races?.length || 0);
    const appointmentsCount = opsAppts.length + (data?.appointments?.length || 0);
    const issuesCount = data?.issuesOpen?.length ?? 0;

    const openDetails = ({ title, tone, contentLabel, contentText, kind = "text" }) =>
        setDetailsModal({ open: true, title, tone: tone || "neutral", contentLabel, contentText, kind });

    // timeline click -> modal note
    const openRace = (r) =>
        openNoteModal({
            day,
            source: "B1",
            external_id: r.id,
            title: r.name,
            notes: r.notes_live || "",
            tone: "b1",
        });

    const openAppt = (a) =>
        openNoteModal({
            day,
            source: "OPS",
            external_id: a.external_id,
            title: a.title,
            notes: a.notes || "",
            tone: "ops",
        });

    return (
        <div className="space-y-6">
            {/* header */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                <div>
                    <div className="text-neutral-400 text-sm">Resoconto giornaliero</div>
                    <h1 className="text-2xl font-semibold text-neutral-100">Dashboard</h1>
                    <div className="mt-2 text-xs text-neutral-500">
                        user: {auth.user?.email || "—"} • role: {auth.role || "none"}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
                </div>
            </div>

            {dash.isLoading && <div className="text-neutral-400">Caricamento…</div>}
            {dash.error && <div className="text-red-400">{dash.error.message}</div>}

            {/* KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Kpi icon={MapPinned} title="Gare" value={racesCount} />
                <Kpi icon={CalendarDays} title="Appuntamenti" value={appointmentsCount} />
                <Kpi icon={AlertTriangle} title="Criticità aperte" value={issuesCount} />
            </div>

            {/* TIMELINE (gare sopra / appuntamenti sotto) */}
            <TimelineDay
                dayISO={day}
                races={b1Races}
                appts={opsAppts}
                zoom={timelineZoom}
                setZoom={setTimelineZoom}
                onOpenRace={openRace}
                onOpenAppt={openAppt}
            />

            {/* B1 + OPS (caroselli originali, se li vuoi tenere) */}
            {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Section accent="b1" icon={MapPinned} title="Gare B1 (ufficiale)">
                    {b1Races.length === 0 ? (
                        <div className="text-sm text-neutral-400">Nessuna gara B1.</div>
                    ) : (
                        <Carousel>
                            {b1Races.map((r) => (
                                <div key={r.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-semibold text-neutral-100 truncate">{r.name}</div>
                                            <div className="mt-1 text-sm text-neutral-400">
                                                {timeRangeRace(r)} • {r.venue || "—"}
                                            </div>

                                            <div className="mt-3">
                                                {r.notes_live ? (
                                                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/20 p-3 text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                                        {r.notes_live}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-neutral-500">Nessuna nota.</div>
                                                )}
                                            </div>
                                        </div>

                                        <MiniBtn
                                            tone="b1"
                                            title="Note"
                                            onClick={() =>
                                                openNoteModal({
                                                    day,
                                                    source: "B1",
                                                    external_id: r.id,
                                                    title: r.name,
                                                    notes: r.notes_live,
                                                    tone: "b1",
                                                })
                                            }
                                        >
                                            <StickyNote size={16} /> Note
                                        </MiniBtn>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                    )}
                </Section>

                <Section accent="ops" icon={CalendarDays} title="Appuntamenti OPS (programmati)">
                    {opsAppts.length === 0 ? (
                        <div className="text-sm text-neutral-400">Nessun appuntamento OPS.</div>
                    ) : (
                        <Carousel>
                            {opsAppts.map((a) => (
                                <div key={a.external_id} className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-semibold text-neutral-100 truncate">{a.title}</div>
                                            <div className="mt-1 text-sm text-neutral-400">
                                                {timeRange(a.starts_at, a.ends_at)} • {a.location || "—"}
                                            </div>

                                            <div className="mt-3">
                                                {a.notes ? (
                                                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/20 p-3 text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                                        {a.notes}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-neutral-500">Nessuna nota.</div>
                                                )}
                                            </div>
                                        </div>

                                        <MiniBtn
                                            tone="ops"
                                            title="Note"
                                            onClick={() =>
                                                openNoteModal({
                                                    day,
                                                    source: "OPS",
                                                    external_id: a.external_id,
                                                    title: a.title,
                                                    notes: a.notes,
                                                    tone: "ops",
                                                })
                                            }
                                        >
                                            <StickyNote size={16} /> Note
                                        </MiniBtn>
                                    </div>
                                </div>
                            ))}
                        </Carousel>
                    )}
                </Section>
            </div> */}

            {/* COC + ANA */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Section
                    accent="coc"
                    icon={Building2}
                    title="COC — Stato / Ordinanza / Note"
                    right={
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <Input
                                    value={cocSearch}
                                    onChange={(e) => setCocSearch(e.target.value)}
                                    placeholder="Cerca comune / recapiti…"
                                    className="pl-9 w-[240px]"
                                />
                            </div>

                            <select
                                value={cocFilter}
                                onChange={(e) => setCocFilter(e.target.value)}
                                className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100"
                            >
                                <option value="all">Tutti</option>
                                <option value="aperto">Solo aperti</option>
                                <option value="chiuso">Solo chiusi</option>
                            </select>

                            <MiniBtn
                                tone="coc"
                                title="Aggiungi Comune"
                                onClick={() => setCocAddModal({ open: true, name: "", autoOpen: true, ordinance: false })}
                            >
                                <Plus size={16} /> Comune
                            </MiniBtn>
                        </div>
                    }
                >
                    {cocMerged.length === 0 ? (
                        <div className="text-sm text-neutral-400">Nessun comune trovato.</div>
                    ) : (
                        <Carousel itemWidthClass="w-[340px] sm:w-[420px] lg:w-[520px]">
                            {cocMerged.map((c) => {
                                const isOpen = Boolean(c.overlay?.isOpen);
                                const ordinance = Boolean(c.overlay?.ordinance);

                                return (
                                    <div key={c.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-neutral-100 truncate">{c.commune}</div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <Chip tone={isOpen ? "good" : "neutral"}>{isOpen ? "COC aperto" : "COC chiuso"}</Chip>
                                                    <Chip tone={ordinance ? "warn" : "neutral"}>{ordinance ? "Ordinanza: sì" : "Ordinanza: no"}</Chip>
                                                    {c.overlay?.room_phone ? <Chip tone="info">sala: {c.overlay.room_phone}</Chip> : null}
                                                </div>

                                                {c.overlay?.opened_at ? (
                                                    <div className="mt-2 text-xs text-neutral-500">
                                                        Apertura: {new Date(c.overlay.opened_at).toLocaleTimeString()}
                                                        {c.overlay?.closed_at ? ` • Chiusura: ${new Date(c.overlay.closed_at).toLocaleTimeString()}` : ""}
                                                    </div>
                                                ) : null}

                                                {c.notes_live ? (
                                                    <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/20 p-3 text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                                        {c.notes_live}
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 text-xs text-neutral-500">Nessuna nota.</div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <MiniBtn
                                                    tone="coc"
                                                    title={isOpen ? "Chiudi COC" : "Apri COC"}
                                                    onClick={() => upsertCocStatus.mutate({ day, commune_name: c.commune, is_open: !isOpen })}
                                                >
                                                    {isOpen ? <DoorClosed size={16} /> : <DoorOpen size={16} />}
                                                    {isOpen ? "Chiudi" : "Apri"}
                                                </MiniBtn>

                                                <MiniBtn
                                                    tone="coc"
                                                    title="Ordinanza"
                                                    onClick={() => upsertCocOrdinance.mutate({ day, commune_name: c.commune, ordinance: !ordinance })}
                                                >
                                                    <FileCheck2 size={16} /> Ordinanza
                                                </MiniBtn>

                                                <MiniBtn
                                                    tone="coc"
                                                    title="Recapiti (apri)"
                                                    onClick={() =>
                                                        openDetails({
                                                            title: `Recapiti — ${c.commune}`,
                                                            tone: "coc",
                                                            contentLabel: "Recapiti",
                                                            contentText: c.contacts ? String(c.contacts) : "Nessun recapito.",
                                                            kind: "contacts",
                                                        })
                                                    }
                                                >
                                                    <Phone size={16} /> Recapiti
                                                </MiniBtn>

                                                <MiniBtn
                                                    tone="coc"
                                                    title="Note"
                                                    onClick={() =>
                                                        openNoteModal({
                                                            day,
                                                            source: "COC",
                                                            external_id: c.id,
                                                            title: c.commune,
                                                            notes: c.notes_live,
                                                            tone: "coc",
                                                        })
                                                    }
                                                >
                                                    <StickyNote size={16} /> Note
                                                </MiniBtn>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </Carousel>
                    )}
                </Section>

                <Section
                    accent="ana"
                    icon={Boxes}
                    title="Mezzi / Materiali"
                    right={
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <select
                                value={anaPlace}
                                onChange={(e) => setAnaPlace(e.target.value)}
                                className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100"
                            >
                                {anaPlaces().map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>

                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                <Input value={anaSearch} onChange={(e) => setAnaSearch(e.target.value)} placeholder="Cerca…" className="pl-9 w-[220px]" />
                            </div>

                            <MiniBtn
                                tone="ana"
                                title="Aggiungi mezzo/materiale"
                                onClick={() =>
                                    setAnaAddModal({
                                        open: true,
                                        place: anaPack?.place || anaPlace,
                                        section_id: null,
                                        section_title: "",
                                        item_text: "",
                                        scope: "global",
                                    })
                                }
                            >
                                <Plus size={16} /> Aggiungi
                            </MiniBtn>
                        </div>
                    }
                >
                    {!anaPack ? (
                        <div className="text-sm text-neutral-400">Nessun dato.</div>
                    ) : (
                        <>
                            <Field label="Località">
                                <div className="text-lg font-semibold text-neutral-100">{anaPack.place}</div>
                                {anaPack.title ? <div className="text-sm text-neutral-400 mt-1">{anaPack.title}</div> : null}
                            </Field>

                            <div className="mt-3">
                                {anaMergedSections.length === 0 ? (
                                    <div className="text-sm text-neutral-400">Nessuna sezione trovata.</div>
                                ) : (
                                    <Carousel itemWidthClass="w-[340px] sm:w-[420px] lg:w-[520px]">
                                        {anaMergedSections.map((s) => (
                                            <div key={s.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-neutral-100 truncate">{s.title}</div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <Chip tone="neutral">{(s.items || []).length} voci</Chip>
                                                            {s.notes_live ? <Chip tone="info">note presenti</Chip> : <Chip tone="neutral">nessuna nota</Chip>}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <MiniBtn
                                                            tone="ana"
                                                            title="Aggiungi voce"
                                                            onClick={() =>
                                                                setAnaAddModal({
                                                                    open: true,
                                                                    place: anaPack.place,
                                                                    section_id: String(s.id),
                                                                    section_title: s.title,
                                                                    item_text: "",
                                                                    scope: "global",
                                                                })
                                                            }
                                                        >
                                                            <Plus size={16} /> Voce
                                                        </MiniBtn>

                                                        <MiniBtn
                                                            tone="ana"
                                                            title="Voci (apri)"
                                                            onClick={() =>
                                                                openDetails({
                                                                    title: `Voci — ${anaPack.place} / ${s.title}`,
                                                                    tone: "ana",
                                                                    contentLabel: "Voci",
                                                                    contentText: (s.items || []).length
                                                                        ? (s.items || []).map((x) => `• ${x}`).join("\n")
                                                                        : "Nessuna voce.",
                                                                    kind: "list",
                                                                })
                                                            }
                                                        >
                                                            <List size={16} /> Voci
                                                        </MiniBtn>

                                                        <MiniBtn
                                                            tone="ana"
                                                            title="Note"
                                                            onClick={() =>
                                                                openNoteModal({
                                                                    day,
                                                                    source: "ANA",
                                                                    external_id: String(s.id),
                                                                    title: `${anaPack.place} — ${s.title}`,
                                                                    notes: s.notes_live || "",
                                                                    tone: "ana",
                                                                })
                                                            }
                                                        >
                                                            <StickyNote size={16} /> Note
                                                        </MiniBtn>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </Carousel>
                                )}
                            </div>
                        </>
                    )}
                </Section>
            </div>

            {/* DB: criticità + safety */}
            {data && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {/* ✅ SAFETY BELLUNO — Rubrica + Add */}
                    <Section
                        accent="ops"
                        icon={Users}
                        title="Sala Safety Belluno"
                        right={
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    <Input
                                        value={safetySearch}
                                        onChange={(e) => setSafetySearch(e.target.value)}
                                        placeholder="Cerca operatore / interno / note…"
                                        className="pl-9 w-[260px]"
                                    />
                                </div>

                                <MiniBtn
                                    tone="ops"
                                    title="Aggiungi voce rubrica"
                                    onClick={() =>
                                        setSafetyAddModal({
                                            open: true,
                                            operator: "",
                                            interno: "",
                                            external_dial: "",
                                            responder_group: "",
                                            responder_digit: "",
                                            responder_note: "",
                                        })
                                    }
                                >
                                    <Plus size={16} /> Voce
                                </MiniBtn>
                            </div>
                        }
                    >
                        <div className="mb-3 text-xs text-neutral-400">
                            Numero dall’esterno:{" "}
                            <span className="text-neutral-100 font-semibold">{SAFETY_BELLUNO_EXTERNAL_NUMBER}</span>
                        </div>

                        {safetyMerged.length === 0 ? (
                            <div className="text-sm text-neutral-400">Nessuna voce.</div>
                        ) : (
                            <Carousel itemWidthClass="w-[340px] sm:w-[420px] lg:w-[520px]">
                                {safetyMerged.map((c) => (
                                    <div key={c.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-semibold text-neutral-100 truncate">{c.operator || "—"}</div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <Chip tone="info">interno: {c.interno || "—"}</Chip>
                                                    <Chip tone="neutral">esterno: {c.external_dial || "—"}</Chip>
                                                    <Chip tone="neutral">
                                                        gruppo: {c.responder_group || "—"} {c.responder_digit ? `(${c.responder_digit})` : ""}
                                                    </Chip>
                                                </div>

                                                <div className="mt-3 text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                                    {c.responder_note || "—"}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <MiniBtn
                                                    tone="ops"
                                                    title="Apri dettagli"
                                                    onClick={() =>
                                                        openDetails({
                                                            title: `Rubrica — ${c.operator || "—"}`,
                                                            tone: "ops",
                                                            contentLabel: "Dettagli",
                                                            contentText:
                                                                `Operatore: ${c.operator || "—"}\n` +
                                                                `Interno: ${c.interno || "—"}\n` +
                                                                `Dall’esterno: ${c.external_dial || "—"}\n` +
                                                                `Gruppo risponditore: ${c.responder_group || "—"}\n` +
                                                                `Tasto: ${c.responder_digit || "—"}\n\n` +
                                                                `Nota:\n${c.responder_note || "—"}`,
                                                            kind: "text",
                                                        })
                                                    }
                                                >
                                                    <List size={16} /> Dettagli
                                                </MiniBtn>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        )}
                    </Section>
                </div>
            )}

            {/* MODALE NOTE */}
            <Modal open={noteModal.open} title={`Note — ${noteModal.title || ""}`} onClose={closeNoteModal}>
                <div className="space-y-3">
                    <Field label="Chiave">
                        <div className="text-sm text-neutral-200">
                            <span className="font-semibold">{noteModal.source}</span> • {noteModal.external_id}
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">Giorno: {noteModal.day || "—"}</div>
                    </Field>

                    <form
                        className="space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            const notes = String(fd.get("notes") || "");

                            upsertNote.mutate(
                                { day: noteModal.day, source: noteModal.source, external_id: noteModal.external_id, notes },
                                { onSuccess: closeNoteModal }
                            );
                        }}
                    >
                        <textarea
                            name="notes"
                            defaultValue={noteModal.notes}
                            className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300/15"
                            rows={10}
                            placeholder="Scrivi note…"
                        />

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800/40"
                                onClick={closeNoteModal}
                            >
                                Annulla
                            </button>
                            <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 text-sm hover:opacity-90">
                                Salva note
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* MODALE DETTAGLI (Recapiti / Voci) */}
            <Modal
                open={detailsModal.open}
                title={detailsModal.title}
                onClose={() =>
                    setDetailsModal({ open: false, title: "", tone: "neutral", contentLabel: "", contentText: "", kind: "text" })
                }
            >
                <div className="space-y-3">
                    <DetailsBody label={detailsModal.contentLabel} text={detailsModal.contentText} kind={detailsModal.kind} />

                    <div className="flex justify-end">
                        <MiniBtn
                            tone="neutral"
                            title="Chiudi"
                            onClick={() =>
                                setDetailsModal({ open: false, title: "", tone: "neutral", contentLabel: "", contentText: "", kind: "text" })
                            }
                        >
                            <X size={16} /> Chiudi
                        </MiniBtn>
                    </div>
                </div>
            </Modal>

            {/* MODALE ADD COC */}
            <Modal
                open={cocAddModal.open}
                title="Aggiungi Comune (COC)"
                onClose={() => setCocAddModal({ open: false, name: "", autoOpen: true, ordinance: false })}
            >
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const name = String(fd.get("name") || "").trim();
                        if (!name) return;
                        setCocAddModal((s) => ({ ...s, name }));
                        ensureCocCommune.mutate({ name });
                    }}
                >
                    <Field label="Nome Comune">
                        <input
                            name="name"
                            placeholder="Es: Valle di Cadore"
                            className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                            required
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="rounded-2xl border border-neutral-800 bg-neutral-950/30 px-4 py-3 text-sm text-neutral-200 flex items-center gap-2">
                            <input
                                type="checkbox"
                                defaultChecked={cocAddModal.autoOpen}
                                onChange={(e) => setCocAddModal((s) => ({ ...s, autoOpen: e.target.checked }))}
                            />
                            Auto-apri COC
                        </label>

                        <label className="rounded-2xl border border-neutral-800 bg-neutral-950/30 px-4 py-3 text-sm text-neutral-200 flex items-center gap-2">
                            <input
                                type="checkbox"
                                defaultChecked={cocAddModal.ordinance}
                                onChange={(e) => setCocAddModal((s) => ({ ...s, ordinance: e.target.checked }))}
                            />
                            Imposta ordinanza (sì)
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800/40"
                            onClick={() => setCocAddModal({ open: false, name: "", autoOpen: true, ordinance: false })}
                        >
                            Annulla
                        </button>
                        <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 text-sm hover:opacity-90">
                            Salva Comune
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODALE ANA ADD */}
            <Modal open={anaAddModal.open} title="Aggiungi mezzo / materiale (ANA)" onClose={() => setAnaAddModal((s) => ({ ...s, open: false }))}>
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);

                        const item_text = String(fd.get("item_text") || "").trim();
                        const section_title = String(fd.get("section_title") || "").trim();
                        const scope = String(fd.get("scope") || "global");
                        const dayOrNull = scope === "day" ? day : null;

                        addAnaItem.mutate(
                            {
                                day: dayOrNull,
                                place: anaAddModal.place || anaPlace,
                                section_id: anaAddModal.section_id || null,
                                section_title: section_title || anaAddModal.section_title || null,
                                item_text,
                            },
                            { onSuccess: () => setAnaAddModal((s) => ({ ...s, open: false })) }
                        );
                    }}
                >
                    <Field label="Contesto">
                        <div className="text-sm text-neutral-200">
                            <b>Località:</b> {anaAddModal.place || anaPlace}
                            <div className="text-xs text-neutral-500 mt-1">Sezione: {anaAddModal.section_title || "—"}</div>
                        </div>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                            name="scope"
                            defaultValue={anaAddModal.scope || "global"}
                            className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                        >
                            <option value="global">Globale (sempre)</option>
                            <option value="day">Solo per questo giorno</option>
                        </select>

                        <input
                            name="section_title"
                            defaultValue={anaAddModal.section_title || ""}
                            placeholder="Sezione (lascia così oppure scrivi nuova)"
                            className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                        />
                    </div>

                    <textarea
                        name="item_text"
                        required
                        rows={4}
                        placeholder="Scrivi mezzo/materiale (una voce)"
                        className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                    />

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800/40"
                            onClick={() => setAnaAddModal((s) => ({ ...s, open: false }))}
                        >
                            Annulla
                        </button>
                        <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 text-sm hover:opacity-90">
                            Salva
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODALE ADD RUBRICA SAFETY */}
            <Modal
                open={safetyAddModal.open}
                title="Aggiungi voce — Rubrica Safety Belluno"
                onClose={() => setSafetyAddModal((s) => ({ ...s, open: false }))}
            >
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);

                        const row = {
                            id: `user-${Date.now()}`,
                            operator: String(fd.get("operator") || "").trim(),
                            interno: String(fd.get("interno") || "").trim(),
                            external_dial: String(fd.get("external_dial") || "").trim(),
                            responder_group: String(fd.get("responder_group") || "").trim(),
                            responder_digit: String(fd.get("responder_digit") || "").trim(),
                            responder_note: String(fd.get("responder_note") || "").trim(),
                        };

                        if (!row.operator && !row.interno) return;

                        persistSafetyUser([row, ...(Array.isArray(safetyUser) ? safetyUser : [])]);
                        setSafetyAddModal((s) => ({ ...s, open: false }));
                    }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field label="Operatore">
                            <input
                                name="operator"
                                defaultValue={safetyAddModal.operator}
                                placeholder="Es: Prefettura"
                                className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                            />
                        </Field>

                        <Field label="Nr. interno">
                            <input
                                name="interno"
                                defaultValue={safetyAddModal.interno}
                                placeholder="Es: 201"
                                className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                            />
                        </Field>
                    </div>

                    <Field label="Collegamento dall’esterno">
                        <input
                            name="external_dial"
                            defaultValue={safetyAddModal.external_dial}
                            placeholder={`Es: ${SAFETY_BELLUNO_EXTERNAL_NUMBER} poi 2`}
                            className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field label="Gruppo risponditore">
                            <input
                                name="responder_group"
                                defaultValue={safetyAddModal.responder_group}
                                placeholder="Es: Prefettura"
                                className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                            />
                        </Field>

                        <Field label="Tasto (digit)">
                            <input
                                name="responder_digit"
                                defaultValue={safetyAddModal.responder_digit}
                                placeholder="Es: 2"
                                className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                            />
                        </Field>
                    </div>

                    <Field label="Nota risponditore">
                        <textarea
                            name="responder_note"
                            defaultValue={safetyAddModal.responder_note}
                            rows={4}
                            placeholder="Es: Quando inizia a parlare il risponditore premere 2"
                            className="w-full rounded-2xl bg-neutral-900/80 border border-neutral-800 px-4 py-3 text-sm text-neutral-100"
                        />
                    </Field>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800/40"
                            onClick={() => setSafetyAddModal((s) => ({ ...s, open: false }))}
                        >
                            Annulla
                        </button>
                        <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 text-sm hover:opacity-90">
                            Salva
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
