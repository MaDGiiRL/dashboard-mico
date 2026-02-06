import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import Card from "../components/Card.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useMemo, useState } from "react";

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

function clsx(...xs) {
    return xs.filter(Boolean).join(" ");
}

// Accent “brand” (senza toccare tailwind.config)
const BRAND = {
    ring: "focus:ring-indigo-400/30",
    primary: "bg-indigo-500 hover:bg-indigo-400 text-white",
    soft: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
    text: "text-indigo-300",
};

function StatusPill({ status }) {
    const map = {
        aperta: "bg-sky-500 text-white",
        in_lavorazione: "bg-amber-500 text-neutral-950",
        risolta: "bg-emerald-500 text-neutral-950",
        chiusa: "bg-neutral-600 text-white",
    };

    return (
        <span
            className={clsx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                map[status] || "bg-neutral-700 text-white"
            )}
            title="Stato"
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
            {STATUS.find((s) => s.key === status)?.label || status}
        </span>
    );
}

function SeverityBadge({ severity }) {
    const map = {
        bassa: { c: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30", icon: "🟢" },
        media: { c: "bg-sky-500/15 text-sky-200 border-sky-500/30", icon: "🔵" },
        alta: { c: "bg-amber-500/15 text-amber-200 border-amber-500/30", icon: "🟠" },
        critica: { c: "bg-rose-500/15 text-rose-200 border-rose-500/30", icon: "🔴" },
    };
    const s = map[severity] || { c: "bg-neutral-500/15 text-neutral-200 border-neutral-500/30", icon: "⚪" };

    return (
        <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", s.c)} title="Severità">
            <span className="leading-none">{s.icon}</span>
            {SEVERITY.find((x) => x.key === severity)?.label || severity}
        </span>
    );
}

function PrimaryButton({ className, ...props }) {
    return (
        <button
            {...props}
            className={clsx(
                "rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm transition",
                "focus:outline-none focus:ring-2",
                BRAND.ring,
                BRAND.primary,
                "disabled:opacity-50 disabled:hover:bg-indigo-500",
                className
            )}
        />
    );
}

function SecondaryButton({ className, ...props }) {
    return (
        <button
            {...props}
            className={clsx(
                "rounded-2xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 transition",
                "hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-700/40",
                className
            )}
        />
    );
}

function DangerButton({ className, ...props }) {
    return (
        <button
            {...props}
            className={clsx(
                "rounded-2xl px-3 py-2 text-sm font-semibold text-white transition",
                "bg-rose-500 hover:bg-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30",
                className
            )}
        />
    );
}

function Drawer({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl border-l border-neutral-800 bg-neutral-950">
                <div className="relative overflow-hidden border-b border-neutral-800 px-5 py-4">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className={clsx("text-xs font-medium", BRAND.text)}>Dettaglio ticket</div>
                            <div className="truncate text-lg font-semibold">{title}</div>
                        </div>
                        <SecondaryButton onClick={onClose}>Chiudi</SecondaryButton>
                    </div>
                </div>
                <div className="h-[calc(100%-72px)] overflow-y-auto px-5 py-5">{children}</div>
            </div>
        </div>
    );
}

export default function Criticita() {
    const { canWrite } = useAuth();
    const qc = useQueryClient();

    const [view, setView] = useState("lista"); // "lista" | "board"
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("tutti");
    const [severityFilter, setSeverityFilter] = useState("tutte");
    const [ownerFilter, setOwnerFilter] = useState("");

    const [openIssueId, setOpenIssueId] = useState(null);

    const issues = useQuery({
        queryKey: ["issues"],
        queryFn: () => api.list("issues"),
    });

    const selectedIssue = useMemo(() => {
        const rows = issues.data?.rows || [];
        return rows.find((x) => x.id === openIssueId) || null;
    }, [issues.data, openIssueId]);

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

    const rows = issues.data?.rows || [];

    const filtered = useMemo(() => {
        return rows
            .filter((it) => {
                const hay = `${it.title || ""}\n${it.description || ""}\n${it.owner || ""}`.toLowerCase();
                const okQ = !q.trim() || hay.includes(q.trim().toLowerCase());
                const okStatus = statusFilter === "tutti" || it.status === statusFilter;
                const okSev = severityFilter === "tutte" || it.severity === severityFilter;
                const okOwner = !ownerFilter.trim() || String(it.owner || "").toLowerCase().includes(ownerFilter.trim().toLowerCase());
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

    const severityBorder = {
        bassa: "border-l-emerald-500",
        media: "border-l-sky-500",
        alta: "border-l-amber-500",
        critica: "border-l-rose-500",
    };

    function isLate(it) {
        if (!it?.day) return false;
        if (it.status === "chiusa") return false;
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        const d = new Date(it.day);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < t.getTime();
    }

    return (
        <div className="space-y-6">
            {/* HERO */}
            <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-indigo-600/20 via-neutral-950 to-neutral-950 p-6">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className={clsx("text-sm font-medium", BRAND.text)}>Sistema ticket • apertura → presa in carico → risoluzione</div>
                        <h1 className="text-3xl font-bold tracking-tight">Criticità</h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-2xl border border-neutral-800 bg-neutral-950/40 p-1">
                            <button
                                onClick={() => setView("lista")}
                                className={clsx(
                                    "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                                    view === "lista" ? "bg-white text-neutral-950" : "text-neutral-300 hover:bg-neutral-900"
                                )}
                            >
                                Lista
                            </button>
                            <button
                                onClick={() => setView("board")}
                                className={clsx(
                                    "rounded-xl px-3 py-1.5 text-sm font-medium transition",
                                    view === "board" ? "bg-white text-neutral-950" : "text-neutral-300 hover:bg-neutral-900"
                                )}
                            >
                                Board
                            </button>
                        </div>

                        {canWrite && (
                            <PrimaryButton
                                onClick={() => {
                                    const el = document.getElementById("new-issue");
                                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                }}
                            >
                                + Nuovo ticket
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-950/40 p-4">
                    <div className="text-xs text-neutral-400">Totale</div>
                    <div className="mt-1 text-xl font-bold">{counts.totale}</div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                        <div className="h-full w-2/3 bg-indigo-500/80" />
                    </div>
                </div>

                <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-4">
                    <div className="text-xs text-sky-200/80">Aperte</div>
                    <div className="mt-1 text-xl font-bold text-sky-100">{counts.aperta ?? 0}</div>
                </div>
                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4">
                    <div className="text-xs text-amber-200/80">In lavorazione</div>
                    <div className="mt-1 text-xl font-bold text-amber-100">{counts.in_lavorazione ?? 0}</div>
                </div>
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <div className="text-xs text-emerald-200/80">Risolte</div>
                    <div className="mt-1 text-xl font-bold text-emerald-100">{counts.risolta ?? 0}</div>
                </div>
                <div className="rounded-3xl border border-neutral-700/60 bg-neutral-900/40 p-4">
                    <div className="text-xs text-neutral-400">Chiuse</div>
                    <div className="mt-1 text-xl font-bold">{counts.chiusa ?? 0}</div>
                </div>
            </div>

            {/* NUOVO TICKET */}
            {canWrite && (
                <div id="new-issue">
                    <Card title="Nuovo ticket">
                        <form
                            className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-6"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                create.mutate({
                                    title: String(fd.get("title")),
                                    description: String(fd.get("description") || ""),
                                    severity: String(fd.get("severity") || "media"),
                                    status: "aperta",
                                    owner: String(fd.get("owner") || ""),
                                    day: fd.get("day") ? String(fd.get("day")) : null,
                                });
                                e.currentTarget.reset();
                            }}
                        >
                            <input
                                name="title"
                                required
                                placeholder="Titolo (es. “Errore sincronizzazione clienti”)"
                                className={clsx(
                                    "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-3",
                                    "focus:outline-none focus:ring-2",
                                    BRAND.ring
                                )}
                            />
                            <input
                                name="owner"
                                placeholder="Owner / reparto"
                                className={clsx(
                                    "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-2",
                                    "focus:outline-none focus:ring-2",
                                    BRAND.ring
                                )}
                            />
                            <select
                                name="severity"
                                defaultValue="media"
                                className={clsx(
                                    "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-1",
                                    "focus:outline-none focus:ring-2",
                                    BRAND.ring
                                )}
                            >
                                {SEVERITY.map((s) => (
                                    <option key={s.key} value={s.key}>
                                        {s.label.toLowerCase()}
                                    </option>
                                ))}
                            </select>

                            <input
                                name="day"
                                type="date"
                                className={clsx(
                                    "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-2",
                                    "focus:outline-none focus:ring-2",
                                    BRAND.ring
                                )}
                            />
                            <textarea
                                name="description"
                                placeholder="Descrizione (passi per riprodurre, impatto, contesto)…"
                                className={clsx(
                                    "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-6",
                                    "focus:outline-none focus:ring-2",
                                    BRAND.ring
                                )}
                                rows={3}
                            />

                            <div className="sm:col-span-6 flex items-center justify-between gap-3">
                                <div className="text-xs text-neutral-400">
                                    Tip: includi <span className="text-neutral-200">impatto</span> e{" "}
                                    <span className="text-neutral-200">workaround</span>.
                                </div>
                                <PrimaryButton disabled={create.isPending}>{create.isPending ? "Creazione..." : "Crea ticket"}</PrimaryButton>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* FILTRI */}
            <Card title="Ricerca & filtri">
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-12">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cerca per titolo, descrizione, owner…"
                        className={clsx(
                            "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-5",
                            "focus:outline-none focus:ring-2",
                            BRAND.ring
                        )}
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={clsx(
                            "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-3",
                            "focus:outline-none focus:ring-2",
                            BRAND.ring
                        )}
                    >
                        <option value="tutti">Tutti gli stati</option>
                        {STATUS.map((s) => (
                            <option key={s.key} value={s.key}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className={clsx(
                            "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-2",
                            "focus:outline-none focus:ring-2",
                            BRAND.ring
                        )}
                    >
                        <option value="tutte">Tutte le severità</option>
                        {SEVERITY.map((s) => (
                            <option key={s.key} value={s.key}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                    <input
                        value={ownerFilter}
                        onChange={(e) => setOwnerFilter(e.target.value)}
                        placeholder="Filtra owner…"
                        className={clsx(
                            "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 sm:col-span-2",
                            "focus:outline-none focus:ring-2",
                            BRAND.ring
                        )}
                    />
                </div>
            </Card>

            {/* VISTA */}
            {view === "lista" ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <Card title="Ticket">
                        <div className="space-y-2 text-sm">
                            {filtered.map((it) => {
                                const late = isLate(it);
                                return (
                                    <div
                                        key={it.id}
                                        className={clsx(
                                            "rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/50 to-neutral-950/40 p-4",
                                            "border-l-4",
                                            severityBorder[it.severity] || "border-l-neutral-700",
                                            "hover:from-neutral-900/70 hover:to-neutral-950/60 transition-colors"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="truncate text-base font-semibold">{it.title}</div>
                                                    <StatusPill status={it.status} />
                                                    <SeverityBadge severity={it.severity} />
                                                    {late && (
                                                        <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-extrabold text-white">
                                                            IN RITARDO
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-1 text-neutral-400 flex flex-wrap gap-x-3 gap-y-1">
                                                    <span>
                                                        Owner: <span className="text-neutral-200">{it.owner || "-"}</span>
                                                    </span>
                                                    <span>
                                                        Target:{" "}
                                                        <span className="text-neutral-200">
                                                            {it.day ? new Date(it.day).toLocaleDateString() : "-"}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <SecondaryButton onClick={() => setOpenIssueId(it.id)}>Apri</SecondaryButton>
                                            </div>
                                        </div>

                                        {canWrite && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <select
                                                    className={clsx(
                                                        "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm",
                                                        "focus:outline-none focus:ring-2",
                                                        BRAND.ring
                                                    )}
                                                    value={it.status}
                                                    onChange={(e) => update.mutate({ id: it.id, patch: { status: e.target.value } })}
                                                >
                                                    {STATUS.map((s) => (
                                                        <option key={s.key} value={s.key}>
                                                            {s.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                {it.status === "aperta" && (
                                                    <PrimaryButton
                                                        className="px-3 py-2"
                                                        onClick={() => update.mutate({ id: it.id, patch: { status: "in_lavorazione" } })}
                                                    >
                                                        Prendi in carico
                                                    </PrimaryButton>
                                                )}

                                                {it.status === "in_lavorazione" && (
                                                    <>
                                                        <PrimaryButton
                                                            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-400/30"
                                                            onClick={() => update.mutate({ id: it.id, patch: { status: "risolta" } })}
                                                        >
                                                            Segna risolta
                                                        </PrimaryButton>
                                                        <SecondaryButton onClick={() => update.mutate({ id: it.id, patch: { status: "aperta" } })}>
                                                            Rimetti aperta
                                                        </SecondaryButton>
                                                    </>
                                                )}

                                                {it.status === "risolta" && (
                                                    <>
                                                        <PrimaryButton
                                                            className="px-3 py-2 bg-neutral-100 hover:bg-white text-neutral-950 focus:ring-white/20"
                                                            onClick={() => update.mutate({ id: it.id, patch: { status: "chiusa" } })}
                                                        >
                                                            Chiudi
                                                        </PrimaryButton>
                                                        <SecondaryButton onClick={() => update.mutate({ id: it.id, patch: { status: "in_lavorazione" } })}>
                                                            Riapri lavoro
                                                        </SecondaryButton>
                                                    </>
                                                )}

                                                {it.status === "chiusa" && (
                                                    <SecondaryButton onClick={() => update.mutate({ id: it.id, patch: { status: "aperta" } })}>
                                                        Riapri
                                                    </SecondaryButton>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {filtered.length === 0 && (
                                <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/20 p-6 text-neutral-400">
                                    Nessun ticket corrisponde ai filtri.
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Guida rapida">
                        <div className="space-y-3 text-sm">
                            <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                                <div className="font-semibold text-indigo-100">Workflow consigliato</div>
                                <ul className="mt-2 list-disc pl-5 text-indigo-100/70 space-y-1">
                                    <li>
                                        <span className="text-indigo-100 font-semibold">Aperta</span> → triage e chiarimenti
                                    </li>
                                    <li>
                                        <span className="text-indigo-100 font-semibold">In lavorazione</span> → owner assegnato e attività in corso
                                    </li>
                                    <li>
                                        <span className="text-indigo-100 font-semibold">Risolta</span> → fix completato, in attesa conferma
                                    </li>
                                    <li>
                                        <span className="text-indigo-100 font-semibold">Chiusa</span> → validato e archiviato
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4">
                                <div className="font-semibold text-rose-100">Severità: come usarla</div>
                                <div className="mt-2 text-rose-100/70">
                                    <span className="font-semibold text-rose-100">Critica</span> = blocca operatività / impatto alto su clienti.
                                    Usa “Alta” per degradazione significativa, “Media/Bassa” per miglioramenti e bug minori.
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
                    {STATUS.map((col) => (
                        <div key={col.key} className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-950/30">
                            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                                <div className={clsx("font-semibold", col.key === "in_lavorazione" ? "text-amber-200" : col.key === "aperta" ? "text-sky-200" : col.key === "risolta" ? "text-emerald-200" : "text-neutral-200")}>
                                    {col.label}
                                </div>
                                <div className="text-xs text-neutral-400">{(grouped[col.key] || []).length}</div>
                            </div>

                            <div className="space-y-2 p-3">
                                {(grouped[col.key] || []).map((it) => {
                                    const late = isLate(it);
                                    return (
                                        <button
                                            key={it.id}
                                            onClick={() => setOpenIssueId(it.id)}
                                            className={clsx(
                                                "w-full text-left rounded-3xl border border-neutral-800 bg-neutral-950/40 p-3 transition",
                                                "hover:bg-neutral-950/70 hover:border-neutral-700",
                                                "border-l-4",
                                                severityBorder[it.severity] || "border-l-neutral-700"
                                            )}
                                        >
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="min-w-0 flex-1 truncate font-semibold">{it.title}</div>
                                                <SeverityBadge severity={it.severity} />
                                            </div>
                                            <div className="mt-1 text-xs text-neutral-400">
                                                Owner: <span className="text-neutral-200">{it.owner || "-"}</span>
                                                {it.day ? (
                                                    <span className="ml-2">
                                                        • Target: <span className={late ? "text-rose-200 font-semibold" : "text-neutral-200"}>{new Date(it.day).toLocaleDateString()}</span>
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-2">
                                                <StatusPill status={it.status} />
                                            </div>
                                        </button>
                                    );
                                })}

                                {(grouped[col.key] || []).length === 0 && (
                                    <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/10 p-4 text-sm text-neutral-400">
                                        Nessun ticket.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* DRAWER DETTAGLIO */}
            <Drawer open={!!openIssueId} onClose={() => setOpenIssueId(null)} title={selectedIssue ? selectedIssue.title : "Dettaglio"}>
                {!selectedIssue && <div className="text-neutral-400 text-sm">Caricamento…</div>}

                {selectedIssue && (
                    <div className="space-y-5">
                        <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-950/30 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusPill status={selectedIssue.status} />
                                <SeverityBadge severity={selectedIssue.severity} />
                                <span className="text-xs text-neutral-400">
                                    ID: <span className="text-neutral-200">{selectedIssue.id}</span>
                                </span>
                                {isLate(selectedIssue) && (
                                    <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-extrabold text-white">
                                        IN RITARDO
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-3">
                                    <div className="text-xs text-neutral-400">Owner</div>
                                    <div className="mt-1 text-neutral-100 font-semibold">{selectedIssue.owner || "-"}</div>
                                </div>
                                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-3">
                                    <div className="text-xs text-neutral-400">Target</div>
                                    <div className={clsx("mt-1 font-semibold", isLate(selectedIssue) ? "text-rose-200" : "text-neutral-100")}>
                                        {selectedIssue.day ? new Date(selectedIssue.day).toLocaleDateString() : "-"}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-3">
                                    <div className="text-xs text-neutral-400">Stato</div>
                                    <div className="mt-1 text-neutral-100 font-semibold">
                                        {STATUS.find((s) => s.key === selectedIssue.status)?.label || selectedIssue.status}
                                    </div>
                                </div>
                            </div>

                            {canWrite && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <select
                                        className={clsx(
                                            "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm",
                                            "focus:outline-none focus:ring-2",
                                            BRAND.ring
                                        )}
                                        value={selectedIssue.status}
                                        onChange={(e) => update.mutate({ id: selectedIssue.id, patch: { status: e.target.value } })}
                                    >
                                        {STATUS.map((s) => (
                                            <option key={s.key} value={s.key}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        className={clsx(
                                            "rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm",
                                            "focus:outline-none focus:ring-2",
                                            BRAND.ring
                                        )}
                                        value={selectedIssue.severity}
                                        onChange={(e) => update.mutate({ id: selectedIssue.id, patch: { severity: e.target.value } })}
                                    >
                                        {SEVERITY.map((s) => (
                                            <option key={s.key} value={s.key}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>

                                    <PrimaryButton onClick={() => update.mutate({ id: selectedIssue.id, patch: { status: "in_lavorazione" } })}>
                                        Prendi in carico
                                    </PrimaryButton>

                                    <PrimaryButton
                                        className="bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-400/30"
                                        onClick={() => update.mutate({ id: selectedIssue.id, patch: { status: "risolta" } })}
                                    >
                                        Segna risolta
                                    </PrimaryButton>

                                    <DangerButton onClick={() => update.mutate({ id: selectedIssue.id, patch: { status: "chiusa" } })}>
                                        Chiudi
                                    </DangerButton>
                                </div>
                            )}

                            <div className="mt-4">
                                <div className={clsx("text-xs font-medium", BRAND.text)}>Descrizione</div>
                                <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-100">
                                    {selectedIssue.description || <span className="text-neutral-400">Nessuna descrizione.</span>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/60 to-neutral-950/30 p-4">
                            <div className="flex items-center justify-between">
                                <div className={clsx("font-semibold", BRAND.text)}>Discussione</div>
                                <div className="text-xs text-neutral-400">
                                    {comments.isLoading ? "Caricamento…" : `${(comments.data?.rows || []).length} messaggi`}
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                {(comments.data?.rows || []).map((c) => (
                                    <div key={c.id} className="rounded-3xl border border-neutral-800 bg-neutral-950/40 p-3">
                                        <div className="text-xs text-neutral-400">
                                            <span className="text-neutral-200 font-semibold">{c.author_name}</span> •{" "}
                                            {c.created_at ? new Date(c.created_at).toLocaleString() : "-"}
                                        </div>
                                        <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-100">{c.message}</div>
                                    </div>
                                ))}

                                {(comments.data?.rows || []).length === 0 && (
                                    <div className="rounded-3xl border border-dashed border-neutral-800 bg-neutral-950/10 p-4 text-sm text-neutral-400">
                                        Nessun commento. Aggiungi aggiornamenti qui.
                                    </div>
                                )}
                            </div>

                            {canWrite ? (
                                <form
                                    className="mt-3 flex gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.currentTarget);
                                        const msg = String(fd.get("msg") || "");
                                        if (!msg.trim()) return;
                                        addComment.mutate({ id: selectedIssue.id, message: msg });
                                        e.currentTarget.reset();
                                    }}
                                >
                                    <input
                                        name="msg"
                                        placeholder="Scrivi un aggiornamento (fix, analisi, decisioni)…"
                                        className={clsx(
                                            "flex-1 rounded-2xl bg-neutral-900/60 border border-neutral-800 px-3 py-2 text-sm",
                                            "focus:outline-none focus:ring-2",
                                            BRAND.ring
                                        )}
                                    />
                                    <PrimaryButton disabled={addComment.isPending}>{addComment.isPending ? "Invio…" : "Invia"}</PrimaryButton>
                                </form>
                            ) : (
                                <div className="mt-3 text-sm text-neutral-400">Solo editor/admin possono commentare.</div>
                            )}
                        </div>
                    </div>
                )}
            </Drawer>


        </div>
    );
}
