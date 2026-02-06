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

export default function Mappa() {
    const [day, setDay] = useState(todayISO());
    const q = useQuery({ queryKey: ["dashboardDay", day], queryFn: () => api.dashboardDay(day) });

    const b1 = b1RacesForDay(day);
    const db = q.data?.races || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-semibold">Mappa</h1>
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
                </>
            )}
        </div>
    );
}
