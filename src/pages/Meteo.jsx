// src/pages/Meteo.jsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import RadarArpaEmbed from "../components/RadarArpaEmbed.jsx";
import { useAuth } from "../lib/auth.jsx";
import { CloudSun, ExternalLink, FileText, RefreshCw, AlertTriangle } from "lucide-react";

/* ------------------ helpers ------------------ */

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

/* premium tokens (stesso stile Dashboard) */
const UI = {
    card: cx("rounded-3xl overflow-hidden", "bg-white/55 backdrop-blur-md", "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"),
    accent: "h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500",
    softRing: "ring-1 ring-white/45",
    dim: "text-neutral-600",
    dim2: "text-neutral-500",
};

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

function Btn({ href, onClick, children, title }) {
    const Comp = href ? "a" : "button";
    const props = href
        ? { href, target: "_blank", rel: "noreferrer" }
        : { type: "button", onClick };

    return (
        <Comp
            {...props}
            title={title}
            className={cx(
                "rounded-2xl px-3 py-2 text-sm transition inline-flex items-center gap-2",
                "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm",
                "ring-1 ring-white/45",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15"
            )}
        >
            {children}
        </Comp>
    );
}

function Tabs({ value, onChange, tabs }) {
    return (
        <div className={cx(UI.card, UI.softRing, "p-1 inline-flex gap-1 bg-white/45")}>
            {tabs.map((t) => {
                const active = t.value === value;
                return (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => onChange(t.value)}
                        className={cx(
                            "px-4 py-2 rounded-2xl text-sm font-extrabold transition whitespace-nowrap",
                            active
                                ? "bg-neutral-900 text-white shadow-sm ring-1 ring-black/10"
                                : "text-neutral-700 hover:bg-white/55 ring-1 ring-transparent"
                        )}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

function Segmented({ value, onChange, options }) {
    return (
        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-white/55 ring-1 ring-white/45 p-1 text-sm">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={cx(
                            "px-3 py-1.5 rounded-2xl transition whitespace-nowrap font-extrabold text-xs",
                            active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-white/60"
                        )}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function Section({ title, icon: Icon, right, children }) {
    return (
        <div className={cx(UI.card, UI.softRing)}>
            <div className={UI.accent} />

            <div className="px-5 py-4 bg-white/55 border-b border-black/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex items-center gap-3">
                        {Icon ? (
                            <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                                <Icon size={18} className="text-neutral-800" />
                            </div>
                        ) : null}
                        <div className="min-w-0">
                            <div className="text-lg font-extrabold text-neutral-900 truncate">{title}</div>
                            <div className={cx("text-xs mt-0.5", UI.dim2)}>Centro meteo operativo</div>
                        </div>
                    </div>

                    {right ? <div className="shrink-0">{right}</div> : null}
                </div>
            </div>

            <div className="p-5 bg-white/40">{children}</div>
        </div>
    );
}

/* ------------------ CFD iframe ------------------ */

const CFD_URL = "https://www.regione.veneto.it/web/protezione-civile/cfd";

/**
 * Iframe con:
 * - loading overlay
 * - fallback UI se sembra bloccato (timeout)
 * NB: se il sito blocca l'embed via X-Frame-Options/CSP, l'iframe resta vuoto.
 */
function CfDPageEmbed({ src = CFD_URL, height = 760 }) {
    const [loaded, setLoaded] = useState(false);
    const [suspectBlocked, setSuspectBlocked] = useState(false);
    const tRef = useRef(null);

    useEffect(() => {
        setLoaded(false);
        setSuspectBlocked(false);

        tRef.current = window.setTimeout(() => setSuspectBlocked(true), 6000);

        return () => {
            if (tRef.current) window.clearTimeout(tRef.current);
            tRef.current = null;
        };
    }, [src]);

    function handleLoad() {
        setLoaded(true);
        setSuspectBlocked(false);
        if (tRef.current) window.clearTimeout(tRef.current);
        tRef.current = null;
    }

    return (
        <div className="rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm">
            <div className="relative" style={{ height }}>
                {!loaded ? (
                    <div className="absolute inset-0 grid place-items-center">
                        <div className="text-sm text-neutral-600 flex items-center gap-2">
                            <RefreshCw size={16} className="animate-spin" />
                            Caricamento pagina CFD…
                        </div>
                    </div>
                ) : null}

                <iframe title="CFD Regione Veneto" src={src} onLoad={handleLoad} className="absolute inset-0 h-full w-full" />

                {suspectBlocked && !loaded ? (
                    <div className="absolute inset-0 p-4">
                        <div className="h-full rounded-3xl ring-1 ring-rose-500/20 bg-rose-500/10 p-4">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={18} className="mt-0.5 text-rose-700" />
                                <div>
                                    <div className="text-sm font-extrabold text-rose-900">Embed bloccato o pagina non caricabile</div>
                                    <div className="text-sm text-rose-900/80 mt-1">Apri la pagina CFD in una nuova scheda.</div>
                                    <div className="mt-3">
                                        <Btn href={src} title="Apri pagina CFD">
                                            <ExternalLink size={16} />
                                            Apri pagina CFD
                                        </Btn>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

/* ------------------ meteo realtime (Open-Meteo) ------------------ */

const LOCS = [
    { id: "cortina", name: "Cortina d’Ampezzo", lat: 46.5381, lon: 12.1372 },
    { id: "verona", name: "Verona", lat: 45.4384, lon: 10.9916 },
    { id: "anterselva", name: "Anterselva", lat: 46.8809, lon: 12.1119 },
    { id: "val_di_fiemme", name: "Val di Fiemme", lat: 46.2908, lon: 11.6176 },
    { id: "bormio", name: "Bormio", lat: 46.4689, lon: 10.3723 },
    { id: "livigno", name: "Livigno", lat: 46.5386, lon: 10.1336 },
    { id: "milano", name: "Milano", lat: 45.4643, lon: 9.1895 },
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

function WeatherIcon({ code, className = "h-9 w-9" }) {
    const isClear = code === 0;
    const isCloudy = code === 1 || code === 2 || code === 3;
    const isFog = code === 45 || code === 48;
    const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isThunder = [95, 96, 99].includes(code);

    const base = "text-neutral-900";

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

    if (isCloudy) {
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

    return <div className={`${className} ${base} flex items-center justify-center text-xs`}>{code}</div>;
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

export default function Meteo() {
    useAuth();

    const [tab, setTab] = useState("bollettini");
    const [scope, setScope] = useState("all");

    const visibleLocs = useMemo(() => (scope === "all" ? LOCS : LOCS.filter((l) => l.id === scope)), [scope]);

    const realtime = useQuery({
        queryKey: ["realtime_weather", "italy_multi", scope],
        queryFn: async () => {
            const entries = await Promise.all(
                visibleLocs.map(async (l) => {
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

    const scopeOptions = useMemo(() => [{ value: "all", label: "Tutte" }, ...LOCS.map((l) => ({ value: l.id, label: l.name }))], []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className="p-6 bg-white/45 relative overflow-hidden">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-xs font-extrabold tracking-wide text-neutral-600">CENTRO METEO</div>
                                <Tag tone="emerald">OPERATIVO</Tag>
                            </div>
                            <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">Meteo</h1>
                            <div className={cx("mt-2 text-xs", UI.dim2)}>Bollettini • Radar • Realtime</div>
                        </div>

                        <Tabs
                            value={tab}
                            onChange={setTab}
                            tabs={[
                                { value: "bollettini", label: "📄 Bollettini" },
                                { value: "radar", label: "🌧 Radar" },
                                { value: "meteo", label: "☀️ Realtime" },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* TAB: BOLLETTINI */}
            {tab === "bollettini" && (
                <Section
                    icon={FileText}
                    title="Bollettini (CFD Regione Veneto)"
                    right={
                        <Btn href={CFD_URL} title="Apri CFD">
                            <ExternalLink size={16} />
                            Apri CFD
                        </Btn>
                    }
                >
                    <CfDPageEmbed src={CFD_URL} height={900} />
                </Section>
            )}

            {/* TAB: RADAR */}
            {tab === "radar" && (
                <Section icon={CloudSun} title="Radar precipitazioni (ARPAV)">
                    <div className="rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45">
                        <RadarArpaEmbed />
                    </div>
                </Section>
            )}

            {/* TAB: METEO REALTIME */}
            {tab === "meteo" && (
                <Section
                    icon={CloudSun}
                    title="Meteo in tempo reale"
                    right={<Segmented value={scope} onChange={setScope} options={scopeOptions} />}
                >
                    {realtime.isLoading && <div className="text-sm text-neutral-600">Carico meteo…</div>}
                    {realtime.isError && (
                        <div className="text-sm text-rose-700">Errore meteo: {String(realtime.error?.message || realtime.error)}</div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {visibleLocs.map((l) => {
                            const pack = realtime.data?.[l.id];
                            const w = pack?.current;
                            const d = pack?.derived;

                            return (
                                <div key={l.id} className="rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm">
                                    <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
                                    <div className="p-5 bg-white/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-extrabold text-neutral-900">{l.name}</div>
                                                <div className="text-neutral-500 text-xs mt-0.5">Aggiornato: {w?.time || "—"}</div>
                                            </div>

                                            <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                                                <WeatherIcon code={w?.weathercode} className="h-8 w-8" />
                                            </div>
                                        </div>

                                        {!w ? (
                                            <div className="mt-3 text-neutral-600">Nessun dato.</div>
                                        ) : (
                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                <div className="col-span-2 text-neutral-700">
                                                    Condizioni: <span className="text-neutral-900 font-semibold">{wmoToText(w.weathercode)}</span>
                                                </div>

                                                <div className="rounded-2xl bg-white/55 ring-1 ring-white/45 p-3">
                                                    <div className="text-neutral-500 text-xs font-extrabold tracking-wide">TEMP</div>
                                                    <div className="text-neutral-900 font-extrabold text-2xl mt-0.5">{formatMaybe(w.temperature, "°C")}</div>
                                                </div>

                                                <div className="rounded-2xl bg-white/55 ring-1 ring-white/45 p-3">
                                                    <div className="text-neutral-500 text-xs font-extrabold tracking-wide">PERCEPITA</div>
                                                    <div className="text-neutral-900 font-extrabold text-2xl mt-0.5">{formatMaybe(d?.apparent, "°C")}</div>
                                                </div>

                                                <div className="rounded-2xl bg-white/55 ring-1 ring-white/45 p-3">
                                                    <div className="text-neutral-500 text-xs font-extrabold tracking-wide">PRECIP (ORA)</div>
                                                    <div className="text-neutral-900 font-extrabold mt-0.5">{formatMaybe(d?.precipMM, " mm")}</div>
                                                </div>

                                                <div className="rounded-2xl bg-white/55 ring-1 ring-white/45 p-3">
                                                    <div className="text-neutral-500 text-xs font-extrabold tracking-wide">NEVE (ORA)</div>
                                                    <div className="text-neutral-900 font-extrabold mt-0.5">{formatMaybe(d?.snowCM, " cm")}</div>
                                                </div>

                                                <div className="rounded-2xl bg-white/55 ring-1 ring-white/45 p-3">
                                                    <div className="text-neutral-500 text-xs font-extrabold tracking-wide">OGGI MIN/MAX</div>
                                                    <div className="text-neutral-900 font-extrabold mt-0.5">
                                                        {formatMaybe(d?.tMin, "°")} / {formatMaybe(d?.tMax, "°")}
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl bg-white/55 ring-1 ring-white/45 p-3">
                                                    <div className="text-neutral-500 text-xs font-extrabold tracking-wide">OGGI ACCUMULO</div>
                                                    <div className="text-neutral-900 font-extrabold mt-0.5">
                                                        {formatMaybe(d?.precipDay, " mm")} • {formatMaybe(d?.snowDay, " cm")}
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-neutral-600 text-xs">
                                                    Vento: {formatMaybe(w.windspeed, " km/h")} • {formatMaybe(w.winddirection, "°")}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}
        </div>
    );
}
