// src/pages/AnaInventory.jsx
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

import Modal from "../components/Modal.jsx";
import { anaAssetsForPlace, anaPlaces } from "../data/ana_assets_2026.js";

import { Boxes, Search, Plus, StickyNote, List, X, ChevronLeft, ChevronRight } from "lucide-react";

/* ------------------ helpers ------------------ */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

/* ------------------ UI tokens (allineati al resto) ------------------ */
const UI = {
    card: cx("rounded-3xl overflow-hidden", "bg-white/55 backdrop-blur-md", "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"),
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

function MiniBtn({ onClick, title, children, disabled, tone = "neutral" }) {
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
            type="button"
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
    return <span className={cx("text-[11px] rounded-full px-2.5 py-1 font-extrabold tracking-wide", tones[tone] || tones.neutral)}>{children}</span>;
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

    const [anaAddModal, setAnaAddModal] = useState({
        open: false,
        place: "",
        section_id: null,
        section_title: "",
        item_text: "",
        scope: "global",
    });

    const [detailsModal, setDetailsModal] = useState({
        open: false,
        title: "",
        contentLabel: "",
        contentText: "",
    });

    // paginazione sezioni (4x4 = 16)
    const PER_PAGE = 16;
    const [page, setPage] = useState(1);

    const addAnaItem = useMutation({
        mutationFn: (payload) => api.addAnaItem(payload),
        onSuccess: async () => qc.invalidateQueries({ queryKey: ["dashboardDay", day] }),
    });

    const anaDbItems = useMemo(() => data?.anaItems || [], [data?.anaItems]);

    const anaMergedSections = useMemo(() => {
        const base = (anaPack?.sections || []).map((s) => ({ ...s, items: [...(s.items || [])] }));

        const byId = new Map(base.map((s) => [String(s.id), s]));
        const byTitle = new Map(base.map((s) => [String(s.title).trim().toLowerCase(), s]));

        const place = anaPack?.place;
        const filtered = anaDbItems.filter((x) => !place || x.place === place);

        for (const it of filtered) {
            const target =
                (it.section_id && byId.get(String(it.section_id))) || (it.section_title && byTitle.get(String(it.section_title).trim().toLowerCase()));

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

    // reset pagina quando cambiano filtri/place/giorno
    React.useEffect(() => {
        setPage(1);
    }, [anaPlace, anaSearch, day]);

    const paged = useMemo(() => paginate(anaMergedSections, page, PER_PAGE), [anaMergedSections, page]);

    return (
        <div className="space-y-6">
            {/* header (stile dashboard) */}
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
                                <div className={cx("text-xs mt-1", UI.dim2)}>Statico + aggiunte DB (giorno o global)</div>
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
                    </div>

                    <div className="mt-4">
                        {!anaPack ? (
                            <div className={cx("text-sm", UI.dim)}>Nessun dato.</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    <Field label="Località">
                                        <div className="text-lg font-extrabold text-neutral-900">{anaPack.place}</div>
                                        {anaPack.title ? <div className={cx("text-sm mt-1", UI.dim)}>{anaPack.title}</div> : null}
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

                                {/* grid 4x4 */}
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {paged.slice.map((s) => (
                                        <div key={s.id} className="rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm">
                                            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-sky-500 to-indigo-500" />
                                            <div className="p-5 bg-white/40">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="font-extrabold text-neutral-900 truncate">{s.title}</div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            <Chip tone="amber">{(s.items || []).length} voci</Chip>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    <MiniBtn
                                                        tone="emerald"
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
                                                        tone="indigo"
                                                        title="Voci"
                                                        onClick={() =>
                                                            setDetailsModal({
                                                                open: true,
                                                                title: `Voci — ${anaPack.place} / ${s.title}`,
                                                                contentLabel: "Voci",
                                                                contentText: (s.items || []).length ? (s.items || []).map((x) => `• ${x}`).join("\n") : "Nessuna voce.",
                                                            })
                                                        }
                                                    >
                                                        <List size={16} /> Voci
                                                    </MiniBtn>

                                                    <MiniBtn
                                                        tone="rose"
                                                        title="Note (placeholder)"
                                                        onClick={() => alert("Se vuoi note ANA su DB, te lo integro come per COC.")}
                                                    >
                                                        <StickyNote size={16} /> Note
                                                    </MiniBtn>

                                                    <MiniBtn
                                                        tone="neutral"
                                                        title="Apri tutte"
                                                        onClick={() =>
                                                            setDetailsModal({
                                                                open: true,
                                                                title: `Sezione — ${anaPack.place} / ${s.title}`,
                                                                contentLabel: "Voci",
                                                                contentText: (s.items || []).length ? (s.items || []).map((x) => `• ${x}`).join("\n") : "Nessuna voce.",
                                                            })
                                                        }
                                                    >
                                                        <List size={16} /> Tutte
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

            {/* MODALE ADD ANA */}
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
                        <div className="text-sm text-neutral-900">
                            <b>Località:</b> {anaAddModal.place || anaPlace}
                            <div className={cx("text-xs mt-1", UI.dim2)}>Sezione: {anaAddModal.section_title || "—"}</div>
                        </div>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                            name="scope"
                            defaultValue={anaAddModal.scope || "global"}
                            className={cx(
                                "rounded-2xl px-4 py-3 text-sm outline-none",
                                "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                "focus:ring-4 focus:ring-indigo-500/15"
                            )}
                        >
                            <option value="global">Globale (sempre)</option>
                            <option value="day">Solo per questo giorno</option>
                        </select>

                        <input
                            name="section_title"
                            defaultValue={anaAddModal.section_title || ""}
                            placeholder="Sezione (lascia così oppure scrivi nuova)"
                            className={cx(UI.input, "w-full")}
                        />
                    </div>

                    <textarea name="item_text" required rows={4} placeholder="Scrivi mezzo/materiale (una voce)" className={cx(UI.input, "w-full")} />

                    <div className="flex items-center justify-end gap-2">
                        <MiniBtn tone="neutral" title="Annulla" onClick={() => setAnaAddModal((s) => ({ ...s, open: false }))}>
                            Annulla
                        </MiniBtn>
                        <button className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-neutral-900 text-white hover:bg-neutral-800">Salva</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
