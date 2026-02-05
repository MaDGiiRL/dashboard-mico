// src/pages/Calendar.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import Card from "../components/Card.jsx";
import Modal from "../components/Modal.jsx";

import { b1RaceCount, b1RacesForDay, b1SpecialsForDay } from "../data/b1_calendar_2026.js";
import { opsAppointmentsForDay, opsCount } from "../data/ops_calendar_2026.js";

function ymd(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function timeRange(isoStart, isoEnd) {
    const s = new Date(isoStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = isoEnd ? new Date(isoEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
    return e ? `${s}–${e}` : s;
}

export default function Calendar() {
    const [cursor, setCursor] = useState(() => new Date());
    const [openDay, setOpenDay] = useState(null);

    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // lunedì

    const days = Array.from({ length: 42 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });

    const qDay = useQuery({
        queryKey: ["dashboardDay", openDay],
        queryFn: () => api.dashboardDay(openDay),
        enabled: !!openDay,
    });

    const b1R = openDay ? b1RacesForDay(openDay) : [];
    const b1S = openDay ? b1SpecialsForDay(openDay) : [];
    const opsA = openDay ? opsAppointmentsForDay(openDay) : [];

    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between gap-3">
                <div>
                    <div className="text-neutral-400 text-sm">Calendario operativo</div>
                    <h1 className="text-2xl font-semibold">{cursor.toLocaleString(undefined, { month: "long", year: "numeric" })}</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        className="rounded-xl bg-neutral-800 px-3 py-2 hover:bg-neutral-700"
                        onClick={() => {
                            const d = new Date(cursor);
                            d.setMonth(d.getMonth() - 1);
                            setCursor(d);
                        }}
                    >
                        ◀
                    </button>
                    <button
                        className="rounded-xl bg-neutral-800 px-3 py-2 hover:bg-neutral-700"
                        onClick={() => {
                            const d = new Date(cursor);
                            d.setMonth(d.getMonth() + 1);
                            setCursor(d);
                        }}
                    >
                        ▶
                    </button>
                </div>
            </div>

            <Card title="Mese (click su un giorno)">
                <div className="grid grid-cols-7 gap-2 text-sm">
                    {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((x) => (
                        <div key={x} className="text-neutral-400 px-2">
                            {x}
                        </div>
                    ))}

                    {days.map((d) => {
                        const inMonth = d.getMonth() === cursor.getMonth();
                        const day = ymd(d);
                        const b1Count = b1RaceCount(day);
                        const opsN = opsCount(day);

                        return (
                            <button
                                key={day}
                                className={
                                    "rounded-2xl border px-3 py-3 text-left hover:bg-neutral-800 relative " +
                                    (inMonth ? "border-neutral-800 bg-neutral-950/30" : "border-neutral-900 bg-neutral-950/10 text-neutral-500")
                                }
                                onClick={() => setOpenDay(day)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-semibold">{d.getDate()}</div>

                                    <div className="flex items-center gap-1">
                                        {b1Count > 0 ? (
                                            <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-200">
                                                B1 {b1Count}
                                            </span>
                                        ) : null}

                                        {opsN > 0 ? (
                                            <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-200">
                                                OPS {opsN}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="text-neutral-400 text-xs mt-1">Apri dettaglio</div>
                            </button>
                        );
                    })}
                </div>
            </Card>

            <Modal open={!!openDay} title={openDay ? `Dettaglio giorno ${openDay}` : "Dettaglio"} onClose={() => setOpenDay(null)}>
                {qDay.isLoading && <div className="text-neutral-400">Caricamento…</div>}
                {qDay.error && <div className="text-red-400">{qDay.error.message}</div>}

                {qDay.data && (
                    <div className="space-y-4">
                        {/* riepilogo "sensato" */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4 text-sm">
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-neutral-300">
                                <div>
                                    <span className="text-neutral-400">Gare inserite:</span> {qDay.data.races.length}
                                </div>
                                <div>
                                    <span className="text-neutral-400">Gare B1:</span> {b1R.length}
                                </div>
                                <div>
                                    <span className="text-neutral-400">Appuntamenti inseriti:</span> {qDay.data.appointments.length}
                                </div>
                                <div>
                                    <span className="text-neutral-400">Appuntamenti OPS:</span> {opsA.length}
                                </div>
                                <div>
                                    <span className="text-neutral-400">COC:</span> {qDay.data.coc.length}
                                </div>
                                <div>
                                    <span className="text-neutral-400">Criticità aperte:</span> {qDay.data.issuesOpen.length}
                                </div>
                            </div>
                        </div>

                        {/* OPS */}
                        <Card title="Appuntamenti OPS (solo lettura)">
                            <div className="space-y-2 text-sm">
                                {opsA.map((a) => (
                                    <div key={a.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="font-medium">{a.title}</div>
                                            <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-200">OPS</span>
                                        </div>
                                        <div className="text-neutral-400">
                                            {timeRange(a.starts_at, a.ends_at)} • {a.location || "-"}
                                        </div>
                                        {a.notes ? <div className="mt-1 text-neutral-300">{a.notes}</div> : null}
                                    </div>
                                ))}
                                {opsA.length === 0 && <div className="text-neutral-400">Nessun appuntamento OPS.</div>}
                            </div>
                        </Card>

                        {/* Appuntamenti inseriti */}
                        <Card title="Appuntamenti inseriti (DB)">
                            <div className="space-y-2 text-sm">
                                {qDay.data.appointments.map((a) => (
                                    <div key={a.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                        <div className="font-medium">{a.title}</div>
                                        <div className="text-neutral-400">
                                            {new Date(a.starts_at).toLocaleString()} • {a.location || "-"}
                                        </div>
                                        {a.notes ? <div className="mt-1 text-neutral-300">{a.notes}</div> : null}
                                    </div>
                                ))}
                                {qDay.data.appointments.length === 0 && <div className="text-neutral-400">Nessun appuntamento inserito.</div>}
                            </div>
                        </Card>

                        {/* B1 */}
                        {(b1S.length > 0 || b1R.length > 0) && (
                            <Card title="Programma B1 (ufficiale)">
                                <div className="space-y-2 text-sm">
                                    {b1S.map((s) => (
                                        <div key={s.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium">{s.title}</div>
                                                <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-200">B1</span>
                                            </div>
                                            <div className="text-neutral-400">{timeRange(s.starts_at, s.ends_at)}</div>
                                        </div>
                                    ))}

                                    {b1R.map((r) => (
                                        <div key={r.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium">{r.name}</div>
                                                <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-200">B1</span>
                                            </div>
                                            <div className="text-neutral-400">
                                                {timeRange(r.starts_at, r.ends_at)} • {r.venue || "-"}
                                            </div>
                                            {r.notes ? <div className="mt-1 text-neutral-300">{r.notes}</div> : null}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
