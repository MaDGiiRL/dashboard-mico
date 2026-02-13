// src/pages/AnaInventory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { api } from "../lib/api.js";

import Modal from "../components/Modal.jsx";
import { anaAssetsForPlace, anaPlaces } from "../data/ana_assets_2026.js";

import {
    Boxes,
    Search,
    Plus,
    StickyNote,
    List,
    X,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

/* ---------------- SweetAlert helpers ---------------- */
function toastOk(title = "Salvato") {
    return Swal.fire({
        icon: "success",
        title,
        toast: true,
        position: "top-end",
        timer: 1600,
        showConfirmButton: false,
    });
}
function toastErr(err, title = "Errore") {
    const msg =
        err?.data?.error ||
        err?.message ||
        (typeof err === "string" ? err : "") ||
        "Errore sconosciuto";
    return Swal.fire({ icon: "error", title, text: msg, confirmButtonText: "Ok" });
}
async function confirmDanger(text = "Sei sicuro?") {
    const res = await Swal.fire({
        icon: "warning",
        title: "Conferma",
        text,
        showCancelButton: true,
        confirmButtonText: "Sì, elimina",
        cancelButtonText: "Annulla",
        confirmButtonColor: "#e11d48",
    });
    return res.isConfirmed;
}

/* ------------------ helpers ------------------ */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}
function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function splitContactLines(text) {
    return String(text || "")
        .split(/\r?\n+/)
        .map((x) => x.trim())
        .filter(Boolean);
}
function fmtTs(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleString([], {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* ------------------ UI tokens ------------------ */
const UI = {
    card: cx(
        "rounded-3xl overflow-hidden",
        "bg-white/55 backdrop-blur-md",
        "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"
    ),
    softRing: "ring-1 ring-white/45",
    accent: "h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500",
    dim: "text-neutral-600",
    dim2: "text-neutral-500",
    input:
        "w-full rounded-2xl px-4 py-3 text-sm outline-none " +
        "bg-white/75 text-neutral-900 placeholder:text-neutral-400 " +
        "shadow-sm ring-1 ring-white/45 " +
        "focus:ring-4 focus:ring-indigo-500/15",
};

function Input({ className, ...props }) {
    return <input {...props} className={cx(UI.input, className)} />;
}

function MiniBtn({ onClick, title, children, disabled, tone = "neutral", type = "button" }) {
    const tones = {
        neutral: "bg-white/55 hover:bg-white/70 text-neutral-900 ring-white/45",
        indigo: "bg-indigo-500/12 hover:bg-indigo-500/16 text-indigo-950 ring-indigo-500/18",
        emerald: "bg-emerald-500/12 hover:bg-emerald-500/16 text-emerald-950 ring-emerald-500/18",
        amber: "bg-amber-500/14 hover:bg-amber-500/18 text-amber-950 ring-amber-500/18",
        rose: "bg-rose-500/12 hover:bg-rose-500/16 text-rose-950 ring-rose-500/18",
    };
    const t = tones[tone] || tones.neutral;

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={cx(
                "rounded-2xl px-3 py-2 text-sm transition disabled:opacity-50 flex items-center gap-2",
                "shadow-sm ring-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                t
            )}
        >
            {children}
        </button>
    );
}

function Chip({ children, tone = "neutral" }) {
    const tones = {
        neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
        indigo: "bg-indigo-500/10 text-indigo-900 ring-1 ring-indigo-500/15",
        emerald: "bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/15",
        amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
        sky: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
    };
    return (
        <span className={cx("text-[11px] rounded-full px-2.5 py-1 font-extrabold tracking-wide", tones[tone] || tones.neutral)}>
            {children}
        </span>
    );
}

function Tag({ tone = "neutral", children }) {
    const tones = {
        neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
        sky: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
        emerald: "bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/15",
    };
    return (
        <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide", tones[tone] || tones.neutral)}>
            {children}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
            <div className="text-[11px] uppercase tracking-wide font-extrabold text-neutral-500">{label}</div>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function DetailsBody({ label, text }) {
    const t = String(text || "").trim();
    if (!t) {
        return (
            <Field label={label || "Dettagli"}>
                <div className={cx("text-sm", UI.dim)}>—</div>
            </Field>
        );
    }

    const lines = splitContactLines(t)
        .map((l) => l.replace(/^[-•*]\s*/, "").trim())
        .filter(Boolean);

    return (
        <Field label={label || "Elenco"}>
            <ul className="space-y-2">
                {lines.map((l, i) => (
                    <li key={i} className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4 text-sm text-neutral-900">
                        {l}
                    </li>
                ))}
            </ul>
        </Field>
    );
}

/* ------------------ pagination helpers ------------------ */
function paginate(items, page, perPage) {
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const p = clamp(page, 1, pages);
    const start = (p - 1) * perPage;
    const slice = items.slice(start, start + perPage);
    return { slice, total, pages, page: p };
}

function Pager({ page, pages, total, perPage, onPage }) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-neutral-600 font-extrabold">
                {total ? (
                    <>
                        Totale: <span className="text-neutral-900">{total}</span> • pagina{" "}
                        <span className="text-neutral-900">{page}</span>/<span className="text-neutral-900">{pages}</span> •{" "}
                        <span className="text-neutral-900">{perPage}</span> per pagina
                    </>
                ) : (
                    "Nessun risultato"
                )}
            </div>

            <div className="flex items-center gap-2">
                <MiniBtn tone="neutral" title="Precedente" disabled={page <= 1} onClick={() => onPage(page - 1)}>
                    <ChevronLeft size={16} /> Prev
                </MiniBtn>
                <MiniBtn tone="neutral" title="Successiva" disabled={page >= pages} onClick={() => onPage(page + 1)}>
                    Next <ChevronRight size={16} />
                </MiniBtn>
            </div>
        </div>
    );
}

/* ------------------ page ------------------ */
export default function AnaInventory() {
    const qc = useQueryClient();
    const [day, setDay] = useState(todayISO());

    const dash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });
    const data = dash.data;

    const [anaPlace, setAnaPlace] = useState(() => anaPlaces()[0] || "San Vito di Cadore");
    const anaPack = useMemo(() => anaAssetsForPlace(anaPlace), [anaPlace]);

    const [anaSearch, setAnaSearch] = useState("");

    // details modal (solo view)
    const [detailsModal, setDetailsModal] = useState({
        open: false,
        title: "",
        contentLabel: "",
        contentText: "",
    });

    // add item modal
    const [anaAddModalOpen, setAnaAddModalOpen] = useState(false);
    const [addScope, setAddScope] = useState("global"); // global|day
    const [addMode, setAddMode] = useState("existing"); // existing|new
    const [addTargetSection, setAddTargetSection] = useState("");
    const [addNewSectionTitle, setAddNewSectionTitle] = useState("");
    const [addItemText, setAddItemText] = useState("");

    // notes modal
    const [notesModal, setNotesModal] = useState({
        open: false,
        title: "",
        place: "",
        section_id: null,
        section_title: "",
    });
    const [newNoteBody, setNewNoteBody] = useState("");
    const [noteScope, setNoteScope] = useState("global"); // global|day

    // edit modal (modifica voci DB)
    const [editModal, setEditModal] = useState({
        open: false,
        title: "",
        place: "",
        section_title: "",
    });
    const [editRows, setEditRows] = useState([]); // [{id,item_text,section_title}]

    // DB items dal dashboard (giorno+global)
    const anaDbItems = useMemo(() => data?.anaItems || [], [data?.anaItems]);

    const anaMergedSections = useMemo(() => {
        const base = (anaPack?.sections || []).map((s) => ({ ...s, items: [...(s.items || [])] }));

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
    }, [anaPack, anaDbItems, anaSearch]);

    // reset page when filters change
    const PER_PAGE = 16;
    const [page, setPage] = useState(1);
    useEffect(() => setPage(1), [anaPlace, anaSearch, day]);
    const paged = useMemo(() => paginate(anaMergedSections, page, PER_PAGE), [anaMergedSections, page]);

    // NOTES query
    const notesQuery = useQuery({
        queryKey: ["anaNotes", day, notesModal.place, notesModal.section_id, notesModal.section_title],
        queryFn: async () => {
            if (!notesModal.open) return { rows: [] };

            const p = notesModal.place;
            const sid = notesModal.section_id;
            const st = notesModal.section_title;

            const [globalRes, dayRes] = await Promise.all([
                api.listAnaNotes({ day: null, place: p, section_id: sid, section_title: st }),
                api.listAnaNotes({ day, place: p, section_id: sid, section_title: st }),
            ]);

            const rows = [...(dayRes?.rows || []), ...(globalRes?.rows || [])].sort(
                (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
            );

            return { rows };
        },
        enabled: Boolean(notesModal.open),
    });

    // MUTATIONS
    const addAnaItem = useMutation({
        mutationFn: (payload) => api.addAnaItem(payload),
        onSuccess: async () => {
            toastOk("Voce salvata");
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            setAnaAddModalOpen(false);
            setAddItemText("");
        },
        onError: (e) => toastErr(e, "Errore salvataggio voce"),
    });

    const patchAnaItem = useMutation({
        mutationFn: ({ id, patch }) => api.patchAnaItem(id, patch),
        onSuccess: async () => {
            toastOk("Voce aggiornata");
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore aggiornamento voce"),
    });

    const deleteAnaItem = useMutation({
        mutationFn: (id) => api.deleteAnaItem(id),
        onSuccess: async () => {
            toastOk("Voce eliminata");
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore eliminazione voce"),
    });

    const createAnaNote = useMutation({
        mutationFn: (payload) => api.createAnaNote(payload),
        onSuccess: async () => {
            toastOk("Nota salvata");
            setNewNoteBody("");
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            await qc.invalidateQueries({
                queryKey: ["anaNotes", day, notesModal.place, notesModal.section_id, notesModal.section_title],
            });
        },
        onError: (e) => toastErr(e, "Errore nota"),
    });

    const deleteAnaNote = useMutation({
        mutationFn: (id) => api.deleteAnaNote(id),
        onSuccess: async () => {
            toastOk("Nota eliminata");
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            await qc.invalidateQueries({
                queryKey: ["anaNotes", day, notesModal.place, notesModal.section_id, notesModal.section_title],
            });
        },
        onError: (e) => toastErr(e, "Errore eliminazione nota"),
    });

    function openNotesForSection(s) {
        const place = anaPack?.place || anaPlace;
        const rawId = String(s.id);
        const section_id = rawId.startsWith("db-") ? null : rawId;

        setNotesModal({
            open: true,
            title: `Note — ${place} / ${s.title}`,
            place,
            section_id,
            section_title: s.title,
        });
        setNewNoteBody("");
        setNoteScope("global");
    }

    function openEditForSection(s) {
        const place = anaPack?.place || anaPlace;
        setEditModal({
            open: true,
            title: `Modifica voci — ${place} / ${s.title}`,
            place,
            section_title: s.title,
        });

        const rows = (data?.anaItems || [])
            .filter(
                (x) =>
                    x.place === place &&
                    String(x.section_title || "").trim().toLowerCase() === String(s.title).trim().toLowerCase()
            )
            .map((x) => ({
                id: x.id,
                item_text: x.item_text,
                section_title: x.section_title || s.title,
            }));

        setEditRows(rows);
    }

    const placeLabel = anaPack?.place || anaPlace;

    return (
        <div className="space-y-6">
            {/* header */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className="p-6 bg-white/45 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs font-extrabold tracking-wide text-neutral-600">INVENTARIO</div>
                                <Tag tone="emerald">A.N.A.</Tag>
                            </div>

                            <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">Volontariato A.N.A.</h1>
                            <div className={cx("mt-2 text-xs", UI.dim2)}>Giorno operativo</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            {dash.isLoading && <div className={cx("text-sm", UI.dim)}>Caricamento…</div>}
            {dash.error && <div className="text-rose-700">{dash.error.message}</div>}

            {/* contenuto */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-5 bg-white/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                                <Boxes size={18} className="text-neutral-900" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-extrabold text-neutral-900">Sezioni inventario</div>
                               
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <select
                                value={anaPlace}
                                onChange={(e) => setAnaPlace(e.target.value)}
                                className={cx(
                                    "rounded-2xl px-4 py-3 text-sm outline-none",
                                    "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                    "focus:ring-4 focus:ring-indigo-500/15"
                                )}
                            >
                                {anaPlaces().map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>

                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input value={anaSearch} onChange={(e) => setAnaSearch(e.target.value)} placeholder="Cerca…" className="pl-10 w-[240px]" />
                            </div>

                            <MiniBtn
                                tone="indigo"
                                title="Aggiungi voce"
                                onClick={() => {
                                    setAnaAddModalOpen(true);
                                    setAddScope("global");
                                    setAddMode("existing");
                                    setAddTargetSection("");
                                    setAddNewSectionTitle("");
                                    setAddItemText("");
                                }}
                            >
                                <Plus size={16} /> Aggiungi
                            </MiniBtn>
                        </div>
                    </div>

                    <div className="mt-4">
                        {!anaPack ? (
                            <div className={cx("text-sm", UI.dim)}>Nessun dato.</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <Field label="Località">
                                        <div className="text-lg font-extrabold text-neutral-900">{anaPack.place}</div>
                                    </Field>

                                    <Field label="Sezioni">
                                        <div className="flex flex-wrap gap-2">
                                            <Chip tone="amber">{anaMergedSections.length} sezioni</Chip>
                                            <Chip tone="sky">{(data?.anaItems || []).length} voci DB</Chip>
                                            <Chip tone="neutral">giorno: {day}</Chip>
                                        </div>
                                    </Field>
                                </div>

                                <div className="mt-4">
                                    <Pager page={paged.page} pages={paged.pages} total={paged.total} perPage={PER_PAGE} onPage={setPage} />
                                </div>

                                {/* grid */}
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {paged.slice.map((s) => (
                                        <div key={s.id} className="rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm">
                                            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500" />
                                            <div className="p-5 bg-white/40">
                                                <div className="min-w-0">
                                                    <div className="font-extrabold text-neutral-900 truncate">{s.title}</div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <Chip tone="amber">{(s.items || []).length} voci</Chip>
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    <MiniBtn
                                                        tone="emerald"
                                                        title="Aggiungi voce in questa sezione"
                                                        onClick={() => {
                                                            setAnaAddModalOpen(true);
                                                            setAddScope("global");
                                                            setAddMode("existing");
                                                            setAddTargetSection(s.title);
                                                            setAddNewSectionTitle("");
                                                            setAddItemText("");
                                                        }}
                                                    >
                                                        <Plus size={16} /> Voce
                                                    </MiniBtn>

                                                    <MiniBtn
                                                        tone="indigo"
                                                        title="Voci (solo visualizza)"
                                                        onClick={() =>
                                                            setDetailsModal({
                                                                open: true,
                                                                title: `Voci — ${placeLabel} / ${s.title}`,
                                                                contentLabel: "Voci",
                                                                contentText: (s.items || []).length ? (s.items || []).map((x) => `• ${x}`).join("\n") : "Nessuna voce.",
                                                            })
                                                        }
                                                    >
                                                        <List size={16} /> Voci
                                                    </MiniBtn>

                                                    <MiniBtn tone="rose" title="Note" onClick={() => openNotesForSection(s)}>
                                                        <StickyNote size={16} /> Note
                                                    </MiniBtn>

                                                    <MiniBtn tone="neutral" title="Modifica voci DB" onClick={() => openEditForSection(s)}>
                                                        <List size={16} /> Modifica
                                                    </MiniBtn>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALE DETTAGLI */}
            <Modal open={detailsModal.open} title={detailsModal.title} onClose={() => setDetailsModal({ open: false, title: "", contentLabel: "", contentText: "" })}>
                <div className="space-y-3">
                    <DetailsBody label={detailsModal.contentLabel} text={detailsModal.contentText} />
                    <div className="flex justify-end">
                        <MiniBtn tone="neutral" title="Chiudi" onClick={() => setDetailsModal({ open: false, title: "", contentLabel: "", contentText: "" })}>
                            <X size={16} /> Chiudi
                        </MiniBtn>
                    </div>
                </div>
            </Modal>

            {/* MODALE ADD ANA (scegli card/sezione) */}
            <Modal open={anaAddModalOpen} title="Aggiungi voce (ANA)" onClose={() => setAnaAddModalOpen(false)}>
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();

                        const section_title =
                            addMode === "new" ? addNewSectionTitle.trim() : addTargetSection.trim();

                        if (!section_title) return toastErr("Seleziona o scrivi una sezione", "Errore");
                        if (!addItemText.trim()) return;

                        addAnaItem.mutate({
                            day: addScope === "day" ? day : null,
                            place: placeLabel,
                            section_id: null,
                            section_title,
                            item_text: addItemText.trim(),
                        });
                    }}
                >
                    <Field label="Contesto">
                        <div className="text-sm text-neutral-900">
                            <b>Località:</b> {placeLabel}
                            <div className={cx("text-xs mt-1", UI.dim2)}>
                                Giorno: {day} • scope: {addScope === "day" ? "giorno" : "globale"}
                            </div>
                        </div>
                    </Field>

                    <Field label="Scope">
                        <select
                            value={addScope}
                            onChange={(e) => setAddScope(e.target.value)}
                            className={cx(
                                "rounded-2xl px-4 py-3 text-sm outline-none",
                                "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                "focus:ring-4 focus:ring-indigo-500/15 w-full"
                            )}
                        >
                            <option value="global">Globale (sempre)</option>
                            <option value="day">Solo per questo giorno</option>
                        </select>
                    </Field>

                    <Field label="Dove inserire la voce">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                                value={addMode}
                                onChange={(e) => setAddMode(e.target.value)}
                                className={cx(
                                    "rounded-2xl px-4 py-3 text-sm outline-none",
                                    "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                    "focus:ring-4 focus:ring-indigo-500/15 w-full"
                                )}
                            >
                                <option value="existing">Sezione esistente</option>
                                <option value="new">Nuova sezione</option>
                            </select>

                            {addMode === "existing" ? (
                                <select
                                    value={addTargetSection}
                                    onChange={(e) => setAddTargetSection(e.target.value)}
                                    className={cx(
                                        "rounded-2xl px-4 py-3 text-sm outline-none",
                                        "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                        "focus:ring-4 focus:ring-indigo-500/15 w-full"
                                    )}
                                >
                                    <option value="">— scegli sezione —</option>
                                    {anaMergedSections.map((s) => (
                                        <option key={s.id} value={s.title}>
                                            {s.title}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    value={addNewSectionTitle}
                                    onChange={(e) => setAddNewSectionTitle(e.target.value)}
                                    placeholder="Nome nuova sezione"
                                    className={cx(UI.input, "w-full")}
                                />
                            )}
                        </div>
                    </Field>

                    <Field label="Nuova voce">
                        <textarea
                            value={addItemText}
                            onChange={(e) => setAddItemText(e.target.value)}
                            rows={4}
                            className={cx(UI.input, "w-full")}
                            placeholder="Scrivi mezzo/materiale (una voce)"
                            required
                        />
                    </Field>

                    <div className="flex items-center justify-end gap-2">
                        <MiniBtn tone="neutral" title="Annulla" onClick={() => setAnaAddModalOpen(false)}>
                            Annulla
                        </MiniBtn>
                        <button className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-neutral-900 text-white hover:bg-neutral-800">
                            Salva
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODALE MODIFICA VOCI DB */}
            <Modal
                open={editModal.open}
                title={editModal.title}
                onClose={() => {
                    setEditModal({ open: false, title: "", place: "", section_title: "" });
                    setEditRows([]);
                }}
            >
                <div className="space-y-3">
                    {editRows.length ? (
                        editRows.map((r, idx) => (
                            <div key={r.id} className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4 space-y-2">
                                <div className="text-[11px] font-extrabold text-neutral-500">
                                    ID #{r.id} • {fmtTs((anaDbItems.find((x) => x.id === r.id) || {}).created_at)}
                                </div>

                                <Field label="Voce">
                                    <input
                                        value={r.item_text}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setEditRows((xs) => xs.map((x, i) => (i === idx ? { ...x, item_text: v } : x)));
                                        }}
                                        className={cx(UI.input, "w-full")}
                                    />
                                </Field>

                                <Field label="Sposta in sezione">
                                    <select
                                        value={r.section_title || ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setEditRows((xs) => xs.map((x, i) => (i === idx ? { ...x, section_title: v } : x)));
                                        }}
                                        className={cx(
                                            "rounded-2xl px-4 py-3 text-sm outline-none",
                                            "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                            "focus:ring-4 focus:ring-indigo-500/15 w-full"
                                        )}
                                    >
                                        {anaMergedSections.map((s) => (
                                            <option key={s.id} value={s.title}>
                                                {s.title}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <div className="flex justify-end gap-2">
                                    <MiniBtn
                                        tone="neutral"
                                        title="Salva"
                                        onClick={() =>
                                            patchAnaItem.mutate({
                                                id: r.id,
                                                patch: {
                                                    item_text: r.item_text,
                                                    section_title: r.section_title,
                                                    place: editModal.place,
                                                },
                                            })
                                        }
                                    >
                                        Salva
                                    </MiniBtn>

                                    <MiniBtn
                                        tone="rose"
                                        title="Elimina"
                                        onClick={async () => {
                                            const ok = await confirmDanger("Eliminare questa voce?");
                                            if (!ok) return;
                                            await deleteAnaItem.mutateAsync(r.id);
                                            setEditRows((xs) => xs.filter((x) => x.id !== r.id));
                                        }}
                                    >
                                        <Trash2 size={16} /> Elimina
                                    </MiniBtn>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-neutral-500">
                            Nessuna voce DB in questa sezione (le voci statiche non sono modificabili).
                        </div>
                    )}

                    <div className="flex justify-end">
                        <MiniBtn
                            tone="neutral"
                            title="Chiudi"
                            onClick={() => {
                                setEditModal({ open: false, title: "", place: "", section_title: "" });
                                setEditRows([]);
                            }}
                        >
                            <X size={16} /> Chiudi
                        </MiniBtn>
                    </div>
                </div>
            </Modal>

            {/* MODALE NOTE ANA */}
            <Modal
                open={notesModal.open}
                title={notesModal.title}
                onClose={() => setNotesModal({ open: false, title: "", place: "", section_id: null, section_title: "" })}
            >
                <div className="space-y-3">
                    {notesQuery.isLoading ? (
                        <div className="text-sm text-neutral-500">Carico note…</div>
                    ) : notesQuery.error ? (
                        <div className="text-sm text-rose-700">{notesQuery.error.message}</div>
                    ) : (
                        <div className="space-y-2">
                            {(notesQuery.data?.rows || []).length ? (
                                (notesQuery.data?.rows || []).map((n) => (
                                    <div key={n.id} className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                                        <div className="text-[11px] font-extrabold text-neutral-700">
                                            {fmtTs(n.created_at)} • {n.day ? "giorno" : "globale"}
                                        </div>
                                        <div className="mt-2 text-sm text-neutral-900 whitespace-pre-wrap">{n.body}</div>
                                        <div className="mt-3 flex justify-end">
                                            <MiniBtn
                                                tone="rose"
                                                title="Elimina nota"
                                                onClick={async () => {
                                                    const ok = await confirmDanger("Eliminare questa nota?");
                                                    if (!ok) return;
                                                    deleteAnaNote.mutate(n.id);
                                                }}
                                            >
                                                <Trash2 size={16} /> Elimina
                                            </MiniBtn>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-neutral-500">Nessuna nota.</div>
                            )}
                        </div>
                    )}

                    <Field label="Nuova nota">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                                value={noteScope}
                                onChange={(e) => setNoteScope(e.target.value)}
                                className={cx(
                                    "rounded-2xl px-4 py-3 text-sm outline-none",
                                    "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                    "focus:ring-4 focus:ring-indigo-500/15"
                                )}
                            >
                                <option value="global">Globale (sempre)</option>
                                <option value="day">Solo per questo giorno</option>
                            </select>
                            <div className="text-xs text-neutral-500 flex items-center">
                                {noteScope === "day" ? `Salvata per il giorno ${day}` : "Salvata globale (sempre)"}
                            </div>
                        </div>

                        <textarea
                            value={newNoteBody}
                            onChange={(e) => setNewNoteBody(e.target.value)}
                            rows={4}
                            className={cx(UI.input, "w-full mt-2")}
                            placeholder="Scrivi nota…"
                        />

                        <div className="mt-3 flex justify-end gap-2">
                            <MiniBtn
                                tone="neutral"
                                title="Chiudi"
                                onClick={() => setNotesModal({ open: false, title: "", place: "", section_id: null, section_title: "" })}
                            >
                                <X size={16} /> Chiudi
                            </MiniBtn>

                            <MiniBtn
                                tone="indigo"
                                title="Pubblica"
                                disabled={!newNoteBody.trim() || createAnaNote.isPending}
                                onClick={() =>
                                    createAnaNote.mutate({
                                        day: noteScope === "day" ? day : null,
                                        place: notesModal.place,
                                        section_id: notesModal.section_id || null,
                                        section_title: notesModal.section_title || null,
                                        body: newNoteBody.trim(),
                                    })
                                }
                            >
                                <StickyNote size={16} /> {createAnaNote.isPending ? "Salvo…" : "Pubblica"}
                            </MiniBtn>
                        </div>
                    </Field>
                </div>
            </Modal>
        </div>
    );
}
