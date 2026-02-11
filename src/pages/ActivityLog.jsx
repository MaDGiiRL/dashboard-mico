// src/pages/ActivityLog.jsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export default function ActivityLog() {
    const [day, setDay] = useState("");
    const [section, setSection] = useState("");
    const [limit, setLimit] = useState(100);

    const q = useQuery({
        queryKey: ["activityLogs", day, section, limit],
        queryFn: () => api.activityLogs({ day: day || undefined, section: section || undefined, limit }),
    });

    const rows = q.data?.rows || [];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end sm:justify-between">
                <div>
                    <div className="text-neutral-400 text-sm">Audit</div>
                    <h1 className="text-2xl font-semibold text-neutral-100">Activity Log</h1>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <input
                        type="date"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100"
                    />

                    <select
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100"
                    >
                        <option value="">Tutte le sezioni</option>
                        <option value="notes">notes</option>
                        <option value="ana">ana</option>
                        <option value="coc">coc</option>
                        <option value="issues">issues</option>
                    </select>

                    <input
                        type="number"
                        min={1}
                        max={200}
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="w-[110px] rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm text-neutral-100"
                    />
                </div>
            </div>

            {q.isLoading ? <div className="text-neutral-400">Caricamento…</div> : null}
            {q.error ? <div className="text-red-400">{q.error.message}</div> : null}

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 overflow-hidden">
                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-950/60 border-b border-neutral-800">
                            <tr className="text-neutral-400">
                                <th className="text-left p-3">Quando</th>
                                <th className="text-left p-3">Sezione</th>
                                <th className="text-left p-3">Azione</th>
                                <th className="text-left p-3">Actor</th>
                                <th className="text-left p-3">Oggetto</th>
                                <th className="text-left p-3">Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-b border-neutral-900/60 hover:bg-neutral-900/30">
                                    <td className="p-3 text-neutral-200 whitespace-nowrap">
                                        {new Date(r.occurred_at).toLocaleString()}
                                    </td>
                                    <td className="p-3 text-neutral-200">{r.section}</td>
                                    <td className="p-3 text-neutral-200">{r.action}</td>
                                    <td className="p-3 text-neutral-200">{r.actor_email || r.actor_name || "—"}</td>
                                    <td className="p-3 text-neutral-200">
                                        <div className="text-xs text-neutral-400">{r.entity_type}</div>
                                        <div className="text-xs text-neutral-300 break-all">{r.entity_id}</div>
                                    </td>
                                    <td className="p-3 text-neutral-200">{r.summary || "—"}</td>
                                </tr>
                            ))}
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-4 text-neutral-400">
                                        Nessun log.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
