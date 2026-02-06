// src/pages/Meteo.jsx
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../components/Card.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { CloudSun } from "lucide-react";

/* ------------------ helpers ------------------ */

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

/** Sezione colorata (versione locale, stile Dashboard) */
function Section({ accent = "neutral", title, icon: Icon, right, children }) {
    const styles =
        accent === "meteo"
            ? {
                wrap: "border-emerald-500/25 bg-gradient-to-b from-emerald-500/12 via-neutral-950/35 to-neutral-950/20",
                bar: "bg-gradient-to-b from-emerald-300 to-lime-300",
                icon: "text-emerald-50",
                title: "text-emerald-50",
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

/** Icone semplici inline SVG (niente dipendenze) */
function WeatherIcon({ code, className = "h-9 w-9" }) {
    const isClear = code === 0;
    const isCloudy = code === 1 || code === 2 || code === 3;
    const isFog = code === 45 || code === 48;
    const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isThunder = [95, 96, 99].includes(code);

    const base = "text-neutral-100";

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

    return (
        <div className={`${className} ${base} flex items-center justify-center text-xs`}>
            {code}
        </div>
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

function Segmented({ value, onChange, options }) {
    return (
        <div className="inline-flex rounded-xl border border-neutral-800 bg-neutral-950/40 p-1 text-sm">
            {options.map((o) => {
                const active = o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => onChange(o.value)}
                        className={[
                            "px-3 py-1.5 rounded-lg transition",
                            active ? "bg-neutral-100 text-neutral-950" : "text-neutral-300 hover:bg-neutral-900",
                        ].join(" ")}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function formatMaybe(n, suffix = "") {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
    const x = Number(n);
    const s = Math.abs(x) >= 10 ? x.toFixed(0) : x.toFixed(1);
    return `${s}${suffix}`;
}

/* ------------------ page ------------------ */

export default function Meteo() {
    const { canWrite } = useAuth();
    const qc = useQueryClient();

    const [scope, setScope] = useState("both"); // both | milano | cortina

    const visibleLocs = useMemo(() => {
        if (scope === "milano") return [LOCS[0]];
        if (scope === "cortina") return [LOCS[1]];
        return LOCS;
    }, [scope]);

    // --- realtime meteo (bundle) ---
    const realtime = useQuery({
        queryKey: ["realtime_weather", "milano_cortina", scope],
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

    // --- tuoi bollettini (backend) ---
    const q = useQuery({
        queryKey: ["weather_bulletins"],
        queryFn: () => api.list("weather_bulletins"),
    });

    const create = useMutation({
        mutationFn: (payload) => api.create("weather_bulletins", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["weather_bulletins"] }),
    });

    return (
        <div className="space-y-6">
            <div>
                <div className="text-neutral-400 text-sm">Bollettini</div>
                <h1 className="text-2xl font-semibold text-neutral-100">Meteo</h1>
            </div>

            {/* ✅ METEO IN TEMPO REALE (colorato come Dashboard) */}
            <Section
                accent="meteo"
                icon={CloudSun}
                title="Meteo in tempo reale (Milano + Cortina)"
                right={
                    <Segmented
                        value={scope}
                        onChange={setScope}
                        options={[
                            { value: "both", label: "Entrambe" },
                            { value: "milano", label: "Milano" },
                            { value: "cortina", label: "Cortina" },
                        ]}
                    />
                }
            >
                {realtime.isLoading && <div className="text-sm text-neutral-400">Carico meteo…</div>}
                {realtime.isError && (
                    <div className="text-sm text-red-300">
                        Errore meteo: {String(realtime.error?.message || realtime.error)}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {visibleLocs.map((l) => {
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
                                        <WeatherIcon code={w?.weathercode} className="h-8 w-8" />
                                    </div>
                                </div>

                                {!w ? (
                                    <div className="mt-3 text-neutral-400">Nessun dato.</div>
                                ) : (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <div className="col-span-2 text-neutral-300">
                                            Condizioni:{" "}
                                            <span className="text-neutral-100 font-medium">{wmoToText(w.weathercode)}</span>
                                        </div>

                                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2">
                                            <div className="text-neutral-400 text-xs">Temp</div>
                                            <div className="text-neutral-100 font-semibold text-lg">{formatMaybe(w.temperature, "°C")}</div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2">
                                            <div className="text-neutral-400 text-xs">Percepita</div>
                                            <div className="text-neutral-100 font-semibold text-lg">{formatMaybe(d?.apparent, "°C")}</div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2">
                                            <div className="text-neutral-400 text-xs">Precip (ora)</div>
                                            <div className="text-neutral-100 font-medium">{formatMaybe(d?.precipMM, " mm")}</div>
                                            <div className="text-neutral-500 text-xs">~ora corrente</div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2">
                                            <div className="text-neutral-400 text-xs">Neve (ora)</div>
                                            <div className="text-neutral-100 font-medium">{formatMaybe(d?.snowCM, " cm")}</div>
                                            <div className="text-neutral-500 text-xs">~ora corrente</div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2">
                                            <div className="text-neutral-400 text-xs">Oggi min/max</div>
                                            <div className="text-neutral-100 font-medium">
                                                {formatMaybe(d?.tMin, "°")} / {formatMaybe(d?.tMax, "°")}
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2">
                                            <div className="text-neutral-400 text-xs">Oggi accumulo</div>
                                            <div className="text-neutral-100 font-medium">
                                                {formatMaybe(d?.precipDay, " mm")} • {formatMaybe(d?.snowDay, " cm")}
                                            </div>
                                            <div className="text-neutral-500 text-xs">pioggia • neve</div>
                                        </div>

                                        <div className="col-span-2 text-neutral-400 text-xs">
                                            Vento: {formatMaybe(w.windspeed, " km/h")} • {formatMaybe(w.winddirection, "°")}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Section>

            {/* Se vuoi tenere altre Card neutrali sotto, puoi farlo */}
            {/* Esempio: storici / log / bollettini */}

            {/* LogPanel resta importato se lo userai, altrimenti rimuovi import */}
            {/* <LogPanel /> */}
        </div>
    );
}
