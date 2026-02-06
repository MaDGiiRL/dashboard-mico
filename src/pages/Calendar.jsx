// src/pages/Calendar.jsx
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import Card from "../components/Card.jsx";
import Modal from "../components/Modal.jsx";
import { StickyNote } from "lucide-react";

import { b1RaceCount, b1RacesForDay, b1SpecialsForDay } from "../data/b1_calendar_2026.js";
import { opsAppointmentsForDay, opsCount } from "../data/ops_calendar_2026.js";

/* ------------------ helpers ------------------ */

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

function Pill({ dotClass, children }) {
    return (
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950/40 px-3 py-1.5 text-xs text-neutral-200">
            <span className={`h-2 w-2 rounded-full ${dotClass}`} />
            {children}
        </span>
    );
}

function IconBtn({ onClick, children, title }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-2 hover:bg-neutral-900 transition"
        >
            {children}
        </button>
    );
}

function MiniBtn({ onClick, title, children, disabled, variant = "soft" }) {
    const cls =
        variant === "primary"
            ? "border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 to-sky-500/10 hover:from-cyan-500/30 hover:to-sky-500/20"
            : "border-neutral-800 bg-neutral-950/30 hover:bg-neutral-900/60";

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={`rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50 ${cls}`}
        >
            {children}
        </button>
    );
}

