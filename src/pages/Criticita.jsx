// src/pages/Criticita.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import Card from "../components/Card.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useMemo, useState, useEffect, useRef } from "react";
import {
    Search,
    LayoutList,
    Columns3,
    ChevronLeft,
    ChevronRight,
    X,
    AlertTriangle,
    MessageSquarePlus,
} from "lucide-react";

const STATUS = [
    { key: "aperta", label: "Aperta" },
    { key: "in_lavorazione", label: "In lavorazione" },
    { key: "risolta", label: "Risolta" },
    { key: "chiusa", label: "Chiusa" },
];

const SEVERITY = [
    { key: "bassa", label: "Bassa" },
    { key: "media", label: "Media" },
    { key: "alta", label: "Alta" },
    { key: "critica", label: "Critica" },
];

/* ------------------ helpers ------------------ */
function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}
function safeStr(x) {
    return x === null || x === undefined ? "" : String(x);
}
function toMidnight(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function isLate(it) {
    if (!it?.day) return false;
    if (it.status === "chiusa") return false;
    const t = toMidnight(new Date());
    const d = toMidnight(new Date(it.day));
    return d.getTime() < t.getTime();
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

function PrimaryBtn({ className, ...props }) {
    return (
        <button
            {...props}
            className={cx(
                "rounded-2xl px-4 py-2 text-sm font-extrabold transition",
                "bg-neutral-900 text-white hover:bg-neutral-800",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                "disabled:opacity-50",
                className
            )}
        />
    );
}

function SoftBtn({ className, ...props }) {
    return (
        <button
            {...props}
            className={cx(
                "rounded-2xl px-3 py-2 text-sm transition",
                "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm ring-1 ring-white/45",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                className
            )}
        />
    );
}

function Tag({ tone = "neutral", children }) {
    const tones = {
        neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
        indigo: "bg-indigo-500/10 text-indigo-900 ring-1 ring-indigo-500/15",
        emerald: "bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/15",
        amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
        rose: "bg-rose-500/10 text-rose-900 ring-1 ring-rose-500/15",
        sky: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
        fuchsia: "bg-fuchsia-500/10 text-fuchsia-900 ring-1 ring-fuchsia-500/15",
    };
    return (
        <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide", tones[tone] || tones.neutral)}>
            {children}
        </span>
    );
}

function StatusPill({ status }) {
    const map = {
        aperta: { tone: "sky", label: "Aperta" },
        in_lavorazione: { tone: "amber", label: "In lavorazione" },
        risolta: { tone: "emerald", label: "Risolta" },
        chiusa: { tone: "neutral", label: "Chiusa" },
    };
    const s = map[status] || { tone: "neutral", label: status };
    return <Tag tone={s.tone}>{s.label}</Tag>;
}

function SeverityPill({ severity }) {
    const map = {
        bassa: { tone: "emerald", icon: "🟢", label: "Bassa" },
        media: { tone: "sky", icon: "🔵", label: "Media" },
        alta: { tone: "amber", icon: "🟠", label: "Alta" },
        critica: { tone: "rose", icon: "🔴", label: "Critica" },
    };
    const s = map[severity] || { tone: "neutral", icon: "⚪", label: severity };
    return (
        <Tag tone={s.tone}>
            <span className="mr-1">{s.icon}</span>
            {s.label}
        </Tag>
    );
}

function Select({ className, ...props }) {
    return (
        <select
            {...props}
            className={cx(
                "rounded-2xl px-4 py-3 text-sm outline-none transition",
                "bg-white/75 text-neutral-900 shadow-sm ring-1 ring-white/45",
                "focus:ring-4 focus:ring-indigo-500/15",
                className
            )}
        />
    );
}

/* ------------------ Drawer (no dark mode) ------------------ */
function Drawer({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl ring-1 ring-black/10">
                <div className="relative overflow-hidden border-b border-black/5 px-5 py-4">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
                    <div className="absolute -bottom-28 -left-28 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-xs font-extrabold tracking-wide text-indigo-700">Dettaglio Segnalazione</div>
                            <div className="truncate text-lg font-extrabold text-neutral-900">{title}</div>
                        </div>
                        <SoftBtn onClick={onClose} title="Chiudi pannello">
                            <X size={16} /> Chiudi
                        </SoftBtn>
                    </div>
                </div>
                <div className="h-[calc(100%-72px)] overflow-y-auto px-5 py-5">{children}</div>
            </div>
        </div>
    );
}

/* ------------------ Pager ------------------ */
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

/* ------------------ Segnalazione card ------------------ */
function SegnalazioneCard({ it, canWrite, onOpen, onUpdateStatus }) {
    const late = isLate(it);

    const leftBar =
        it.severity === "critica"
            ? "from-rose-500 via-fuchsia-500 to-indigo-500"
            : it.severity === "alta"
                ? "from-amber-500 via-rose-500 to-fuchsia-500"
                : it.severity === "media"
                    ? "from-sky-500 via-indigo-500 to-fuchsia-500"
                    : "from-emerald-500 via-sky-500 to-indigo-500";

    return (
        <div className="rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm">
            <div className={cx("h-1.5 bg-gradient-to-r", leftBar)} />
            <div className="p-5 bg-white/40">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate text-base font-extrabold text-neutral-900">{it.title}</div>
                            <StatusPill status={it.status} />
                            <SeverityPill severity={it.severity} />
                            {late ? (
                                <Tag tone="rose">
                                    <AlertTriangle size={14} className="inline mr-1" />
                                    IN RITARDO
                                </Tag>
                            ) : null}
                        </div>

                        <div className="mt-2 text-xs text-neutral-600 flex flex-wrap gap-x-3 gap-y-1">
                            <span>
                                Owner: <span className="text-neutral-900 font-semibold">{it.owner || "-"}</span>
                            </span>
                            <span>
                                Target:{" "}
                                <span className={cx("font-semibold", late ? "text-rose-700" : "text-neutral-900")}>
                                    {it.day ? new Date(it.day).toLocaleDateString() : "-"}
                                </span>
                            </span>
                        </div>
                    </div>

                    <SoftBtn onClick={onOpen} title="Apri dettagli">
                        Apri
                    </SoftBtn>
                </div>

                {canWrite ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Select value={it.status} onChange={(e) => onUpdateStatus(e.target.value)}>
                            {STATUS.map((s) => (
                                <option key={s.key} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

/* ------------------ page ------------------ */
export default function Criticita() {
    const { canWrite } = useAuth();
    const qc = useQueryClient();

    const [view, setView] = useState("lista"); // "lista" | "board"
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("tutti");
    const [severityFilter, setSeverityFilter] = useState("tutte");
    const [ownerFilter, setOwnerFilter] = useState("");

    const [openIssueId, setOpenIssueId] = useState(null);

    // paginazione lista (4x4 = 16)
    const PER_PAGE = 16;
    const [page, setPage] = useState(1);

    const issues = useQuery({
        queryKey: ["issues"],
        queryFn: () => api.list("issues"),
    });

    const rows = issues.data?.rows || [];

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        const oo = ownerFilter.trim().toLowerCase();

        return rows
            .filter((it) => {
                const hay = `${safeStr(it.title)}\n${safeStr(it.description)}\n${safeStr(it.owner)}`.toLowerCase();
                const okQ = !qq || hay.includes(qq);
                const okStatus = statusFilter === "tutti" || it.status === statusFilter;
                const okSev = severityFilter === "tutte" || it.severity === severityFilter;
                const okOwner = !oo || String(it.owner || "").toLowerCase().includes(oo);
                return okQ && okStatus && okSev && okOwner;
            })
            .sort((a, b) => {
                const sevRank = { critica: 0, alta: 1, media: 2, bassa: 3 };
                const ra = sevRank[a.severity] ?? 9;
                const rb = sevRank[b.severity] ?? 9;
                if (ra !== rb) return ra - rb;

                const da = a.day ? new Date(a.day).getTime() : a.created_at ? new Date(a.created_at).getTime() : 0;
                const db = b.day ? new Date(b.day).getTime() : b.created_at ? new Date(b.created_at).getTime() : 0;
                return db - da;
            });
    }, [rows, q, statusFilter, severityFilter, ownerFilter]);

    // reset pagina quando cambiano filtri/search
    useEffect(() => {
        setPage(1);
    }, [q, statusFilter, severityFilter, ownerFilter]);

    const paged = useMemo(() => {
        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / PER_PAGE));
        const p = clamp(page, 1, pages);
        const start = (p - 1) * PER_PAGE;
        return { slice: filtered.slice(start, start + PER_PAGE), total, pages, page: p };
    }, [filtered, page]);

    const counts = useMemo(() => {
        const c = { totale: rows.length };
        for (const s of STATUS) c[s.key] = rows.filter((x) => x.status === s.key).length;
        return c;
    }, [rows]);

    const grouped = useMemo(() => {
        const g = Object.fromEntries(STATUS.map((s) => [s.key, []]));
        for (const it of filtered) (g[it.status] || (g[it.status] = [])).push(it);
        return g;
    }, [filtered]);

    const selectedIssue = useMemo(() => {
        return rows.find((x) => x.id === openIssueId) || null;
    }, [rows, openIssueId]);

    const comments = useQuery({
        queryKey: ["issue_comments", openIssueId],
        queryFn: () => api.issueComments(openIssueId),
        enabled: !!openIssueId,
    });

    const create = useMutation({
        mutationFn: (payload) => api.create("issues", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
    });

    const update = useMutation({
        mutationFn: ({ id, patch }) => api.update("issues", id, patch),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
    });

    const addComment = useMutation({
        mutationFn: ({ id, message }) => api.addIssueComment(id, message),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["issue_comments", openIssueId] }),
    });

    const [newFormKey, setNewFormKey] = useState(0);

    const scrollNewRef = useRef(null);

    return (
        <div className="space-y-6">
            {/* HERO */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className="p-6 bg-white/45 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
                    <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs font-extrabold tracking-wide text-neutral-600">SISTEMA SEGNALAZIONE</div>
                                <Tag tone="fuchsia">OPERATIVO</Tag>
                            </div>
                            <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">Criticità</h1>
                            <div className={cx("mt-2 text-xs", UI.dim2)}>Apertura → presa in carico → risoluzione</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex rounded-2xl p-1 bg-white/55 ring-1 ring-white/45 shadow-sm">
                                <button
                                    onClick={() => setView("lista")}
                                    className={cx(
                                        "rounded-xl px-3 py-2 text-sm font-extrabold transition flex items-center gap-2",
                                        view === "lista" ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-white/55"
                                    )}
                                >
                                    <LayoutList size={16} /> Lista
                                </button>
                                <button
                                    onClick={() => setView("board")}
                                    className={cx(
                                        "rounded-xl px-3 py-2 text-sm font-extrabold transition flex items-center gap-2",
                                        view === "board" ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-white/55"
                                    )}
                                >
                                    <Columns3 size={16} /> Board
                                </button>
                            </div>

                            {canWrite ? (
                                <PrimaryBtn
                                    onClick={() => {
                                        scrollNewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                >
                                    + Nuova Segnalazione
                                </PrimaryBtn>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className={cx(UI.card, UI.softRing)}>
                    <div className={UI.accent} />
                    <div className="p-5 bg-white/40">
                        <div className="text-xs font-extrabold text-neutral-600">Totale</div>
                        <div className="mt-2 text-3xl font-extrabold text-neutral-900">{counts.totale}</div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                            <div className="h-full w-2/3 bg-indigo-500/70" />
                        </div>
                    </div>
                </div>

                <div className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                    <div className="h-1.5 bg-gradient-to-r from-sky-500 to-indigo-500" />
                    <div className="p-5 bg-white/40">
                        <div className="text-xs font-extrabold text-sky-900/80">Aperte</div>
                        <div className="mt-2 text-3xl font-extrabold text-neutral-900">{counts.aperta ?? 0}</div>
                    </div>
                </div>

                <div className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                    <div className="h-1.5 bg-gradient-to-r from-amber-500 to-rose-500" />
                    <div className="p-5 bg-white/40">
                        <div className="text-xs font-extrabold text-amber-950/80">In lavorazione</div>
                        <div className="mt-2 text-3xl font-extrabold text-neutral-900">{counts.in_lavorazione ?? 0}</div>
                    </div>
                </div>

                <div className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                    <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-sky-500" />
                    <div className="p-5 bg-white/40">
                        <div className="text-xs font-extrabold text-emerald-900/80">Risolte</div>
                        <div className="mt-2 text-3xl font-extrabold text-neutral-900">{counts.risolta ?? 0}</div>
                    </div>
                </div>

                <div className={cx(UI.card, UI.softRing)}>
                    <div className={UI.accent} />
                    <div className="p-5 bg-white/40">
                        <div className="text-xs font-extrabold text-neutral-600">Chiuse</div>
                        <div className="mt-2 text-3xl font-extrabold text-neutral-900">{counts.chiusa ?? 0}</div>
                    </div>
                </div>
            </div>

            {/* NUOVO Segnalazione */}
            {canWrite ? (
                <div ref={scrollNewRef} className={cx(UI.card, UI.softRing)}>
                    <div className={UI.accent} />
                    <div className="p-5 bg-white/40">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-lg font-extrabold text-neutral-900">Nuovo Segnalazione</div>
                                <div className={cx("text-xs mt-1", UI.dim2)}>Compila e crea</div>
                            </div>
                        </div>

                        <form
                            key={newFormKey}
                            className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-6"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                create.mutate(
                                    {
                                        title: String(fd.get("title") || ""),
                                        description: String(fd.get("description") || ""),
                                        severity: String(fd.get("severity") || "media"),
                                        status: "aperta",
                                        owner: String(fd.get("owner") || ""),
                                        day: fd.get("day") ? String(fd.get("day")) : null,
                                    },
                                    {
                                        onSuccess: () => {
                                            setNewFormKey((x) => x + 1);
                                        },
                                    }
                                );
                            }}
                        >
                            <input
                                name="title"
                                required
                                placeholder='Titolo (es. “Errore sincronizzazione clienti”)'
                                className={cx(UI.input, "sm:col-span-3")}
                            />
                            <input name="owner" placeholder="Owner / reparto" className={cx(UI.input, "sm:col-span-2")} />
                            <Select name="severity" defaultValue="media" className="sm:col-span-1">
                                {SEVERITY.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.label.toLowerCase()}
                                    </option>
                                ))}
                            </Select>

                            <input name="day" type="date" className={cx(UI.input, "sm:col-span-2")} />
                            <textarea
                                name="description"
                                placeholder="Descrizione (passi per riprodurre, impatto, contesto)…"
                                className={cx(UI.input, "sm:col-span-6")}
                                rows={3}
                            />

                            <div className="sm:col-span-6 flex items-center justify-between gap-3">
                                <div className="text-xs text-neutral-600">
                                    Tip: includi <span className="font-extrabold text-neutral-900">impatto</span> e{" "}
                                    <span className="font-extrabold text-neutral-900">workaround</span>.
                                </div>
                                <PrimaryBtn disabled={create.isPending}>{create.isPending ? "Creazione..." : "Crea Segnalazione"}</PrimaryBtn>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {/* FILTRI */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-5 bg-white/40">
                    <div className="flex items-center gap-2">
                        <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                            <Search size={18} className="text-neutral-900" />
                        </div>
                        <div>
                            <div className="text-lg font-extrabold text-neutral-900">Ricerca & filtri</div>
                            <div className={cx("text-xs mt-1", UI.dim2)}>Riduci la lista</div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-12">
                        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca per titolo, descrizione, owner…" className="sm:col-span-5" />
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:col-span-3">
                            <option value="tutti">Tutti gli stati</option>
                            {STATUS.map((s) => (
                                <option key={s.key} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </Select>
                        <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="sm:col-span-2">
                            <option value="tutte">Tutte le severità</option>
                            {SEVERITY.map((s) => (
                                <option key={s.key} value={s.key}>
                                    {s.label}
                                </option>
                            ))}
                        </Select>
                        <Input value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} placeholder="Filtra owner…" className="sm:col-span-2" />
                    </div>
                </div>
            </div>

            {/* VISTA */}
            {view === "lista" ? (
                <div className={cx(UI.card, UI.softRing)}>
                    <div className={UI.accent} />
                    <div className="p-5 bg-white/40">
                        <div className="flex items-end justify-between gap-3">
                            <div>
                                <div className="text-lg font-extrabold text-neutral-900">Segnalazione</div>
                                <div className={cx("text-xs mt-1", UI.dim2)}>Paginati 4x4 (16)</div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <Pager page={paged.page} pages={paged.pages} total={paged.total} perPage={PER_PAGE} onPage={setPage} />
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                            {paged.slice.map((it) => (
                                <SegnalazioneCard
                                    key={it.id}
                                    it={it}
                                    canWrite={canWrite}
                                    onOpen={() => setOpenIssueId(it.id)}
                                    onUpdateStatus={(status) => update.mutate({ id: it.id, patch: { status } })}
                                />
                            ))}

                            {paged.total === 0 ? (
                                <div className="sm:col-span-2 xl:col-span-4 rounded-3xl bg-white/55 ring-1 ring-white/45 p-6 text-neutral-700">
                                    Nessun Segnalazione corrisponde ai filtri.
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-4">
                            <Pager page={paged.page} pages={paged.pages} total={paged.total} perPage={PER_PAGE} onPage={setPage} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                    {STATUS.map((col) => (
                        <div key={col.key} className={cx(UI.card, UI.softRing, "min-h-[240px]")}>
                            <div className={UI.accent} />
                            <div className="p-4 bg-white/40">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-extrabold text-neutral-900">{col.label}</div>
                                    <Tag tone="neutral">{(grouped[col.key] || []).length}</Tag>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {(grouped[col.key] || []).map((it) => (
                                        <button
                                            key={it.id}
                                            onClick={() => setOpenIssueId(it.id)}
                                            className={cx(
                                                "w-full text-left rounded-3xl overflow-hidden transition",
                                                "bg-white/55 ring-1 ring-white/45 shadow-sm hover:bg-white/70",
                                                "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                                            )}
                                        >
                                            <div
                                                className={cx(
                                                    "h-1.5 bg-gradient-to-r",
                                                    it.severity === "critica"
                                                        ? "from-rose-500 via-fuchsia-500 to-indigo-500"
                                                        : it.severity === "alta"
                                                            ? "from-amber-500 via-rose-500 to-fuchsia-500"
                                                            : it.severity === "media"
                                                                ? "from-sky-500 via-indigo-500 to-fuchsia-500"
                                                                : "from-emerald-500 via-sky-500 to-indigo-500"
                                                )}
                                            />
                                            <div className="p-4 bg-white/40">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="min-w-0 flex-1 truncate font-extrabold text-neutral-900">{it.title}</div>
                                                    <SeverityPill severity={it.severity} />
                                                </div>
                                                <div className="mt-2 text-xs text-neutral-600">
                                                    Owner: <span className="font-semibold text-neutral-900">{it.owner || "-"}</span>
                                                    {it.day ? (
                                                        <span className="ml-2">
                                                            • Target:{" "}
                                                            <span className={cx("font-semibold", isLate(it) ? "text-rose-700" : "text-neutral-900")}>
                                                                {new Date(it.day).toLocaleDateString()}
                                                            </span>
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="mt-2">
                                                    <StatusPill status={it.status} />
                                                </div>
                                            </div>
                                        </button>
                                    ))}

                                    {(grouped[col.key] || []).length === 0 ? (
                                        <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4 text-sm text-neutral-700">
                                            Nessun Segnalazione.
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DRAWER DETTAGLIO */}
            <Drawer open={!!openIssueId} onClose={() => setOpenIssueId(null)} title={selectedIssue ? selectedIssue.title : "Dettaglio"}>
                {!selectedIssue ? (
                    <div className="text-sm text-neutral-600">Caricamento…</div>
                ) : (
                    <div className="space-y-5">
                        <div className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                            <div className={UI.accent} />
                            <div className="p-5 bg-white/40">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusPill status={selectedIssue.status} />
                                    <SeverityPill severity={selectedIssue.severity} />
                                    <Tag tone="neutral">ID: {selectedIssue.id}</Tag>
                                    {isLate(selectedIssue) ? (
                                        <Tag tone="rose">
                                            <AlertTriangle size={14} className="inline mr-1" />
                                            IN RITARDO
                                        </Tag>
                                    ) : null}
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                                    <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                                        <div className="text-xs font-extrabold text-neutral-500">Owner</div>
                                        <div className="mt-2 font-extrabold text-neutral-900">{selectedIssue.owner || "-"}</div>
                                    </div>
                                    <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                                        <div className="text-xs font-extrabold text-neutral-500">Target</div>
                                        <div className={cx("mt-2 font-extrabold", isLate(selectedIssue) ? "text-rose-700" : "text-neutral-900")}>
                                            {selectedIssue.day ? new Date(selectedIssue.day).toLocaleDateString() : "-"}
                                        </div>
                                    </div>
                                    <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                                        <div className="text-xs font-extrabold text-neutral-500">Stato</div>
                                        <div className="mt-2 font-extrabold text-neutral-900">
                                            {STATUS.find((s) => s.key === selectedIssue.status)?.label || selectedIssue.status}
                                        </div>
                                    </div>
                                </div>

                                {canWrite ? (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <Select value={selectedIssue.status} onChange={(e) => update.mutate({ id: selectedIssue.id, patch: { status: e.target.value } })}>
                                            {STATUS.map((s) => (
                                                <option key={s.key} value={s.key}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </Select>

                                        <Select value={selectedIssue.severity} onChange={(e) => update.mutate({ id: selectedIssue.id, patch: { severity: e.target.value } })}>
                                            {SEVERITY.map((s) => (
                                                <option key={s.key} value={s.key}>
                                                    {s.label}
                                                </option>
                                            ))}
                                        </Select>

                                        <PrimaryBtn onClick={() => update.mutate({ id: selectedIssue.id, patch: { status: "in_lavorazione" } })}>
                                            Prendi in carico
                                        </PrimaryBtn>
                                        <PrimaryBtn className="bg-emerald-600 hover:bg-emerald-500" onClick={() => update.mutate({ id: selectedIssue.id, patch: { status: "risolta" } })}>
                                            Segna risolta
                                        </PrimaryBtn>
                                        <PrimaryBtn className="bg-rose-600 hover:bg-rose-500" onClick={() => update.mutate({ id: selectedIssue.id, patch: { status: "chiusa" } })}>
                                            Chiudi
                                        </PrimaryBtn>
                                    </div>
                                ) : null}

                                <div className="mt-5">
                                    <div className="text-xs font-extrabold tracking-wide text-indigo-700">Descrizione</div>
                                    <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-900">
                                        {selectedIssue.description || <span className="text-neutral-600">Nessuna descrizione.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={cx("rounded-3xl overflow-hidden bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
                            <div className="p-5 bg-white/40">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-extrabold text-neutral-900">Discussione</div>
                                    <Tag tone="neutral">{comments.isLoading ? "…" : `${(comments.data?.rows || []).length} msg`}</Tag>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {(comments.data?.rows || []).map((c) => (
                                        <div key={c.id} className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                                            <div className="text-xs text-neutral-600 font-extrabold">
                                                <span className="text-neutral-900">{c.author_name}</span> •{" "}
                                                {c.created_at ? new Date(c.created_at).toLocaleString() : "-"}
                                            </div>
                                            <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-900">{c.message}</div>
                                        </div>
                                    ))}

                                    {(comments.data?.rows || []).length === 0 ? (
                                        <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4 text-sm text-neutral-700">
                                            Nessun commento. Aggiungi aggiornamenti qui.
                                        </div>
                                    ) : null}
                                </div>

                                {canWrite ? (
                                    <form
                                        className="mt-4 flex gap-2"
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.currentTarget);
                                            const msg = String(fd.get("msg") || "");
                                            if (!msg.trim()) return;
                                            addComment.mutate({ id: selectedIssue.id, message: msg });
                                            e.currentTarget.reset();
                                        }}
                                    >
                                        <Input name="msg" placeholder="Scrivi un aggiornamento (fix, analisi, decisioni)…" className="flex-1" />
                                        <PrimaryBtn disabled={addComment.isPending}>
                                            <MessageSquarePlus size={16} className="inline mr-2" />
                                            {addComment.isPending ? "Invio…" : "Invia"}
                                        </PrimaryBtn>
                                    </form>
                                ) : (
                                    <div className="mt-3 text-sm text-neutral-600">Solo editor/admin possono commentare.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
}
