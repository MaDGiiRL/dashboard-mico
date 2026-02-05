// src/pages/Dashboard.jsx
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

import Card from "../components/Card.jsx";
import Modal from "../components/Modal.jsx";
import CardHeader from "../components/CardHeader.jsx";
import RowActions from "../components/RowActions.jsx";

import { b1RacesForDay } from "../data/b1_calendar_2026.js";
import { opsAppointmentsForDay } from "../data/ops_calendar_2026.js";

import {
    CalendarDays,
    MapPinned,
    Building2,
    Users,
    AlertTriangle,
    CloudSun,
    Boxes,
} from "lucide-react";

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeRangeRace(r) {
    const s = new Date(r.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const e = r.ends_at ? new Date(r.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null;
    return e ? `${s}–${e}` : s;
}

export default function Dashboard() {
    const auth = useAuth();
    const { canWrite } = auth;

    const qc = useQueryClient();
    const [day, setDay] = useState(todayISO());

    const dash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });

    const communes = useQuery({
        queryKey: ["coc_communes"],
        queryFn: () => api.list("coc_communes"),
    });

    const vehicles = useQuery({
        queryKey: ["vehicles"],
        queryFn: () => api.list("vehicles"),
    });

    const data = dash.data;

    const create = useMutation({
        mutationFn: ({ table, payload }) => api.create(table, payload),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            await qc.invalidateQueries();
        },
    });

    const update = useMutation({
        mutationFn: ({ table, id, patch }) => api.update(table, id, patch),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            await qc.invalidateQueries();
        },
    });

    const remove = useMutation({
        mutationFn: ({ table, id }) => api.remove(table, id),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            await qc.invalidateQueries();
        },
    });

    const [modal, setModal] = useState({ open: false, type: null, mode: "create", row: null, ctx: {} });
    const openCreate = (type, ctx = {}) => setModal({ open: true, type, mode: "create", row: null, ctx });
    const openEdit = (type, row, ctx = {}) => setModal({ open: true, type, mode: "edit", row, ctx });
    const close = () => setModal({ open: false, type: null, mode: "create", row: null, ctx: {} });

    const communeOptions = communes.data?.rows || [];
    const vehicleOptions = vehicles.data?.rows || [];

    // Gare: B1 + DB
    const b1Races = b1RacesForDay(day);
    const dbRaces = data?.races || [];
    const allRaces = [...b1Races, ...dbRaces];

    // Appuntamenti: OPS + DB
    const opsAppts = opsAppointmentsForDay(day);
    const dbAppts = data?.appointments || [];
    const allAppts = [...opsAppts, ...dbAppts];

    const racesCount = allRaces.length;
    const appointmentsCount = allAppts.length;
    const safetyCount = data?.safetyRoom?.length ?? 0;
    const issuesCount = data?.issuesOpen?.length ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                <div>
                    <div className="text-neutral-400 text-sm">Resoconto giornaliero</div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>

                    {/* DEBUG */}
                    <div className="mt-1 text-xs text-neutral-500">
                        role: {auth.role || "none"} • canWrite: {String(canWrite)} • modal.open: {String(modal.open)} • type:{" "}
                        {String(modal.type)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
                    />

                    <button
                        type="button"
                        className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800"
                        onClick={() => openCreate("race")}
                    >
                        TEST MODALE
                    </button>
                </div>
            </div>

            {dash.isLoading && <div className="text-neutral-400">Caricamento…</div>}
            {dash.error && <div className="text-red-400">{dash.error.message}</div>}

            {data && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Kpi icon={MapPinned} title="Gare" value={racesCount} />
                        <Kpi icon={CalendarDays} title="Appuntamenti" value={appointmentsCount} />
                        <Kpi icon={Users} title="Safety room" value={safetyCount} />
                        <Kpi icon={AlertTriangle} title="Criticità aperte" value={issuesCount} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Gare */}
                        <Card>
                            <CardHeader
                                icon={MapPinned}
                                title="Gare previste (B1 + inserite)"
                                canAdd={canWrite}
                                onAdd={() => openCreate("race")}
                                addLabel="Aggiungi gara"
                            />

                            <List
                                items={allRaces}
                                render={(r) => (
                                    <Row
                                        left={
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium">{r.name}</div>
                                                    {r.source === "B1" ? (
                                                        <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-200">
                                                            B1
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="text-neutral-400 text-sm">
                                                    {r.source === "B1"
                                                        ? `${timeRangeRace(r)} • ${r.venue || "-"}`
                                                        : `${new Date(r.starts_at).toLocaleString()} • ${r.venue || "-"}`}
                                                </div>

                                                {r.notes ? <div className="text-sm mt-1">{r.notes}</div> : null}
                                            </>
                                        }
                                        actions={
                                            r.readonly ? null : (
                                                <RowActions
                                                    canWrite={canWrite}
                                                    onEdit={() => openEdit("race", r)}
                                                    onDelete={() => remove.mutate({ table: "races", id: r.id })}
                                                />
                                            )
                                        }
                                    />
                                )}
                            />
                        </Card>

                        {/* COC */}
                        <Card>
                            <CardHeader
                                icon={Building2}
                                title="Apertura / Chiusura COC"
                                canAdd={canWrite}
                                onAdd={() => openCreate("coc")}
                                addLabel="Aggiungi stato COC"
                            />
                            <List
                                items={data.coc}
                                render={(c) => (
                                    <Row
                                        left={
                                            <>
                                                <div className="font-medium">{c.commune_name}</div>
                                                <div className="text-neutral-400 text-sm">
                                                    Apertura: {c.opened_at ? new Date(c.opened_at).toLocaleTimeString() : "-"} • Chiusura:{" "}
                                                    {c.closed_at ? new Date(c.closed_at).toLocaleTimeString() : "-"} • Sala: {c.room_phone || "-"}
                                                </div>
                                                {c.notes && <div className="text-sm mt-1">{c.notes}</div>}
                                            </>
                                        }
                                        actions={
                                            <RowActions
                                                canWrite={canWrite}
                                                onEdit={() => openEdit("coc", c)}
                                                onDelete={() => remove.mutate({ table: "coc_status", id: c.id })}
                                            />
                                        }
                                    />
                                )}
                            />
                        </Card>

                        {/* Appuntamenti */}
                        <Card>
                            <CardHeader
                                icon={CalendarDays}
                                title="Appuntamenti previsti (OPS + inseriti)"
                                canAdd={canWrite}
                                onAdd={() => openCreate("appointment")}
                                addLabel="Aggiungi appuntamento"
                            />
                            <List
                                items={allAppts}
                                render={(a) => (
                                    <Row
                                        left={
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-medium">{a.title}</div>
                                                    {a.source === "OPS" ? (
                                                        <span className="text-xs rounded-full border border-neutral-700 px-2 py-0.5 text-neutral-200">
                                                            OPS
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div className="text-neutral-400 text-sm">
                                                    {new Date(a.starts_at).toLocaleString()} • {a.location || "-"}
                                                </div>

                                                {a.notes ? <div className="text-sm mt-1">{a.notes}</div> : null}
                                            </>
                                        }
                                        actions={
                                            a.readonly ? null : (
                                                <RowActions
                                                    canWrite={canWrite}
                                                    onEdit={() => openEdit("appointment", a)}
                                                    onDelete={() => remove.mutate({ table: "appointments", id: a.id })}
                                                />
                                            )
                                        }
                                    />
                                )}
                            />
                        </Card>

                        {/* Safety */}
                        <Card>
                            <CardHeader
                                icon={Users}
                                title="Sala Safety Belluno (presenti + recapito)"
                                canAdd={canWrite}
                                onAdd={() => openCreate("safety")}
                                addLabel="Aggiungi presenza"
                            />
                            <List
                                items={data.safetyRoom}
                                render={(p) => (
                                    <Row
                                        left={
                                            <>
                                                <div className="font-medium">{p.person_name}</div>
                                                <div className="text-neutral-400 text-sm">
                                                    {p.role_text || "-"} • {p.phone || "-"}
                                                </div>
                                                {p.notes && <div className="text-sm mt-1">{p.notes}</div>}
                                            </>
                                        }
                                        actions={
                                            <RowActions
                                                canWrite={canWrite}
                                                onEdit={() => openEdit("safety", p)}
                                                onDelete={() => remove.mutate({ table: "safety_room_presence", id: p.id })}
                                            />
                                        }
                                    />
                                )}
                            />
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader icon={CloudSun} title="Bollettino meteo" canAdd={canWrite} onAdd={() => openCreate("weather")} addLabel="Aggiungi bollettino" />
                            <List
                                items={data.weather}
                                render={(w) => (
                                    <Row
                                        left={
                                            <div className="min-w-0">
                                                <div className="font-medium">{w.source || "Fonte non specificata"}</div>
                                                <div className="text-neutral-300 text-sm whitespace-pre-wrap break-words">{w.content}</div>
                                            </div>
                                        }
                                        actions={
                                            <RowActions
                                                canWrite={canWrite}
                                                onEdit={() => openEdit("weather", w)}
                                                onDelete={() => remove.mutate({ table: "weather_bulletins", id: w.id })}
                                            />
                                        }
                                    />
                                )}
                            />
                        </Card>

                        <Card>
                            <CardHeader icon={AlertTriangle} title="Criticità" canAdd={canWrite} onAdd={() => openCreate("issue")} addLabel="Aggiungi criticità" />
                            <List
                                items={data.issuesOpen}
                                render={(i) => (
                                    <Row
                                        left={
                                            <>
                                                <div className="font-medium">{i.title}</div>
                                                <div className="text-neutral-400 text-sm">
                                                    {i.severity} • {i.status} • {i.owner || "-"}
                                                </div>
                                            </>
                                        }
                                        actions={
                                            <RowActions
                                                canWrite={canWrite}
                                                onEdit={() => openEdit("issue", i)}
                                                onDelete={() => remove.mutate({ table: "issues", id: i.id })}
                                            />
                                        }
                                    />
                                )}
                            />
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader icon={Boxes} title="Materiali / Note operative" canAdd={canWrite} onAdd={() => openCreate("ops_note")} addLabel="Aggiungi nota operativa" />
                            <div className="text-sm text-neutral-400">Placeholder: se vuoi davvero note operative, aggiungiamo tabella + form.</div>
                        </Card>
                    </div>
                </>
            )}

            {/* MODALE CRUD */}
            <Modal open={modal.open} title={modalTitle(modal)} onClose={close}>
                <CrudForm
                    modal={modal}
                    day={day}
                    canWrite={canWrite}
                    communeOptions={communeOptions}
                    vehicleOptions={vehicleOptions}
                    onCreate={(table, payload) => create.mutate({ table, payload }, { onSuccess: close })}
                    onUpdate={(table, id, patch) => update.mutate({ table, id, patch }, { onSuccess: close })}
                />
            </Modal>
        </div>
    );
}

/* ------------------ UI ------------------ */

function Kpi({ icon: Icon, title, value }) {
    return (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-400">
                {Icon ? <Icon size={16} /> : null}
                <span>{title}</span>
            </div>
            <div className="text-2xl font-semibold">{value}</div>
        </div>
    );
}

function List({ items, render }) {
    return (
        <div className="space-y-2">
            {(items || []).map((x) => (
                <div key={x.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                    {render(x)}
                </div>
            ))}
            {(items || []).length === 0 && <div className="text-neutral-400 text-sm">Nessun dato.</div>}
        </div>
    );
}

function Row({ left, actions }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">{left}</div>
            <div className="shrink-0">{actions}</div>
        </div>
    );
}

/* ------------------ MODAL TITLE + CRUD FORMS ------------------ */

function modalTitle(modal) {
    const m = modal.mode === "edit" ? "Modifica" : "Aggiungi";
    const map = {
        race: "Gara",
        appointment: "Appuntamento",
        safety: "Presenza Safety",
        coc: "Stato COC",
        weather: "Bollettino meteo",
        issue: "Criticità",
        ops_note: "Nota operativa",
        vehicle_out: "Mezzo fuori",
    };
    return `${m} ${map[modal.type] || ""}`.trim();
}

// CrudForm: lasciato minimale come nel tuo snippet (qui solo race).
function CrudForm({ modal, day, canWrite, communeOptions, vehicleOptions, onCreate, onUpdate }) {
    if (!modal.open) return null;
    if (!canWrite) return <div className="text-neutral-400">Solo admin/editor possono modificare.</div>;

    const row = modal.row || {};
    const submit = (e, table, payloadBuilder) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const payload = payloadBuilder(fd);
        if (modal.mode === "edit") onUpdate(table, row.id, payload);
        else onCreate(table, payload);
    };

    const dtLocal = (iso) => (iso ? String(iso).slice(0, 16) : "");

    switch (modal.type) {
        case "race":
            return (
                <form
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm"
                    onSubmit={(e) =>
                        submit(e, "races", (fd) => ({
                            day,
                            name: String(fd.get("name")),
                            sport: String(fd.get("sport") || ""),
                            venue: String(fd.get("venue") || ""),
                            starts_at: new Date(String(fd.get("starts_at"))).toISOString(),
                            ends_at: fd.get("ends_at") ? new Date(String(fd.get("ends_at"))).toISOString() : null,
                            notes: String(fd.get("notes") || ""),
                        }))
                    }
                >
                    <input name="name" defaultValue={row.name || ""} placeholder="Nome gara" required className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                    <input name="sport" defaultValue={row.sport || ""} placeholder="Sport" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                    <input name="venue" defaultValue={row.venue || ""} placeholder="Venue / luogo" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-2" />
                    <input name="starts_at" type="datetime-local" defaultValue={dtLocal(row.starts_at)} required className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                    <input name="ends_at" type="datetime-local" defaultValue={dtLocal(row.ends_at)} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                    <textarea name="notes" defaultValue={row.notes || ""} placeholder="Note" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-2" rows={3} />
                    <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 sm:col-span-2">{modal.mode === "edit" ? "Salva" : "Aggiungi"}</button>
                </form>
            );

        default:
            return <div className="text-neutral-400">Form non disponibile.</div>;
    }
}
