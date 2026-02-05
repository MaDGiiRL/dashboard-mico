// src/pages/Gare.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import Card from "../components/Card.jsx";
import MapDay from "../components/MapDay.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { b1RacesForDay } from "../data/b1_calendar_2026.js";

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

function timeRange(r) {
    const s = new Date(r.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = r.ends_at
        ? new Date(r.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null;
    return e ? `${s}–${e}` : s;
}

export default function Gare() {
    const [day, setDay] = useState(todayISO());
    const q = useQuery({ queryKey: ["dashboardDay", day], queryFn: () => api.dashboardDay(day) });

    const b1 = b1RacesForDay(day);
    const db = q.data?.races || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <div className="text-neutral-400 text-sm">Gare + percorsi</div>
                    <h1 className="text-2xl font-semibold">Gare</h1>
                </div>
                <input
                    type="date"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
                />
            </div>

            {q.data && (
                <>
                    <MapDay features={q.data.mapFeatures} />

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <Card title="Lista gare del giorno (B1 + inserite)">
                            <div className="space-y-2 text-sm">
                                {/* B1 */}
                                {b1.map((r) => (
                                    <div key={r.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-medium">{r.name}</div>
                                            <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-300">
                                                B1
                                            </span>
                                        </div>
                                        <div className="text-neutral-400">
                                            {timeRange(r)} • {r.venue || "-"}
                                        </div>
                                        {r.notes ? <div className="mt-1 text-neutral-300">{r.notes}</div> : null}
                                    </div>
                                ))}

                                {/* DB */}
                                {db.map((r) => (
                                    <div key={r.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                        <div className="font-medium">{r.name}</div>
                                        <div className="text-neutral-400">
                                            {new Date(r.starts_at).toLocaleString()} • {r.venue || "-"}
                                        </div>
                                    </div>
                                ))}

                                {b1.length === 0 && db.length === 0 && (
                                    <div className="text-neutral-400">Nessuna gara (B1 o inserita).</div>
                                )}
                            </div>
                        </Card>

                        <Card title="Percorsi / Feature mappa (GeoJSON)">
                            <div className="text-sm text-neutral-400">
                                Le feature arrivano da <code>map_features</code>. Puoi gestirle via endpoint generico:
                                <div className="mt-2 rounded-xl bg-neutral-900 border border-neutral-800 p-3">
                                    POST/GET <code>/api/map_features</code>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <LogPanel section="races" day={day} />
                </>
            )}
        </div>
    );
}
