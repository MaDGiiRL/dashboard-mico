// src/pages/CocSafety.jsx
import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

import Modal from "../components/Modal.jsx";
import { cocContactsAll } from "../data/coc_contacts_2026.js";
import { SAFETY_BELLUNO_EXTERNAL_NUMBER, safetyBellunoContactsAll } from "../data/safety_belluno_contacts_2026.js";

import {
    Building2,
    Users,
    Search,
    Plus,
    DoorOpen,
    DoorClosed,
    FileCheck2,
    Phone,
    StickyNote,
    List,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

/* ------------------ helpers ------------------ */
function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}
function safeStr(x) {
    return x === null || x === undefined ? "" : String(x);
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

/* ------------------ Details formatting helpers ------------------ */
function normalizePhone(raw) {
    const s = String(raw || "").trim();
    if (!s) return null;

    const cleaned = s
        .replace(/(tel|cell|telefono|n\.|nr\.|numero)\s*:?/gi, " ")
        .replace(/[^\d+\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const href = cleaned.replace(/[^\d+]/g, "");
    if (!href || href.length < 6) return null;
    return { label: cleaned, href };
}

function extractPhonesFromLine(line) {
    const s = String(line || "");
    const matches = s.match(/(\+?\d[\d\s]{5,}\d)/g) || [];
    const out = [];
    for (const m of matches) {
        const p = normalizePhone(m);
        if (p) out.push(p);
    }
    return out;
}

function splitContactLines(text) {
    return String(text || "")
        .split(/\r?\n+/)
        .map((x) => x.trim())
        .filter(Boolean);
}

function parseContactsToRows(text) {
    const lines = splitContactLines(text);
    return lines.map((line) => {
        const phones = extractPhonesFromLine(line);

        let title = line;
        for (const p of phones) {
            title = title.replace(p.label, " ").replace(p.href, " ");
        }
        title = title.replace(/\s+/g, " ").replace(/[-–•]+/g, "-").trim();

        return { title: title || "Contatto", phones };
    });
}

function isLikelyBullets(text) {
    const lines = splitContactLines(text);
    if (lines.length <= 1) return false;
    const bulletish = lines.filter((l) => /^[-•*]/.test(l)).length;
    return bulletish >= Math.max(2, Math.floor(lines.length / 3));
}

/* ------------------ UI tokens (allineati dashboard) ------------------ */
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

function Tag({ tone = "neutral", children }) {
    const tones = {
        neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
        amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
        cyan: "bg-cyan-500/14 text-cyan-950 ring-1 ring-cyan-500/18",
        emerald: "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/15",
        rose: "bg-rose-500/12 text-rose-900 ring-1 ring-rose-500/15",
        sky: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
    };
    return (
        <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide", tones[tone] || tones.neutral)}>
            {children}
        </span>
    );
}

function MiniBtn({ onClick, title, children, disabled, tone = "neutral" }) {
    const tones = {
        neutral: "bg-white/55 hover:bg-white/70 text-neutral-900 ring-white/45",
        coc: "bg-amber-500/14 hover:bg-amber-500/18 text-amber-950 ring-amber-500/18",
        ops: "bg-cyan-500/14 hover:bg-cyan-500/18 text-cyan-950 ring-cyan-500/18",
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
        good: "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/15",
        warn: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
        info: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
    };
    return <span className={cx("text-[11px] rounded-full px-2.5 py-1 font-extrabold tracking-wide", tones[tone] || tones.neutral)}>{children}</span>;
}

function Field({ label, children }) {
    return (
        <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
            <div className="text-[11px] uppercase tracking-wide text-neutral-500 font-extrabold">{label}</div>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function DetailsBody({ label, text, kind }) {
    const t = String(text || "").trim();
    if (!t) {
        return (
            <Field label={label || "Dettagli"}>
                <div className={cx("text-sm", UI.dim)}>—</div>
            </Field>
        );
    }

    const lines = splitContactLines(t);

    if (kind === "contacts") {
        const rows = parseContactsToRows(t);
        return (
            <Field label={label || "Recapiti"}>
                <div className="space-y-3">
                    {rows.map((r, idx) => (
                        <div key={idx} className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                            <div className="text-sm text-neutral-900 font-extrabold">{r.title}</div>
                            {r.phones.length ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {r.phones.map((p, j) => (
                                        <a
                                            key={j}
                                            href={`tel:${p.href}`}
                                            className={cx(
                                                "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold transition",
                                                "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm ring-1 ring-white/45"
                                            )}
                                            title={`Chiama ${p.label}`}
                                        >
                                            <Phone size={14} />
                                            {p.label}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className={cx("mt-2 text-xs", UI.dim2)}>Nessun numero trovato.</div>
                            )}
                        </div>
                    ))}
                </div>
            </Field>
        );
    }

    if (kind === "list" || isLikelyBullets(t)) {
        const cleaned = lines.map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
        return (
            <Field label={label || "Elenco"}>
                <ul className="space-y-2">
                    {cleaned.map((l, i) => (
                        <li key={i} className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4 text-sm">
                            {l}
                        </li>
                    ))}
                </ul>
            </Field>
        );
    }

    return (
        <Field label={label || "Dettagli"}>
            <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4 text-sm whitespace-pre-wrap leading-relaxed text-neutral-900">
                {t}
            </div>
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
export default function CocSafety() {
    const qc = useQueryClient();
    const [day, setDay] = useState(todayISO());

    const dash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });

    const data = dash.data;

    // modale note semplice (COC)
    const [noteModal, setNoteModal] = useState({ open: false, title: "", notes: "" });
    const closeNoteModal = () => setNoteModal({ open: false, title: "", notes: "" });

    // modale dettagli
    const [detailsModal, setDetailsModal] = useState({
        open: false,
        title: "",
        contentLabel: "",
        contentText: "",
        kind: "text",
        tone: "neutral",
    });

    const openDetails = ({ title, contentLabel, contentText, kind }) =>
        setDetailsModal({ open: true, title, contentLabel, contentText, kind, tone: "neutral" });

    // COC add modal
    const [cocAddModal, setCocAddModal] = useState({ open: false, name: "", autoOpen: true, ordinance: false });

    // filtri
    const [cocFilter, setCocFilter] = useState("all");
    const [cocSearch, setCocSearch] = useState("");
    const [safetySearch, setSafetySearch] = useState("");

    // pagination (4x4 = 16 per pagina)
    const PER_PAGE = 16;
    const [cocPage, setCocPage] = useState(1);
    const [safetyPage, setSafetyPage] = useState(1);

    // SAFETY local add
    const [safetyAddModal, setSafetyAddModal] = useState({
        open: false,
        operator: "",
        interno: "",
        external_dial: "",
        responder_group: "",
        responder_digit: "",
        responder_note: "",
    });
    const SAFETY_LS_KEY = "safety_belluno_contacts_user_v1";

    const safetyUserRows = useMemo(() => {
        try {
            const raw = localStorage.getItem(SAFETY_LS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }, []);
    const [safetyUser, setSafetyUser] = useState(safetyUserRows);

    function persistSafetyUser(next) {
        setSafetyUser(next);
        try {
            localStorage.setItem(SAFETY_LS_KEY, JSON.stringify(next));
        } catch { }
    }

    // mutations
    const upsertCocStatus = useMutation({
        mutationFn: (payload) => api.upsertCocStatus(payload),
        onSuccess: async () => qc.invalidateQueries({ queryKey: ["dashboardDay", day] }),
    });

    const upsertCocOrdinance = useMutation({
        mutationFn: (payload) => api.upsertCocOrdinance(payload),
        onSuccess: async () => qc.invalidateQueries({ queryKey: ["dashboardDay", day] }),
    });

    const ensureCocCommune = useMutation({
        mutationFn: ({ name }) => api.ensureCocCommune({ name }),
        onSuccess: async (row) => {
            const name = row?.name || cocAddModal.name;

            if (cocAddModal.autoOpen) await api.upsertCocStatus({ day, commune_name: name, is_open: true });
            if (cocAddModal.ordinance) await api.upsertCocOrdinance({ day, commune_name: name, ordinance: true });

            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            setCocAddModal({ open: false, name: "", autoOpen: true, ordinance: false });
        },
    });

    // COC merge (static + overlay DB)
    const cocAll = useMemo(() => cocContactsAll(), []);
    const cocStatic = useMemo(() => {
        let xs = cocAll;

        const q = cocSearch.trim().toLowerCase();
        if (q) xs = xs.filter((x) => `${safeStr(x.commune)} ${safeStr(x.contacts)}`.toLowerCase().includes(q));

        if (cocFilter !== "all") xs = xs.filter((x) => String(x.coc_status).toLowerCase() === cocFilter);

        return xs;
    }, [cocAll, cocSearch, cocFilter]);

    // reset pagina quando cambiano i filtri
    React.useEffect(() => {
        setCocPage(1);
    }, [cocSearch, cocFilter, day]);

    const cocStatusMap = useMemo(() => {
        const m = new Map();
        for (const row of data?.coc || []) m.set(String(row.commune_name || "").trim().toLowerCase(), row);
        return m;
    }, [data?.coc]);

    const cocOrdMap = useMemo(() => {
        const rows = data?.cocOrdinances || [];
        const m = new Map();
        for (const row of rows) m.set(String(row.commune_name || "").trim().toLowerCase(), row);
        return m;
    }, [data?.cocOrdinances]);

    const cocMerged = useMemo(() => {
        return cocStatic.map((c) => {
            const k = String(c.commune || "").trim().toLowerCase();
            const db = cocStatusMap.get(k);

            const isOpen = db ? !db.closed_at : String(c.coc_status || "").toLowerCase() === "aperto";
            const ord = cocOrdMap.get(k);
            const ordinance = ord ? Boolean(ord.ordinance) : Boolean(c.ordinance);

            return {
                ...c,
                overlay: {
                    isOpen,
                    ordinance,
                    opened_at: db?.opened_at || null,
                    closed_at: db?.closed_at || null,
                    room_phone: db?.room_phone || null,
                },
            };
        });
    }, [cocStatic, cocStatusMap, cocOrdMap]);

    const cocPaged = useMemo(() => paginate(cocMerged, cocPage, PER_PAGE), [cocMerged, cocPage]);

    // SAFETY merged
    const safetyStatic = useMemo(() => safetyBellunoContactsAll(), []);
    const safetyMerged = useMemo(() => {
        const all = [...safetyStatic, ...(Array.isArray(safetyUser) ? safetyUser : [])];
        const q = safetySearch.trim().toLowerCase();
        if (!q) return all;

        return all.filter((x) =>
            `${safeStr(x.operator)} ${safeStr(x.interno)} ${safeStr(x.external_dial)} ${safeStr(x.responder_group)} ${safeStr(x.responder_digit)} ${safeStr(x.responder_note)}`
                .toLowerCase()
                .includes(q)
        );
    }, [safetyStatic, safetyUser, safetySearch]);

    React.useEffect(() => {
        setSafetyPage(1);
    }, [safetySearch, day]);

    const safetyPaged = useMemo(() => paginate(safetyMerged, safetyPage, PER_PAGE), [safetyMerged, safetyPage]);

    return (
        <div className="space-y-6">
            {/* header */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className="p-6 bg-white/45 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs font-extrabold tracking-wide text-neutral-600">COC E SAFETY BELLUNO</div>
                                <Tag tone="sky">OPERATIVO</Tag>
                            </div>

                            <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">COC + Safety</h1>
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

            {/* COC */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-5 bg-white/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                                <Building2 size={18} className="text-amber-950" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-extrabold text-neutral-900">COC — Stato / Ordinanza</div>
                                <div className={cx("text-xs mt-1", UI.dim2)}>Apri/chiudi + ordinanza + recapiti</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    value={cocSearch}
                                    onChange={(e) => setCocSearch(e.target.value)}
                                    placeholder="Cerca comune / recapiti…"
                                    className="pl-10 w-[260px]"
                                />
                            </div>

                            <select
                                value={cocFilter}
                                onChange={(e) => setCocFilter(e.target.value)}
                                className={cx(
                                    "rounded-2xl px-4 py-3 text-sm outline-none",
                                    "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                    "focus:ring-4 focus:ring-indigo-500/15"
                                )}
                            >
                                <option value="all">Tutti</option>
                                <option value="aperto">Solo aperti</option>
                                <option value="chiuso">Solo chiusi</option>
                            </select>

                            <MiniBtn tone="coc" title="Aggiungi Comune" onClick={() => setCocAddModal({ open: true, name: "", autoOpen: true, ordinance: false })}>
                                <Plus size={16} /> Comune
                            </MiniBtn>
                        </div>
                    </div>

                    <div className="mt-4">
                        <Pager page={cocPaged.page} pages={cocPaged.pages} total={cocPaged.total} perPage={PER_PAGE} onPage={setCocPage} />
                    </div>

                    {/* grid 4x4 */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {cocPaged.slice.map((c) => {
                            const isOpen = Boolean(c.overlay?.isOpen);
                            const ordinance = Boolean(c.overlay?.ordinance);

                            const topBar = isOpen
                                ? "bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500"
                                : "bg-gradient-to-r from-neutral-400 via-neutral-300 to-neutral-200";

                            return (
                                <div key={c.id} className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                                    <div className={cx("h-1.5", topBar)} />
                                    <div className="p-5 bg-white/40">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="font-extrabold text-neutral-900 truncate">{c.commune}</div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <Chip tone={isOpen ? "good" : "neutral"}>{isOpen ? "COC aperto" : "COC chiuso"}</Chip>
                                                    <Chip tone={ordinance ? "warn" : "neutral"}>{ordinance ? "Ordinanza: sì" : "Ordinanza: no"}</Chip>
                                                    {c.overlay?.room_phone ? <Chip tone="info">sala: {c.overlay.room_phone}</Chip> : null}
                                                </div>

                                                <div className={cx("mt-3 text-xs", UI.dim2)}>
                                                    {c.overlay?.opened_at ? `Apertura: ${new Date(c.overlay.opened_at).toLocaleTimeString()}` : ""}
                                                    {c.overlay?.closed_at ? ` • Chiusura: ${new Date(c.overlay.closed_at).toLocaleTimeString()}` : ""}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <MiniBtn tone="coc" title={isOpen ? "Chiudi COC" : "Apri COC"} onClick={() => upsertCocStatus.mutate({ day, commune_name: c.commune, is_open: !isOpen })}>
                                                {isOpen ? <DoorClosed size={16} /> : <DoorOpen size={16} />}
                                                {isOpen ? "Chiudi" : "Apri"}
                                            </MiniBtn>

                                            <MiniBtn tone="coc" title="Ordinanza" onClick={() => upsertCocOrdinance.mutate({ day, commune_name: c.commune, ordinance: !ordinance })}>
                                                <FileCheck2 size={16} /> Ordin.
                                            </MiniBtn>

                                            <MiniBtn
                                                tone="coc"
                                                title="Recapiti"
                                                onClick={() =>
                                                    openDetails({
                                                        title: `Recapiti — ${c.commune}`,
                                                        contentLabel: "Recapiti",
                                                        contentText: c.contacts ? String(c.contacts) : "Nessun recapito.",
                                                        kind: "contacts",
                                                    })
                                                }
                                            >
                                                <Phone size={16} /> Recap.
                                            </MiniBtn>

                                            <MiniBtn tone="coc" title="Note" onClick={() => setNoteModal({ open: true, title: `Note — ${c.commune}`, notes: "" })}>
                                                <StickyNote size={16} /> Note
                                            </MiniBtn>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SAFETY */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-5 bg-white/40">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                                <Users size={18} className="text-cyan-950" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-lg font-extrabold text-neutral-900">Sala Safety Belluno</div>
                                <div className={cx("text-xs mt-1", UI.dim2)}>
                                    Numero esterno: <span className="font-extrabold text-neutral-900">{SAFETY_BELLUNO_EXTERNAL_NUMBER}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <Input
                                    value={safetySearch}
                                    onChange={(e) => setSafetySearch(e.target.value)}
                                    placeholder="Cerca operatore / interno / note…"
                                    className="pl-10 w-[300px]"
                                />
                            </div>

                            <MiniBtn
                                tone="ops"
                                title="Aggiungi voce rubrica"
                                onClick={() =>
                                    setSafetyAddModal({
                                        open: true,
                                        operator: "",
                                        interno: "",
                                        external_dial: "",
                                        responder_group: "",
                                        responder_digit: "",
                                        responder_note: "",
                                    })
                                }
                            >
                                <Plus size={16} /> Voce
                            </MiniBtn>
                        </div>
                    </div>

                    <div className="mt-4">
                        <Pager page={safetyPaged.page} pages={safetyPaged.pages} total={safetyPaged.total} perPage={PER_PAGE} onPage={setSafetyPage} />
                    </div>

                    {/* grid 4x4 */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {safetyPaged.slice.map((c) => (
                            <div key={c.id} className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                                <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500" />
                                <div className="p-5 bg-white/40">
                                    <div className="min-w-0">
                                        <div className="font-extrabold text-neutral-900 truncate">{c.operator || "—"}</div>

                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <Chip tone="info">interno: {c.interno || "—"}</Chip>
                                            <Chip tone="neutral">esterno: {c.external_dial || "—"}</Chip>
                                            <Chip tone="neutral">
                                                gruppo: {c.responder_group || "—"} {c.responder_digit ? `(${c.responder_digit})` : ""}
                                            </Chip>
                                        </div>

                                        <div className="mt-3 text-sm text-neutral-900/90 whitespace-pre-wrap leading-relaxed line-clamp-4">
                                            {c.responder_note || "—"}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <MiniBtn
                                            tone="ops"
                                            title="Apri dettagli"
                                            onClick={() =>
                                                openDetails({
                                                    title: `Rubrica — ${c.operator || "—"}`,
                                                    contentLabel: "Dettagli",
                                                    contentText:
                                                        `Operatore: ${c.operator || "—"}\n` +
                                                        `Interno: ${c.interno || "—"}\n` +
                                                        `Dall’esterno: ${c.external_dial || "—"}\n` +
                                                        `Gruppo risponditore: ${c.responder_group || "—"}\n` +
                                                        `Tasto: ${c.responder_digit || "—"}\n\n` +
                                                        `Nota:\n${c.responder_note || "—"}`,
                                                    kind: "text",
                                                })
                                            }
                                        >
                                            <List size={16} /> Dettagli
                                        </MiniBtn>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODALE DETTAGLI */}
            <Modal
                open={detailsModal.open}
                title={detailsModal.title}
                onClose={() => setDetailsModal({ open: false, title: "", contentLabel: "", contentText: "", kind: "text", tone: "neutral" })}
            >
                <div className="space-y-3">
                    <DetailsBody label={detailsModal.contentLabel} text={detailsModal.contentText} kind={detailsModal.kind} />
                    <div className="flex justify-end">
                        <MiniBtn
                            tone="neutral"
                            title="Chiudi"
                            onClick={() => setDetailsModal({ open: false, title: "", contentLabel: "", contentText: "", kind: "text", tone: "neutral" })}
                        >
                            <X size={16} /> Chiudi
                        </MiniBtn>
                    </div>
                </div>
            </Modal>

            {/* MODALE ADD COC */}
            <Modal open={cocAddModal.open} title="Aggiungi Comune (COC)" onClose={() => setCocAddModal({ open: false, name: "", autoOpen: true, ordinance: false })}>
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        const name = String(fd.get("name") || "").trim();
                        if (!name) return;
                        setCocAddModal((s) => ({ ...s, name }));
                        ensureCocCommune.mutate({ name });
                    }}
                >
                    <Field label="Nome Comune">
                        <input name="name" placeholder="Es: Valle di Cadore" className={cx(UI.input, "w-full")} required />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="rounded-3xl bg-white/55 ring-1 ring-white/45 px-4 py-3 text-sm flex items-center gap-2">
                            <input type="checkbox" defaultChecked={cocAddModal.autoOpen} onChange={(e) => setCocAddModal((s) => ({ ...s, autoOpen: e.target.checked }))} />
                            Auto-apri COC
                        </label>

                        <label className="rounded-3xl bg-white/55 ring-1 ring-white/45 px-4 py-3 text-sm flex items-center gap-2">
                            <input type="checkbox" defaultChecked={cocAddModal.ordinance} onChange={(e) => setCocAddModal((s) => ({ ...s, ordinance: e.target.checked }))} />
                            Imposta ordinanza (sì)
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <MiniBtn tone="neutral" title="Annulla" onClick={() => setCocAddModal({ open: false, name: "", autoOpen: true, ordinance: false })}>
                            Annulla
                        </MiniBtn>
                        <button className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-neutral-900 text-white hover:bg-neutral-800">
                            Salva Comune
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODALE ADD SAFETY */}
            <Modal open={safetyAddModal.open} title="Aggiungi voce — Rubrica Safety Belluno" onClose={() => setSafetyAddModal((s) => ({ ...s, open: false }))}>
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);

                        const row = {
                            id: `user-${Date.now()}`,
                            operator: String(fd.get("operator") || "").trim(),
                            interno: String(fd.get("interno") || "").trim(),
                            external_dial: String(fd.get("external_dial") || "").trim(),
                            responder_group: String(fd.get("responder_group") || "").trim(),
                            responder_digit: String(fd.get("responder_digit") || "").trim(),
                            responder_note: String(fd.get("responder_note") || "").trim(),
                        };

                        if (!row.operator && !row.interno) return;

                        persistSafetyUser([row, ...(Array.isArray(safetyUser) ? safetyUser : [])]);
                        setSafetyAddModal((s) => ({ ...s, open: false }));
                    }}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field label="Operatore">
                            <input name="operator" defaultValue={safetyAddModal.operator} placeholder="Es: Prefettura" className={cx(UI.input, "w-full")} />
                        </Field>

                        <Field label="Nr. interno">
                            <input name="interno" defaultValue={safetyAddModal.interno} placeholder="Es: 201" className={cx(UI.input, "w-full")} />
                        </Field>
                    </div>

                    <Field label="Collegamento dall’esterno">
                        <input
                            name="external_dial"
                            defaultValue={safetyAddModal.external_dial}
                            placeholder={`Es: ${SAFETY_BELLUNO_EXTERNAL_NUMBER} poi 2`}
                            className={cx(UI.input, "w-full")}
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Field label="Gruppo risponditore">
                            <input name="responder_group" defaultValue={safetyAddModal.responder_group} placeholder="Es: Prefettura" className={cx(UI.input, "w-full")} />
                        </Field>

                        <Field label="Tasto (digit)">
                            <input name="responder_digit" defaultValue={safetyAddModal.responder_digit} placeholder="Es: 2" className={cx(UI.input, "w-full")} />
                        </Field>
                    </div>

                    <Field label="Nota risponditore">
                        <textarea
                            name="responder_note"
                            defaultValue={safetyAddModal.responder_note}
                            rows={4}
                            placeholder="Es: Quando inizia a parlare il risponditore premere 2"
                            className={cx(UI.input, "w-full")}
                        />
                    </Field>

                    <div className="flex items-center justify-end gap-2">
                        <MiniBtn tone="neutral" title="Annulla" onClick={() => setSafetyAddModal((s) => ({ ...s, open: false }))}>
                            Annulla
                        </MiniBtn>
                        <button className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-neutral-900 text-white hover:bg-neutral-800">
                            Salva
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODALE NOTE placeholder */}
            <Modal open={noteModal.open} title={noteModal.title} onClose={closeNoteModal}>
                <div className="space-y-3">
                    <div className={cx("text-sm", UI.dim)}>Placeholder note (se vuoi collegarla a DB/route dimmelo).</div>
                    <div className="flex justify-end">
                        <MiniBtn tone="neutral" title="Chiudi" onClick={closeNoteModal}>
                            <X size={16} /> Chiudi
                        </MiniBtn>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
