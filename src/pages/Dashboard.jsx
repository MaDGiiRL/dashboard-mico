// src/pages/Dashboard.jsx
import React, { useMemo, useRef, useState } from "react";
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
    CloudSun,
    StickyNote,
    Plus,
    DoorOpen,
    DoorClosed,
    Search,
    ChevronLeft,
    ChevronRight,
    FileCheck2,
    Phone,
    List,
    X,
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

function Stat({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2">
            <div className="text-neutral-400 text-xs">{label}</div>
            <div className="text-neutral-100 font-semibold">{value}</div>
            {hint ? <div className="text-neutral-500 text-xs">{hint}</div> : null}
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
                : accent === "meteo"
                    ? {
                        wrap: "border-emerald-500/25 bg-gradient-to-b from-emerald-500/12 via-neutral-950/35 to-neutral-950/20",
                        bar: "bg-gradient-to-b from-emerald-300 to-lime-300",
                        icon: "text-emerald-50",
                        title: "text-emerald-50",
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

/* ------------------ grab carousel (drag + touch) ------------------ */

function useGrabScroll() {
    const ref = useRef(null);
    const state = useRef({ down: false, x: 0, left: 0, moved: false });

    const isInteractiveTarget = (el) => {
        if (!el) return false;
        // se clicchi su elementi “cliccabili”, non bloccare MAI il click
        const interactive = el.closest?.("button,a,input,textarea,select,label,[role='button']");
        return Boolean(interactive);
    };

    const onPointerDown = (e) => {
        const el = ref.current;
        if (!el) return;

        // se stai cliccando un bottone/link dentro la card, non attivare il drag
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
        if (Math.abs(dx) > 10) state.current.moved = true; // soglia più alta per evitare falsi “drag”

        el.scrollLeft = state.current.left - dx;
    };

    const onPointerUp = (e) => {
        const el = ref.current;
        if (!el) return;

        state.current.down = false;
        el.releasePointerCapture?.(e.pointerId);
    };

    // evita click “accidentale” SOLO se hai davvero trascinato
    const onClickCapture = (e) => {
        // se stai cliccando un bottone/link dentro la card, non bloccare mai
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
            {/* ✅ tolte TUTTE le frecce */}

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
                {/* hide scrollbar (webkit) */}
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


/* ------------------ meteo (Open-Meteo) ------------------ */

const LOCS = [
    { id: "milano", name: "Milano", lat: 45.4643, lon: 9.1895 },
    { id: "cortina", name: "Cortina d’Ampezzo", lat: 46.5381, lon: 12.1372 },
];

function wmoToText(code) {
    const map = {
        0: "Sereno",
        1: "Prevalentemente sereno",
        2: "Parzialmente nuvoloso",
        3: "Coperto",
        45: "Nebbia",
        48: "Nebbia con brina",
        51: "Pioviggine debole",
        53: "Pioviggine moderata",
        55: "Pioviggine intensa",
        61: "Pioggia debole",
        63: "Pioggia moderata",
        65: "Pioggia forte",
        71: "Neve debole",
        73: "Neve moderata",
        75: "Neve forte",
        77: "Granuli di neve",
        80: "Rovesci deboli",
        81: "Rovesci moderati",
        82: "Rovesci forti",
        85: "Rovesci di neve deboli",
        86: "Rovesci di neve forti",
        95: "Temporale",
        96: "Temporale con grandine",
        99: "Temporale con grandine forte",
    };
    return map[code] ?? `Codice meteo: ${code}`;
}

function WeatherIcon({ code, className = "h-8 w-8" }) {
    const base = "text-neutral-100";
    const isClear = code === 0;
    const isFog = code === 45 || code === 48;
    const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isThunder = [95, 96, 99].includes(code);

    if (isClear) {
        return (
            <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                    d="M12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        );
    }

    if (isFog) {
        return (
            <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none">
                <path d="M4 9h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 13h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    if (isThunder) {
        return (
            <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none">
                <path
                    d="M7 15a5 5 0 0 1 .5-10A6 6 0 0 1 20 9a4 4 0 0 1-3 6H7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path d="M12 13l-2 4h3l-1 5 4-7h-3l1-2" fill="currentColor" />
            </svg>
        );
    }

    if (isSnow) {
        return (
            <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none">
                <path
                    d="M7 14a5 5 0 0 1 .5-10A6 6 0 0 1 20 8.5a4 4 0 0 1-3 5.5H7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path d="M9 17h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M12 19h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M15 17h0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
        );
    }

    if (isRain) {
        return (
            <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none">
                <path
                    d="M7 14a5 5 0 0 1 .5-10A6 6 0 0 1 20 8.5a4 4 0 0 1-3 5.5H7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <path d="M9 18l-1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M13 18l-1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 18l-1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    return (
        <svg className={`${className} ${base}`} viewBox="0 0 24 24" fill="none">
            <path
                d="M7 15a5 5 0 0 1 .5-10A6 6 0 0 1 20 9a4 4 0 0 1-3 6H7Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function findClosestHourlyIndex(times = [], targetISO) {
    if (!times.length || !targetISO) return -1;
    const t = new Date(targetISO).getTime();
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < times.length; i++) {
        const ti = new Date(times[i]).getTime();
        const d = Math.abs(ti - t);
        if (d < bestDiff) {
            bestDiff = d;
            best = i;
        }
    }
    return best;
}

async function fetchOpenMeteoBundle(lat, lon) {
    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true` +
        `&hourly=apparent_temperature,precipitation,snowfall` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum` +
        `&timezone=Europe/Rome`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
    return res.json();
}

function formatMaybe(n, suffix = "") {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
    const x = Number(n);
    const s = Math.abs(x) >= 10 ? x.toFixed(0) : x.toFixed(1);
    return `${s}${suffix}`;
}

/* ------------------ page ------------------ */

export default function Dashboard() {
    const auth = useAuth();
    const qc = useQueryClient();
    const [day, setDay] = useState(todayISO());

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

    // meteo
    const realtime = useQuery({
        queryKey: ["realtime_weather", "milano_cortina"],
        queryFn: async () => {
            const entries = await Promise.all(
                LOCS.map(async (l) => {
                    const json = await fetchOpenMeteoBundle(l.lat, l.lon);
                    const current = json.current_weather;
                    const h = json.hourly || {};
                    const d = json.daily || {};
                    const i = findClosestHourlyIndex(h.time || [], current?.time);

                    const apparent = i >= 0 ? h.apparent_temperature?.[i] : null;
                    const precipMM = i >= 0 ? h.precipitation?.[i] : null;
                    const snowCM = i >= 0 ? h.snowfall?.[i] : null;

                    const tMax = d.temperature_2m_max?.[0] ?? null;
                    const tMin = d.temperature_2m_min?.[0] ?? null;
                    const precipDay = d.precipitation_sum?.[0] ?? null;
                    const snowDay = d.snowfall_sum?.[0] ?? null;

                    return [
                        l.id,
                        {
                            current,
                            derived: { apparent, precipMM, snowCM, tMax, tMin, precipDay, snowDay },
                        },
                    ];
                })
            );
            return Object.fromEntries(entries);
        },
        refetchInterval: 5 * 60 * 1000,
        staleTime: 60 * 1000,
        retry: 1,
    });

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

    const openDetails = ({ title, tone, contentLabel, contentText }) =>
        setDetailsModal({ open: true, title, tone: tone || "neutral", contentLabel, contentText });

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

            {/* METEO */}
            <Section accent="meteo" icon={CloudSun} title="Meteo live (Milano + Cortina)">
                {realtime.isLoading && <div className="text-sm text-neutral-400">Carico meteo…</div>}
                {realtime.isError && (
                    <div className="text-sm text-red-300">
                        Errore meteo: {String(realtime.error?.message || realtime.error)}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {LOCS.map((l) => {
                        const pack = realtime.data?.[l.id];
                        const w = pack?.current;
                        const d = pack?.derived;

                        return (
                            <div key={l.id} className="rounded-2xl border border-neutral-800/70 bg-neutral-950/40 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-neutral-100">{l.name}</div>
                                        <div className="text-neutral-400 text-xs mt-0.5">Aggiornato: {w?.time || "—"}</div>
                                    </div>
                                    <div className="h-10 w-10 rounded-2xl border border-neutral-800 bg-neutral-950/50 grid place-items-center">
                                        <WeatherIcon code={w?.weathercode} />
                                    </div>
                                </div>

                                {!w ? (
                                    <div className="mt-3 text-neutral-400">Nessun dato.</div>
                                ) : (
                                    <div className="mt-3 space-y-3">
                                        <div className="text-neutral-300">
                                            Condizioni:{" "}
                                            <span className="text-neutral-100 font-medium">{wmoToText(w.weathercode)}</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Stat label="Temp" value={formatMaybe(w.temperature, "°C")} />
                                            <Stat label="Percepita" value={formatMaybe(d?.apparent, "°C")} />
                                            <Stat label="Precip (ora)" value={formatMaybe(d?.precipMM, " mm")} hint="~ora corrente" />
                                            <Stat label="Neve (ora)" value={formatMaybe(d?.snowCM, " cm")} hint="~ora corrente" />
                                            <Stat label="Oggi min/max" value={`${formatMaybe(d?.tMin, "°")} / ${formatMaybe(d?.tMax, "°")}`} />
                                            <Stat label="Oggi accumulo" value={`${formatMaybe(d?.precipDay, " mm")} • ${formatMaybe(d?.snowDay, " cm")}`} hint="pioggia • neve" />
                                        </div>

                                        <div className="text-neutral-400 text-xs">
                                            Vento: {formatMaybe(w.windspeed, " km/h")} • {formatMaybe(w.winddirection, "°")}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* B1 + OPS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
            </div>

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
                    title="Mezzi / Materiali ANA"
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
                                                                    contentText: (s.items || []).length ? (s.items || []).map((x) => `• ${x}`).join("\n") : "Nessuna voce.",
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
                    {/* <Section accent="danger" icon={AlertTriangle} title="Criticità (DB)">
                        {(data.issuesOpen || []).length === 0 ? (
                            <div className="text-sm text-neutral-400">Nessuna criticità.</div>
                        ) : (
                            <Carousel itemWidthClass="w-[340px] sm:w-[420px] lg:w-[520px]">
                                {(data.issuesOpen || []).map((i) => (
                                    <div key={i.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/35 p-4">
                                        <div className="font-semibold text-neutral-100">{i.title}</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Chip tone="bad">{i.severity}</Chip>
                                            <Chip tone="neutral">{i.status}</Chip>
                                            {i.owner ? <Chip tone="info">owner: {i.owner}</Chip> : null}
                                        </div>
                                        {i.notes ? (
                                            <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/20 p-3 text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                                {i.notes}
                                            </div>
                                        ) : (
                                            <div className="mt-3 text-xs text-neutral-500">Nessuna nota.</div>
                                        )}
                                    </div>
                                ))}
                            </Carousel>
                        )}
                    </Section> */}

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
                onClose={() => setDetailsModal({ open: false, title: "", tone: "neutral", contentLabel: "", contentText: "" })}
            >
                <div className="space-y-3">
                    <Field label={detailsModal.contentLabel || "Dettagli"}>
                        <pre className="whitespace-pre-wrap text-sm text-neutral-200 leading-relaxed font-sans">
                            {detailsModal.contentText || "—"}
                        </pre>
                    </Field>

                    <div className="flex justify-end">
                        <MiniBtn
                            tone="neutral"
                            title="Chiudi"
                            onClick={() => setDetailsModal({ open: false, title: "", tone: "neutral", contentLabel: "", contentText: "" })}
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
                            <input type="checkbox" defaultChecked={cocAddModal.autoOpen} onChange={(e) => setCocAddModal((s) => ({ ...s, autoOpen: e.target.checked }))} />
                            Auto-apri COC
                        </label>

                        <label className="rounded-2xl border border-neutral-800 bg-neutral-950/30 px-4 py-3 text-sm text-neutral-200 flex items-center gap-2">
                            <input type="checkbox" defaultChecked={cocAddModal.ordinance} onChange={(e) => setCocAddModal((s) => ({ ...s, ordinance: e.target.checked }))} />
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

                        // minimale: richiedi almeno operatore o interno
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
