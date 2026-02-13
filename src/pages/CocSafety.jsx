// src/pages/CocSafety.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
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
    Download,
    Trash2,
    Pencil,
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
function hhmmFromAny(v) {
    if (!v) return null;
    const s = String(v);
    // timestamptz iso => "...T08:00:00.000Z"
    const mIso = s.match(/T(\d{2}:\d{2})/);
    if (mIso) return mIso[1];
    // time => "08:00:00" o "08:00"
    const mTime = s.match(/^(\d{2}:\d{2})/);
    if (mTime) return mTime[1];
    return null;
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
function Tag({ tone = "neutral", children }) {
    const tones = {
        neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
        amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
        cyan: "bg-cyan-500/14 text-cyan-950 ring-1 ring-cyan-500/18",
        emerald: "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/15",
        rose: "bg-rose-500/12 text-rose-900 ring-1 ring-rose-500/15",
        sky: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
        fuchsia: "bg-fuchsia-500/10 text-fuchsia-900 ring-1 ring-fuchsia-500/15",
    };
    return (
        <span
            className={cx(
                "rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide",
                tones[tone] || tones.neutral
            )}
        >
            {children}
        </span>
    );
}
function MiniBtn({ onClick, title, children, disabled, tone = "neutral", iconOnly = false, type = "button" }) {
    const tones = {
        neutral: "bg-white/55 hover:bg-white/70 text-neutral-900 ring-white/45",
        coc: "bg-amber-500/14 hover:bg-amber-500/18 text-amber-950 ring-amber-500/18",
        ops: "bg-cyan-500/14 hover:bg-cyan-500/18 text-cyan-950 ring-cyan-500/18",
        danger: "bg-rose-500/14 hover:bg-rose-500/18 text-rose-950 ring-rose-500/18",
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
                iconOnly ? "px-2" : "",
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
    return (
        <span
            className={cx(
                "text-[11px] rounded-full px-2.5 py-1 font-extrabold tracking-wide",
                tones[tone] || tones.neutral
            )}
        >
            {children}
        </span>
    );
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

    // DASHBOARD COC
    const dash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });
    const data = dash.data;

    // ===== modale dettagli
    const [detailsModal, setDetailsModal] = useState({
        open: false,
        title: "",
        contentLabel: "",
        contentText: "",
        kind: "text",
    });
    const openDetails = ({ title, contentLabel, contentText, kind }) =>
        setDetailsModal({ open: true, title, contentLabel, contentText, kind });

    // ===== filtri / paginazione COC
    const [cocFilter, setCocFilter] = useState("all");
    const [cocSearch, setCocSearch] = useState("");
    const PER_PAGE = 16;
    const [cocPage, setCocPage] = useState(1);

    // ===== modale aggiungi comune (DB)
    const [cocAddModalOpen, setCocAddModalOpen] = useState(false);
    const [cocAddForm, setCocAddForm] = useState({
        name: "",
        is_open: true,
        open_mode: "DAY",
        open_from: "08:00",
        open_to: "20:00",
        room_phone: "",
        contacts: [{ contact_name: "", phone: "" }],
    });

    // ===== modale NOTE COC (DB)
    const [noteModal, setNoteModal] = useState({ open: false, commune_name: "", title: "" });
    const [newNoteBody, setNewNoteBody] = useState("");
    const notesQuery = useQuery({
        queryKey: ["cocNotes", day, noteModal.commune_name],
        queryFn: async () => {
            if (!noteModal.open || !noteModal.commune_name) return { rows: [] };
            return api.listCocNotes(day, noteModal.commune_name);
        },
        enabled: Boolean(noteModal.open && noteModal.commune_name),
    });

    // ===== modale ORDINANZA
    const [ordModal, setOrdModal] = useState({ open: false, commune_name: "" });

    // ===== static COC
    const cocAll = useMemo(() => cocContactsAll(), []);

    // ===== dashboard maps COC
    const cocStatusMap = useMemo(() => {
        const m = new Map();
        for (const row of data?.cocStatus || []) {
            m.set(String(row.commune_name || "").trim().toLowerCase(), row);
        }
        return m;
    }, [data?.cocStatus]);

    const cocOrdinanceMap = useMemo(() => {
        const m = new Map();
        for (const row of data?.cocOrdinances || []) {
            m.set(String(row.commune_name || "").trim().toLowerCase(), row);
        }
        return m;
    }, [data?.cocOrdinances]);

    const cocContactsMap = useMemo(() => {
        const m = new Map();
        for (const row of data?.cocContacts || []) {
            const k = String(row.commune_name || "").trim().toLowerCase();
            const arr = m.get(k) || [];
            arr.push(row);
            m.set(k, arr);
        }
        for (const [k, arr] of m.entries()) {
            arr.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            m.set(k, arr);
        }
        return m;
    }, [data?.cocContacts]);

    // ===== merge COC static + overlay DB
    const cocStaticFiltered = useMemo(() => {
        let xs = cocAll;
        const q = cocSearch.trim().toLowerCase();
        if (q) xs = xs.filter((x) => `${safeStr(x.commune)} ${safeStr(x.contacts)}`.toLowerCase().includes(q));
        return xs;
    }, [cocAll, cocSearch]);

    useEffect(() => setCocPage(1), [cocSearch, cocFilter, day]);

    const cocMerged = useMemo(() => {
        const out = cocStaticFiltered.map((c) => {
            const k = String(c.commune || "").trim().toLowerCase();
            const st = cocStatusMap.get(k);
            const ord = cocOrdinanceMap.get(k);
            const contactsDb = cocContactsMap.get(k) || [];

            const isOpen = st ? Boolean(st.is_open) : String(c.coc_status || "").toLowerCase() === "aperto";
            const openMode = st?.open_mode || "DAY";
            const openFrom = hhmmFromAny(st?.open_from);
            const openTo = hhmmFromAny(st?.open_to);

            const hasOrd = ord ? Boolean(ord.ordinance) : Boolean(c.ordinance);

            const hasPdf = false;


            return {
                ...c,
                overlay: {
                    isOpen,
                    openMode,
                    openFrom,
                    openTo,
                    room_phone: st?.room_phone || null,
                    hasOrd,
                    hasPdf,
                    pdfName: ord?.file_name || null,
                    contactsDb,
                },
            };
        });

        if (cocFilter === "all") return out;
        const wantOpen = cocFilter === "aperto";
        return out.filter((x) => Boolean(x.overlay?.isOpen) === wantOpen);
    }, [cocStaticFiltered, cocStatusMap, cocOrdinanceMap, cocContactsMap, cocFilter]);

    const cocPaged = useMemo(() => paginate(cocMerged, cocPage, PER_PAGE), [cocMerged, cocPage]);

    /* ================= MUTATIONS COC ================= */

    // ✅ COC status realtime (optimistic update su cache dashboardDay)
    // COC status (apri/chiudi + orari + mode + room_phone)  ✅ realtime
    const upsertCocStatus = useMutation({
        mutationFn: (payload) => api.upsertCocStatus(payload),

        // ✅ optimistic update: aggiorna subito il badge senza aspettare il refetch
        onMutate: async (payload) => {
            await qc.cancelQueries({ queryKey: ["dashboardDay", day] });

            const prev = qc.getQueryData(["dashboardDay", day]);

            const key = String(payload.commune_name || "").trim().toLowerCase();

            qc.setQueryData(["dashboardDay", day], (old) => {
                if (!old) return old;

                const nowIso = new Date().toISOString();
                const next = { ...old };

                const arr = Array.isArray(next.cocStatus) ? [...next.cocStatus] : [];
                const idx = arr.findIndex(
                    (r) => String(r.commune_name || "").trim().toLowerCase() === key
                );

                const patchedRow = {
                    ...(idx >= 0 ? arr[idx] : {}),
                    day: payload.day,
                    commune_name: payload.commune_name,
                    is_open: Boolean(payload.is_open),
                    open_mode: payload.open_mode || "DAY",
                    open_from: payload.open_from ?? null,
                    open_to: payload.open_to ?? null,
                    room_phone: payload.room_phone ?? null,
                    updated_at: nowIso,
                };

                if (idx >= 0) arr[idx] = patchedRow;
                else arr.push(patchedRow);

                next.cocStatus = arr;
                return next;
            });

            return { prev };
        },

        onError: (e, _payload, ctx) => {
            if (ctx?.prev) qc.setQueryData(["dashboardDay", day], ctx.prev);
            toastErr(e, "Errore COC");
        },

        onSuccess: async () => {
            toastOk("COC aggiornato");
            // ✅ dopo optimistic, refetch per allineare al DB
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
    });


    // COC commune + contacts
    const upsertCocCommune = useMutation({
        mutationFn: (payload) => api.upsertCocCommune(payload),
        onSuccess: async () => {
            toastOk("Comune salvato");
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
            setCocAddModalOpen(false);
            setCocAddForm({
                name: "",
                is_open: true,
                open_mode: "DAY",
                open_from: "08:00",
                open_to: "20:00",
                room_phone: "",
                contacts: [{ contact_name: "", phone: "" }],
            });
        },
        onError: (e) => toastErr(e, "Errore salvataggio comune"),
    });

    // COC notes
    const createCocNote = useMutation({
        mutationFn: (payload) => api.createCocNote(payload),
        onSuccess: async () => {
            toastOk("Nota salvata");
            setNewNoteBody("");
            await qc.invalidateQueries({ queryKey: ["cocNotes", day, noteModal.commune_name] });
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore nota"),
    });

    const deleteCocNote = useMutation({
        mutationFn: (id) => api.deleteCocNote(id),
        onSuccess: async () => {
            toastOk("Nota eliminata");
            await qc.invalidateQueries({ queryKey: ["cocNotes", day, noteModal.commune_name] });
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore eliminazione nota"),
    });

    // Ordinanza upload+download
    const uploadCocOrdinance = useMutation({
        mutationFn: ({ day, commune_name, file }) => api.uploadCocOrdinance({ day, commune_name, file }),
        onSuccess: async () => {
            toastOk("PDF caricato");
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
        onError: (e) => toastErr(e, "Errore upload PDF"),
    });

    async function doDownloadPdf(commune_name) {
        try {
            const { blob, filename } = await api.downloadCocOrdinance({ day, commune_name });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename || "ordinanza.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toastOk("Download avviato");
        } catch (e) {
            toastErr(e, "Errore download PDF");
        }
    }

    /* ================= SAFETY (DB + static fallback) ================= */

    const safetyStatic = useMemo(() => safetyBellunoContactsAll(), []);

    const [safetySearch, setSafetySearch] = useState("");
    const [safetyPage, setSafetyPage] = useState(1);

    // lista DB (non dipende dal day)
    const safetyQ = useQuery({
        queryKey: ["safetyContacts"],
        queryFn: () => api.listSafetyContacts(false),
    });

    const safetyDb = safetyQ.data?.contacts || [];

    // fingerprint per dedup (static vs db)
    function fp(row) {
        return `${safeStr(row.operator).trim().toLowerCase()}|${safeStr(row.interno).trim().toLowerCase()}|${safeStr(row.external_dial).trim().toLowerCase()}`;
    }

    const safetyMerged = useMemo(() => {
        const dbMap = new Map();
        for (const r of safetyDb) dbMap.set(fp(r), true);

        const staticsNotInDb = safetyStatic
            .map((r) => ({ ...r, _source: "static" }))
            .filter((r) => !dbMap.has(fp(r)));

        const dbRows = safetyDb.map((r) => ({ ...r, _source: "db" }));

        const all = [...dbRows, ...staticsNotInDb];

        const q = safetySearch.trim().toLowerCase();
        if (!q) return all;

        return all.filter((x) =>
            `${safeStr(x.operator)} ${safeStr(x.interno)} ${safeStr(x.external_dial)} ${safeStr(x.responder_group)} ${safeStr(x.responder_digit)} ${safeStr(x.responder_note)}`
                .toLowerCase()
                .includes(q)
        );
    }, [safetyDb, safetyStatic, safetySearch]);

    useEffect(() => setSafetyPage(1), [safetySearch]);

    const safetyPaged = useMemo(() => paginate(safetyMerged, safetyPage, PER_PAGE), [safetyMerged, safetyPage]);

    // modali Safety
    const [safetyAddModal, setSafetyAddModal] = useState({
        open: false,
        mode: "create", // create | edit
        id: null,
        operator: "",
        interno: "",
        external_dial: "",
        responder_group: "",
        responder_digit: "",
        responder_note: "",
    });

    const [safetyNotesModal, setSafetyNotesModal] = useState({
        open: false,
        contactId: null,
        title: "",
    });
    const [newSafetyNote, setNewSafetyNote] = useState("");

    // notes query per contatto
    const safetyNotesQ = useQuery({
        queryKey: ["safetyNotes", safetyNotesModal.contactId],
        queryFn: () => api.listSafetyContactNotes(safetyNotesModal.contactId),
        enabled: Boolean(safetyNotesModal.open && safetyNotesModal.contactId),
    });

    // helper: se clicchi “note” su static, crea contatto DB al volo e poi apre note
    async function ensureDbContactId(row) {
        if (row?._source === "db" && row?.id) return row.id;

        // static -> crea nel DB (editor/admin richiesto dal backend)
        const created = await api.createSafetyContact({
            operator: row.operator || null,
            interno: row.interno || null,
            external_dial: row.external_dial || null,
            responder_group: row.responder_group || null,
            responder_digit: row.responder_digit || null,
            responder_note: row.responder_note || null,
        });

        const id = created?.contact?.id;
        await qc.invalidateQueries({ queryKey: ["safetyContacts"] });
        return id;
    }

    // mutations Safety (con optimistic update sulla lista)
    const createSafetyContact = useMutation({
        mutationFn: (payload) => api.createSafetyContact(payload),
        onSuccess: async () => {
            toastOk("Contatto salvato");
            await qc.invalidateQueries({ queryKey: ["safetyContacts"] });
            setSafetyAddModal({
                open: false,
                mode: "create",
                id: null,
                operator: "",
                interno: "",
                external_dial: "",
                responder_group: "",
                responder_digit: "",
                responder_note: "",
            });
        },
        onError: (e) => toastErr(e, "Errore contatto"),
    });

    const updateSafetyContact = useMutation({
        mutationFn: ({ id, patch }) => api.updateSafetyContact(id, patch),
        onSuccess: async () => {
            toastOk("Contatto aggiornato");
            await qc.invalidateQueries({ queryKey: ["safetyContacts"] });
            setSafetyAddModal({
                open: false,
                mode: "create",
                id: null,
                operator: "",
                interno: "",
                external_dial: "",
                responder_group: "",
                responder_digit: "",
                responder_note: "",
            });
        },
        onError: (e) => toastErr(e, "Errore update contatto"),
    });

    const deleteSafetyContact = useMutation({
        mutationFn: (id) => api.deleteSafetyContact(id),
        onSuccess: async () => {
            toastOk("Contatto eliminato");
            await qc.invalidateQueries({ queryKey: ["safetyContacts"] });
        },
        onError: (e) => toastErr(e, "Errore delete contatto"),
    });

    const addSafetyNote = useMutation({
        mutationFn: ({ contactId, body }) => api.addSafetyContactNote(contactId, body),
        onSuccess: async () => {
            toastOk("Nota aggiunta");
            setNewSafetyNote("");
            await qc.invalidateQueries({ queryKey: ["safetyNotes", safetyNotesModal.contactId] });
        },
        onError: (e) => toastErr(e, "Errore nota"),
    });

    const deleteSafetyNote = useMutation({
        mutationFn: (noteId) => api.deleteSafetyNote(noteId),
        onSuccess: async () => {
            toastOk("Nota eliminata");
            await qc.invalidateQueries({ queryKey: ["safetyNotes", safetyNotesModal.contactId] });
        },
        onError: (e) => toastErr(e, "Errore elimina nota"),
    });

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
                                <div className="text-lg font-extrabold text-neutral-900">COC — Stato / Ordinanza / Note / Recapiti</div>
                                <div className={cx("text-xs mt-1", UI.dim2)}>apri/chiudi • ordinanza • note db • recapiti db</div>
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

                            <MiniBtn tone="coc" title="Aggiungi Comune (DB)" onClick={() => setCocAddModalOpen(true)}>
                                <Plus size={16} /> Comune
                            </MiniBtn>
                        </div>
                    </div>

                    <div className="mt-4">
                        <Pager page={cocPaged.page} pages={cocPaged.pages} total={cocPaged.total} perPage={PER_PAGE} onPage={setCocPage} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {cocPaged.slice.map((c) => {
                            const isOpen = Boolean(c.overlay?.isOpen);
                            const ordinance = Boolean(c.overlay?.hasOrd);
                            const hasPdf = Boolean(c.overlay?.hasPdf);
                            const contactsDb = c.overlay?.contactsDb || [];

                            const topBar = isOpen
                                ? "bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500"
                                : "bg-gradient-to-r from-neutral-400 via-neutral-300 to-neutral-200";

                            return (
                                <div key={c.id} className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                                    <div className={cx("h-1.5", topBar)} />
                                    <div className="p-5 bg-white/40">
                                        <div className="min-w-0">
                                            <div className="font-extrabold text-neutral-900 truncate">{c.commune}</div>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Chip tone={isOpen ? "good" : "neutral"}>{isOpen ? "COC aperto" : "COC chiuso"}</Chip>
                                                <Chip tone={ordinance ? "warn" : "neutral"}>{ordinance ? "Ordinanza: sì" : "Ordinanza: no"}</Chip>
                                                {hasPdf ? <Chip tone="info">PDF</Chip> : null}
                                            </div>

                                            <div className={cx("mt-3 text-xs", UI.dim2)}>
                                                {c.overlay?.openMode ? `modo: ${c.overlay.openMode}` : ""}
                                                {c.overlay?.openFrom && c.overlay?.openTo ? ` • ${c.overlay.openFrom}–${c.overlay.openTo}` : ""}
                                                {c.overlay?.room_phone ? ` • sala: ${c.overlay.room_phone}` : ""}
                                            </div>

                                            {contactsDb.length ? (
                                                <div className="mt-3 space-y-1">
                                                    {contactsDb.slice(0, 2).map((r) => (
                                                        <div key={r.id} className="text-[11px] text-neutral-700 font-semibold truncate">
                                                            {r.contact_name}: {r.phone}
                                                        </div>
                                                    ))}
                                                    {contactsDb.length > 2 ? (
                                                        <div className="text-[10px] text-neutral-500">+{contactsDb.length - 2} altri</div>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <div className="mt-3 text-[11px] text-neutral-500">Nessun recapito DB</div>
                                            )}
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <MiniBtn
                                                tone="coc"
                                                title={isOpen ? "Chiudi COC" : "Apri COC"}
                                                onClick={() =>
                                                    upsertCocStatus.mutate({
                                                        day,
                                                        commune_name: c.commune,
                                                        is_open: !isOpen,
                                                        open_mode: c.overlay?.openMode || "DAY",
                                                        open_from: null,
                                                        open_to: null,
                                                        room_phone: c.overlay?.room_phone || null,
                                                    })
                                                }
                                            >
                                                {isOpen ? <DoorClosed size={16} /> : <DoorOpen size={16} />}
                                                {isOpen ? "Chiudi" : "Apri"}
                                            </MiniBtn>

                                            <MiniBtn tone="coc" title="Ordinanza (upload/scarica)" onClick={() => setOrdModal({ open: true, commune_name: c.commune })}>
                                                <FileCheck2 size={16} /> Ordin.
                                            </MiniBtn>

                                            <MiniBtn
                                                tone="coc"
                                                title="Recapiti (static)"
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

                                            <MiniBtn
                                                tone="coc"
                                                title="Note DB"
                                                onClick={() => {
                                                    setNoteModal({ open: true, commune_name: c.commune, title: `Note — ${c.commune}` });
                                                    setNewNoteBody("");
                                                }}
                                            >
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
                                title="Aggiungi contatto (DB)"
                                onClick={() =>
                                    setSafetyAddModal({
                                        open: true,
                                        mode: "create",
                                        id: null,
                                        operator: "",
                                        interno: "",
                                        external_dial: "",
                                        responder_group: "",
                                        responder_digit: "",
                                        responder_note: "",
                                    })
                                }
                            >
                                <Plus size={16} /> Contatto
                            </MiniBtn>
                        </div>
                    </div>

                    {safetyQ.isLoading ? <div className="mt-3 text-sm text-neutral-500">Carico contatti…</div> : null}
                    {safetyQ.error ? <div className="mt-3 text-sm text-rose-700">{safetyQ.error.message}</div> : null}

                    <div className="mt-4">
                        <Pager page={safetyPaged.page} pages={safetyPaged.pages} total={safetyPaged.total} perPage={PER_PAGE} onPage={setSafetyPage} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {safetyPaged.slice.map((c) => {
                            const isDb = c._source === "db";
                            return (
                                <div key={`${c._source}-${c.id ?? fp(c)}`} className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                                    <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500" />
                                    <div className="p-5 bg-white/40">
                                        <div className="min-w-0">
                                            <div className="font-extrabold text-neutral-900 truncate">
                                                {c.operator || "—"} {!isDb ? <span className="text-[10px] text-neutral-500">• static</span> : null}
                                            </div>

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

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <MiniBtn
                                                tone="ops"
                                                title="Note (DB)"
                                                onClick={async () => {
                                                    try {
                                                        const id = await ensureDbContactId(c);
                                                        setSafetyNotesModal({ open: true, contactId: id, title: `Note — ${c.operator || "—"}` });
                                                        setNewSafetyNote("");
                                                    } catch (e) {
                                                        toastErr(e, "Errore apertura note");
                                                    }
                                                }}
                                            >
                                                <StickyNote size={16} /> Note
                                            </MiniBtn>

                                            <MiniBtn
                                                tone="ops"
                                                title="Dettagli"
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

                                            <MiniBtn
                                                tone="ops"
                                                title="Modifica (DB)"
                                                onClick={async () => {
                                                    try {
                                                        const id = await ensureDbContactId(c);
                                                        setSafetyAddModal({
                                                            open: true,
                                                            mode: "edit",
                                                            id,
                                                            operator: c.operator || "",
                                                            interno: c.interno || "",
                                                            external_dial: c.external_dial || "",
                                                            responder_group: c.responder_group || "",
                                                            responder_digit: c.responder_digit || "",
                                                            responder_note: c.responder_note || "",
                                                        });
                                                    } catch (e) {
                                                        toastErr(e, "Errore modifica");
                                                    }
                                                }}
                                            >
                                                <Pencil size={16} /> Mod.
                                            </MiniBtn>

                                            <MiniBtn
                                                tone="danger"
                                                title="Elimina (DB)"
                                                onClick={async () => {
                                                    try {
                                                        const id = await ensureDbContactId(c);
                                                        const ok = await confirmDanger("Eliminare questo contatto e tutte le note?");
                                                        if (!ok) return;
                                                        deleteSafetyContact.mutate(id);
                                                    } catch (e) {
                                                        toastErr(e, "Errore elimina");
                                                    }
                                                }}
                                            >
                                                <Trash2 size={16} /> Del
                                            </MiniBtn>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* MODALE DETTAGLI */}
            <Modal
                open={detailsModal.open}
                title={detailsModal.title}
                onClose={() => setDetailsModal({ open: false, title: "", contentLabel: "", contentText: "", kind: "text" })}
            >
                <div className="space-y-3">
                    <DetailsBody label={detailsModal.contentLabel} text={detailsModal.contentText} kind={detailsModal.kind} />
                    <div className="flex justify-end">
                        <MiniBtn tone="neutral" title="Chiudi" onClick={() => setDetailsModal({ open: false, title: "", contentLabel: "", contentText: "", kind: "text" })}>
                            <X size={16} /> Chiudi
                        </MiniBtn>
                    </div>
                </div>
            </Modal>

            {/* MODALE ADD COC */}
            <Modal open={cocAddModalOpen} title="Aggiungi Comune (COC - DB)" onClose={() => setCocAddModalOpen(false)}>
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const name = cocAddForm.name.trim();
                        if (!name) return;

                        const contacts = (cocAddForm.contacts || [])
                            .map((c) => ({ contact_name: c.contact_name.trim(), phone: c.phone.trim() }))
                            .filter((c) => c.contact_name && c.phone);

                        upsertCocCommune.mutate({ name, contacts });

                        const open_mode = cocAddForm.open_mode === "H24" ? "H24" : "DAY";
                        const open_from = cocAddForm.is_open && open_mode === "DAY" ? `${day}T${cocAddForm.open_from}` : null;
                        const open_to = cocAddForm.is_open && open_mode === "DAY" ? `${day}T${cocAddForm.open_to}` : null;

                        upsertCocStatus.mutate({
                            day,
                            commune_name: name,
                            is_open: Boolean(cocAddForm.is_open),
                            open_mode,
                            open_from,
                            open_to,
                            room_phone: cocAddForm.room_phone || null,
                        });
                    }}
                >
                    <Field label="Nome Comune">
                        <input
                            value={cocAddForm.name}
                            onChange={(e) => setCocAddForm((s) => ({ ...s, name: e.target.value }))}
                            placeholder="Es: Valle di Cadore"
                            className={cx(UI.input, "w-full")}
                            required
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <label className="rounded-3xl bg-white/55 ring-1 ring-white/45 px-4 py-3 text-sm flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={cocAddForm.is_open}
                                onChange={(e) => setCocAddForm((s) => ({ ...s, is_open: e.target.checked }))}
                            />
                            COC aperto
                        </label>

                        <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 px-4 py-3">
                            <div className="text-[11px] uppercase tracking-wide text-neutral-500 font-extrabold">Modalità</div>
                            <div className="mt-2">
                                <select
                                    value={cocAddForm.open_mode}
                                    onChange={(e) => setCocAddForm((s) => ({ ...s, open_mode: e.target.value }))}
                                    className={cx("rounded-2xl px-4 py-2 text-sm outline-none bg-white/75 ring-1 ring-white/45 w-full")}
                                    disabled={!cocAddForm.is_open}
                                >
                                    <option value="DAY">DIURNO</option>
                                    <option value="H24">H24</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {cocAddForm.is_open && cocAddForm.open_mode === "DAY" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Field label="Aperto dal">
                                <input
                                    type="time"
                                    value={cocAddForm.open_from}
                                    onChange={(e) => setCocAddForm((s) => ({ ...s, open_from: e.target.value }))}
                                    className={cx(UI.input, "w-full")}
                                />
                            </Field>
                            <Field label="Aperto al">
                                <input
                                    type="time"
                                    value={cocAddForm.open_to}
                                    onChange={(e) => setCocAddForm((s) => ({ ...s, open_to: e.target.value }))}
                                    className={cx(UI.input, "w-full")}
                                />
                            </Field>
                        </div>
                    ) : null}

                    <Field label="Telefono sala (opzionale)">
                        <input
                            value={cocAddForm.room_phone}
                            onChange={(e) => setCocAddForm((s) => ({ ...s, room_phone: e.target.value }))}
                            placeholder="Es: 0437-xxx"
                            className={cx(UI.input, "w-full")}
                        />
                    </Field>

                    <Field label="Recapiti (nome + telefono)">
                        <div className="space-y-2">
                            {(cocAddForm.contacts || []).map((c, idx) => (
                                <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                    <input
                                        value={c.contact_name}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setCocAddForm((s) => {
                                                const next = [...(s.contacts || [])];
                                                next[idx] = { ...next[idx], contact_name: v };
                                                return { ...s, contacts: next };
                                            });
                                        }}
                                        placeholder="Nome contatto"
                                        className={cx(UI.input, "sm:col-span-2")}
                                    />
                                    <input
                                        value={c.phone}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setCocAddForm((s) => {
                                                const next = [...(s.contacts || [])];
                                                next[idx] = { ...next[idx], phone: v };
                                                return { ...s, contacts: next };
                                            });
                                        }}
                                        placeholder="Telefono"
                                        className={cx(UI.input, "sm:col-span-2")}
                                    />
                                    <MiniBtn
                                        tone="danger"
                                        title="Rimuovi"
                                        onClick={() =>
                                            setCocAddForm((s) => {
                                                const next = [...(s.contacts || [])];
                                                next.splice(idx, 1);
                                                return { ...s, contacts: next.length ? next : [{ contact_name: "", phone: "" }] };
                                            })
                                        }
                                    >
                                        <Trash2 size={16} /> Rimuovi
                                    </MiniBtn>
                                </div>
                            ))}

                            <MiniBtn
                                tone="coc"
                                title="Aggiungi recapito"
                                onClick={() => setCocAddForm((s) => ({ ...s, contacts: [...(s.contacts || []), { contact_name: "", phone: "" }] }))}
                            >
                                <Plus size={16} /> Recapito
                            </MiniBtn>
                        </div>
                    </Field>

                    <div className="flex items-center justify-end gap-2">
                        <MiniBtn tone="neutral" title="Annulla" onClick={() => setCocAddModalOpen(false)}>
                            Annulla
                        </MiniBtn>
                        <button className="rounded-2xl px-4 py-2 text-sm font-extrabold bg-neutral-900 text-white hover:bg-neutral-800">
                            Salva Comune
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODALE NOTE COC */}
            <Modal open={noteModal.open} title={noteModal.title} onClose={() => setNoteModal({ open: false, title: "", commune_name: "" })}>
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
                                            {n.created_by_name || "Utente"} • {fmtTs(n.created_at)}
                                        </div>
                                        <div className="mt-2 text-sm text-neutral-900 whitespace-pre-wrap">{n.body}</div>
                                        <div className="mt-3 flex justify-end">
                                            <MiniBtn
                                                tone="danger"
                                                title="Elimina nota"
                                                onClick={async () => {
                                                    const ok = await confirmDanger("Eliminare questa nota?");
                                                    if (!ok) return;
                                                    deleteCocNote.mutate(n.id);
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
                        <textarea
                            value={newNoteBody}
                            onChange={(e) => setNewNoteBody(e.target.value)}
                            rows={4}
                            className={cx(UI.input, "w-full")}
                            placeholder="Scrivi nota operativa…"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                            <MiniBtn tone="neutral" title="Chiudi" onClick={() => setNoteModal({ open: false, title: "", commune_name: "" })}>
                                <X size={16} /> Chiudi
                            </MiniBtn>
                            <MiniBtn
                                tone="coc"
                                title="Pubblica"
                                disabled={!newNoteBody.trim() || createCocNote.isPending}
                                onClick={() =>
                                    createCocNote.mutate({
                                        day,
                                        commune_name: noteModal.commune_name,
                                        body: newNoteBody.trim(),
                                    })
                                }
                            >
                                <StickyNote size={16} /> {createCocNote.isPending ? "Salvo…" : "Pubblica"}
                            </MiniBtn>
                        </div>
                    </Field>
                </div>
            </Modal>

            {/* MODALE ORDINANZA */}
            <Modal open={ordModal.open} title={`Ordinanza — ${ordModal.commune_name || ""}`} onClose={() => setOrdModal({ open: false, commune_name: "" })}>
                <div className="space-y-3">
                    <Field label="Carica PDF (solo application/pdf)">
                        <input
                            type="file"
                            accept="application/pdf"
                            className="block w-full text-sm"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                uploadCocOrdinance.mutate({ day, commune_name: ordModal.commune_name, file });
                            }}
                        />
                        <div className="mt-2 text-xs text-neutral-500">Max 20MB.</div>
                    </Field>

                    <Field label="Scarica PDF">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-neutral-700">Se il PDF è presente puoi scaricarlo.</div>
                            <MiniBtn tone="coc" title="Scarica" onClick={() => doDownloadPdf(ordModal.commune_name)}>
                                <Download size={16} /> Scarica
                            </MiniBtn>
                        </div>
                    </Field>

                    <div className="flex justify-end">
                        <MiniBtn tone="neutral" title="Chiudi" onClick={() => setOrdModal({ open: false, commune_name: "" })}>
                            <X size={16} /> Chiudi
                        </MiniBtn>
                    </div>
                </div>
            </Modal>

            {/* MODALE ADD/EDIT SAFETY */}
            <Modal
                open={safetyAddModal.open}
                title={safetyAddModal.mode === "edit" ? "Modifica contatto — Safety Belluno" : "Aggiungi contatto — Safety Belluno"}
                onClose={() => setSafetyAddModal((s) => ({ ...s, open: false }))}
            >
                <form
                    className="space-y-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);

                        const payload = {
                            operator: String(fd.get("operator") || "").trim() || null,
                            interno: String(fd.get("interno") || "").trim() || null,
                            external_dial: String(fd.get("external_dial") || "").trim() || null,
                            responder_group: String(fd.get("responder_group") || "").trim() || null,
                            responder_digit: String(fd.get("responder_digit") || "").trim() || null,
                            responder_note: String(fd.get("responder_note") || "").trim() || null,
                        };

                        if (!payload.operator && !payload.interno) return;

                        if (safetyAddModal.mode === "edit" && safetyAddModal.id) {
                            updateSafetyContact.mutate({ id: safetyAddModal.id, patch: payload });
                        } else {
                            createSafetyContact.mutate(payload);
                        }
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

            {/* MODALE NOTE SAFETY */}
            <Modal
                open={safetyNotesModal.open}
                title={safetyNotesModal.title}
                onClose={() => setSafetyNotesModal({ open: false, contactId: null, title: "" })}
            >
                <div className="space-y-3">
                    {safetyNotesQ.isLoading ? (
                        <div className="text-sm text-neutral-500">Carico note…</div>
                    ) : safetyNotesQ.error ? (
                        <div className="text-sm text-rose-700">{safetyNotesQ.error.message}</div>
                    ) : (
                        <div className="space-y-2">
                            {(safetyNotesQ.data?.rows || []).length ? (
                                (safetyNotesQ.data?.rows || []).map((n) => (
                                    <div key={n.id} className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                                        <div className="text-[11px] font-extrabold text-neutral-700">
                                            {n.created_by_name || "Utente"} • {fmtTs(n.created_at)}
                                        </div>
                                        <div className="mt-2 text-sm text-neutral-900 whitespace-pre-wrap">{n.body}</div>
                                        <div className="mt-3 flex justify-end">
                                            <MiniBtn
                                                tone="danger"
                                                title="Elimina nota"
                                                onClick={async () => {
                                                    const ok = await confirmDanger("Eliminare questa nota?");
                                                    if (!ok) return;
                                                    deleteSafetyNote.mutate(n.id);
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

                    <Field label="Nuova nota (append)">
                        <textarea
                            value={newSafetyNote}
                            onChange={(e) => setNewSafetyNote(e.target.value)}
                            rows={4}
                            className={cx(UI.input, "w-full")}
                            placeholder="Aggiungi nota…"
                        />
                        <div className="mt-3 flex justify-end gap-2">
                            <MiniBtn tone="neutral" title="Chiudi" onClick={() => setSafetyNotesModal({ open: false, contactId: null, title: "" })}>
                                <X size={16} /> Chiudi
                            </MiniBtn>
                            <MiniBtn
                                tone="ops"
                                title="Pubblica"
                                disabled={!newSafetyNote.trim() || addSafetyNote.isPending}
                                onClick={() => addSafetyNote.mutate({ contactId: safetyNotesModal.contactId, body: newSafetyNote.trim() })}
                            >
                                <StickyNote size={16} /> {addSafetyNote.isPending ? "Salvo…" : "Pubblica"}
                            </MiniBtn>
                        </div>
                    </Field>
                </div>
            </Modal>
        </div>
    );
}