/** Section card “glass” con barra colorata + header */
function Section({ accent = "neutral", title, subtitle, children }) {
    const styles =
        accent === "ops"
            ? {
                wrap: "border-cyan-500/25 bg-gradient-to-b from-cyan-500/10 via-neutral-950/40 to-neutral-950/20",
                bar: "bg-gradient-to-r from-cyan-300 to-sky-400",
                title: "text-cyan-50",
                sub: "text-cyan-200/70",
            }
            : accent === "b1"
                ? {
                    wrap: "border-violet-500/25 bg-gradient-to-b from-violet-500/10 via-neutral-950/40 to-neutral-950/20",
                    bar: "bg-gradient-to-r from-violet-400 to-fuchsia-400",
                    title: "text-violet-50",
                    sub: "text-violet-200/70",
                }
                : {
                    wrap: "border-neutral-800 bg-neutral-950/30",
                    bar: "bg-neutral-700",
                    title: "text-neutral-100",
                    sub: "text-neutral-400",
                };

    return (
        <div className={`rounded-2xl border overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03)] ${styles.wrap}`}>
            <div className="border-b border-neutral-800/70 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className={`h-9 w-1.5 rounded-full ${styles.bar}`} />
                    <div className="min-w-0">
                        <div className={`text-lg font-semibold truncate ${styles.title}`}>{title}</div>
                        {subtitle ? <div className={`text-xs mt-0.5 ${styles.sub}`}>{subtitle}</div> : null}
                    </div>
                </div>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

/* ------------------ page ------------------ */

export default function Calendar() {
    const auth = useAuth();
    const { canWrite } = auth;

    const qc = useQueryClient();
    const [cursor, setCursor] = useState(() => new Date());
    const [openDay, setOpenDay] = useState(null);

    const [noteModal, setNoteModal] = useState({
        open: false,
        day: null,
        source: "OPS",
        external_id: null,
        title: "",
        notes: "",
    });

    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7)); // lunedì

    const days = useMemo(
        () =>
            Array.from({ length: 42 }, (_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                return d;
            }),
        [start.getTime()]
    );

    const qDay = useQuery({
        queryKey: ["dashboardDay", openDay],
        queryFn: () => api.dashboardDay(openDay),
        enabled: !!openDay,
    });

    const upsertNote = useMutation({
        mutationFn: ({ day, source, external_id, notes }) => api.upsertAppointmentNote({ day, source, external_id, notes }),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboardDay", openDay] });
        },
    });

    const b1R = useMemo(() => (openDay ? b1RacesForDay(openDay) : []), [openDay]);
    const b1S = useMemo(() => (openDay ? b1SpecialsForDay(openDay) : []), [openDay]);
    const opsRaw = useMemo(() => (openDay ? opsAppointmentsForDay(openDay) : []), [openDay]);

    const notesMap = useMemo(() => {
        const m = new Map();
        for (const n of qDay.data?.appointmentNotes || []) m.set(`${n.source}:${n.external_id}`, n.notes || "");
        return m;
    }, [qDay.data?.appointmentNotes]);

    const opsA = useMemo(() => {
        return opsRaw.map((a) => ({
            ...a,
            source: "OPS",
            notes: notesMap.get(`OPS:${a.external_id}`) || a.notes || "",
        }));
    }, [opsRaw, notesMap]);

    const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                    <div className="text-neutral-400 text-sm">Calendario operativo</div>
                    <h1 className="text-2xl font-semibold">{monthLabel}</h1>

                    <div className="mt-3 flex flex-wrap gap-2">
                        <Pill dotClass="bg-violet-400">B1</Pill>
                        <Pill dotClass="bg-cyan-400">OPS</Pill>
                    </div>
                </div>

                <div className="flex gap-2">
                    <IconBtn
                        title="Mese precedente"
                        onClick={() => {
                            const d = new Date(cursor);
                            d.setMonth(d.getMonth() - 1);
                            setCursor(d);
                        }}
                    >
                        ◀
                    </IconBtn>
                    <IconBtn
                        title="Mese successivo"
                        onClick={() => {
                            const d = new Date(cursor);
                            d.setMonth(d.getMonth() + 1);
                            setCursor(d);
                        }}
                    >
                        ▶
                    </IconBtn>
                </div>
            </div>

            {/* Month grid */}
            <Card title="Mese (click su un giorno)">
                <div className="grid grid-cols-7 gap-2 text-sm">
                    {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((x) => (
                        <div key={x} className="text-neutral-500 px-2 text-xs uppercase tracking-wide">
                            {x}
                        </div>
                    ))}

                    {days.map((d) => {
                        const inMonth = d.getMonth() === cursor.getMonth();
                        const day = ymd(d);
                        const b1Count = b1RaceCount(day);
                        const opsN = opsCount(day);

                        const base =
                            "group rounded-2xl border px-3 py-3 text-left relative transition " +
                            "shadow-[0_0_0_1px_rgba(255,255,255,0.02)] " +
                            "hover:-translate-y-[1px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]";

                        const skin = inMonth
                            ? "border-neutral-800 bg-gradient-to-b from-neutral-950/50 to-neutral-950/20 hover:bg-neutral-900/40"
                            : "border-neutral-900 bg-neutral-950/10 text-neutral-500 opacity-75 hover:opacity-100";

                        return (
                            <button key={day} className={`${base} ${skin}`} onClick={() => setOpenDay(day)}>
                                {/* glow line */}
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition" />

                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-semibold">{d.getDate()}</div>

                                    <div className="flex items-center gap-1">
                                        {b1Count > 0 ? (
                                            <span className="text-[11px] rounded-full border border-violet-400/25 bg-violet-500/10 px-2 py-0.5 text-violet-100">
                                                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-violet-400 align-middle" />
                                                {b1Count}
                                            </span>
                                        ) : null}
                                        {opsN > 0 ? (
                                            <span className="text-[11px] rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">
                                                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400 align-middle" />
                                                {opsN}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="text-neutral-500 text-xs mt-2 group-hover:text-neutral-300 transition">Apri dettaglio</div>
                            </button>
                        );
                    })}
                </div>
            </Card>

            {/* Day detail modal */}
            <Modal open={!!openDay} title={openDay ? `Dettaglio giorno ${openDay}` : "Dettaglio"} onClose={() => setOpenDay(null)}>
                {qDay.isLoading && <div className="text-neutral-400">Caricamento…</div>}
                {qDay.error && <div className="text-red-400">{qDay.error.message}</div>}

                {qDay.data && (
                    <div className="space-y-4">
                        {/* OPS */}
                        <Section accent="ops" title="Appuntamenti OPS" subtitle="Programmato + note salvate in DB">
                            <div className="space-y-2 text-sm">
                                {opsA.map((a) => (
                                    <div
                                        key={a.id}
                                        className="rounded-2xl border border-neutral-800/70 bg-neutral-950/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-semibold text-neutral-100">{a.title}</div>
                                                    <span className="text-[11px] rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-cyan-100">
                                                        OPS
                                                    </span>
                                                </div>
                                                <div className="text-neutral-400 mt-0.5">
                                                    {timeRange(a.starts_at, a.ends_at)} • {a.location || "-"}
                                                </div>

                                                {a.notes ? (
                                                    <div className="mt-2 rounded-xl border border-neutral-800 bg-neutral-950/50 p-3">
                                                        <div className="text-xs text-neutral-400 mb-1">Note</div>
                                                        <div className="text-neutral-200 whitespace-pre-wrap">{a.notes}</div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <MiniBtn
                                                disabled={!canWrite}
                                                variant="primary"
                                                title="Aggiungi/Modifica note"
                                                onClick={() =>
                                                    setNoteModal({
                                                        open: true,
                                                        day: openDay,
                                                        source: "OPS",
                                                        external_id: a.external_id,
                                                        title: a.title,
                                                        notes: a.notes || "",
                                                    })
                                                }
                                            >
                                                <span className="inline-flex items-center gap-2">
                                                    <StickyNote size={16} /> Note
                                                </span>
                                            </MiniBtn>
                                        </div>
                                    </div>
                                ))}
                                {opsA.length === 0 && <div className="text-neutral-400">Nessun appuntamento OPS.</div>}
                            </div>
                        </Section>

                        {/* DB appointments */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 overflow-hidden">
                            <div className="border-b border-neutral-800 px-5 py-4">
                                <div className="text-lg font-semibold text-neutral-100">Appuntamenti inseriti (DB)</div>
                                <div className="text-xs text-neutral-500 mt-0.5">Quelli creati manualmente nel sistema</div>
                            </div>
                            <div className="p-5 space-y-2 text-sm">
                                {qDay.data.appointments.map((a) => (
                                    <div key={a.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                                        <div className="font-semibold text-neutral-100">{a.title}</div>
                                        <div className="text-neutral-400 mt-0.5">
                                            {new Date(a.starts_at).toLocaleString()} • {a.location || "-"}
                                        </div>
                                        {a.notes ? <div className="mt-2 text-neutral-200 whitespace-pre-wrap">{a.notes}</div> : null}
                                    </div>
                                ))}
                                {qDay.data.appointments.length === 0 && <div className="text-neutral-400">Nessun appuntamento inserito.</div>}
                            </div>
                        </div>

                        {/* B1 */}
                        {(b1S.length > 0 || b1R.length > 0) && (
                            <Section accent="b1" title="Programma B1" subtitle="Ufficiale (solo lettura)">
                                <div className="space-y-2 text-sm">
                                    {b1S.map((s) => (
                                        <div key={s.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                                            <div className="font-semibold text-neutral-100">{s.title}</div>
                                            <div className="text-neutral-400 mt-0.5">{timeRange(s.starts_at, s.ends_at)}</div>
                                        </div>
                                    ))}

                                    {b1R.map((r) => (
                                        <div key={r.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                                            <div className="font-semibold text-neutral-100">{r.name}</div>
                                            <div className="text-neutral-400 mt-0.5">
                                                {timeRange(r.starts_at, r.ends_at)} • {r.venue || "-"}
                                            </div>
                                            {r.notes ? <div className="mt-2 text-neutral-200 whitespace-pre-wrap">{r.notes}</div> : null}
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}
                    </div>
                )}
            </Modal>

            {/* Note modal (più bella) */}
            <Modal
                open={noteModal.open}
                title=""
                onClose={() => setNoteModal({ open: false, day: null, source: "OPS", external_id: null, title: "", notes: "" })}
            >
                <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-cyan-500/10 via-neutral-950/40 to-neutral-950/20 overflow-hidden">
                    <div className="border-b border-neutral-800 px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-xs text-cyan-200/70">Note appuntamento OPS</div>
                                <div className="text-lg font-semibold text-neutral-100 truncate">{noteModal.title || "—"}</div>
                                <div className="text-xs text-neutral-500 mt-1">
                                    key: {noteModal.source} • {noteModal.external_id}
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-2xl border border-neutral-800 bg-neutral-950/50 grid place-items-center">
                                <StickyNote size={18} className="text-cyan-100" />
                            </div>
                        </div>
                    </div>

                    <form
                        className="p-5 space-y-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            const notes = String(fd.get("notes") || "");
                            upsertNote.mutate(
                                {
                                    day: noteModal.day,
                                    source: noteModal.source,
                                    external_id: noteModal.external_id,
                                    notes,
                                },
                                {
                                    onSuccess: () => {
                                        setNoteModal({ open: false, day: null, source: "OPS", external_id: null, title: "", notes: "" });
                                    },
                                }
                            );
                        }}
                    >
                        <textarea
                            name="notes"
                            defaultValue={noteModal.notes}
                            className="w-full rounded-2xl bg-neutral-950/60 border border-neutral-800 px-4 py-3 text-sm leading-relaxed text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                            rows={10}
                            placeholder="Scrivi note operative…"
                        />

                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => setNoteModal({ open: false, day: null, source: "OPS", external_id: null, title: "", notes: "" })}
                                className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-900 transition"
                            >
                                Annulla
                            </button>

                            <button
                                type="submit"
                                className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-950 bg-gradient-to-r from-cyan-300 to-sky-400 hover:opacity-95 transition"
                            >
                                Salva note
                            </button>
                        </div>

                        {upsertNote.isError ? (
                            <div className="text-sm text-red-300">
                                Errore salvataggio: {String(upsertNote.error?.message || upsertNote.error)}
                            </div>
                        ) : null}
                    </form>
                </div>
            </Modal>
        </div>
    );
}
