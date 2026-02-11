// src/pages/Admin.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../components/Card.jsx";
import { api } from "../lib/api.js";
import { useMemo, useState } from "react";
import { UserPlus, ShieldCheck, Users, Search, X } from "lucide-react";

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

/* ---------- UI tokens (stesso stile, NO dark) ---------- */
const UI = {
    card: cx(
        "rounded-3xl overflow-hidden",
        "bg-white/55 backdrop-blur-md",
        "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"
    ),
    accent: "h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500",
    softRing: "ring-1 ring-white/45",
    dim: "text-neutral-600",
    dim2: "text-neutral-500",
    input:
        "w-full rounded-2xl px-4 py-3 text-sm outline-none " +
        "bg-white/75 text-neutral-900 placeholder:text-neutral-400 " +
        "shadow-sm ring-1 ring-white/45 " +
        "focus:ring-4 focus:ring-indigo-500/15",
    select:
        "w-full rounded-2xl px-4 py-3 text-sm outline-none " +
        "bg-white/75 text-neutral-900 " +
        "shadow-sm ring-1 ring-white/45 " +
        "focus:ring-4 focus:ring-indigo-500/15",
    btn:
        "rounded-2xl px-3 py-2 text-sm font-extrabold transition flex items-center gap-2 " +
        "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm ring-1 ring-white/45 " +
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
    btnDanger:
        "rounded-2xl px-3 py-2 text-sm font-extrabold transition flex items-center gap-2 " +
        "bg-rose-600 hover:bg-rose-500 text-white shadow-sm ring-1 ring-rose-600/30 " +
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20",
    btnDark:
        "rounded-2xl px-3 py-2 text-sm font-extrabold transition flex items-center gap-2 " +
        "bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm ring-1 ring-black/10 " +
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15",
};

function Input({ className, ...props }) {
    return <input {...props} className={cx(UI.input, className)} />;
}
function Select({ className, ...props }) {
    return <select {...props} className={cx(UI.select, className)} />;
}
function Btn({ className, ...props }) {
    return <button type="button" {...props} className={cx(UI.btn, className)} />;
}

function Pill({ tone = "neutral", children }) {
    const map = {
        neutral: "border-neutral-200/70 bg-white/60 text-neutral-900",
        pending: "border-amber-500/30 bg-amber-500/10 text-amber-900",
        approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900",
        rejected: "border-rose-500/30 bg-rose-500/10 text-rose-900",
        revoked: "border-neutral-400/30 bg-neutral-500/10 text-neutral-900",
    };
    return (
        <span className={cx("inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold", map[tone] || map.neutral)}>
            {children}
        </span>
    );
}

function ToneCard({ tone = "neutral", title, subtitle, right, children, icon: Icon }) {
    const accents = {
        neutral: "from-indigo-500 via-fuchsia-500 to-rose-500",
        amber: "from-amber-500 via-rose-500 to-fuchsia-500",
        emerald: "from-emerald-500 via-sky-500 to-indigo-500",
        sky: "from-sky-500 via-indigo-500 to-fuchsia-500",
    };
    const a = accents[tone] || accents.neutral;

    return (
        <div className={cx(UI.card, UI.softRing)}>
            <div className={cx("h-1.5 bg-gradient-to-r", a)} />
            <div className="p-5 bg-white/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        {Icon ? (
                            <div className="h-11 w-11 rounded-2xl bg-white/55 ring-1 ring-white/45 shadow-sm grid place-items-center">
                                <Icon size={18} className="text-neutral-900" />
                            </div>
                        ) : null}
                        <div className="min-w-0">
                            <div className="text-lg font-extrabold text-neutral-900 truncate">{title}</div>
                            {subtitle ? <div className={cx("text-xs mt-1", UI.dim2)}>{subtitle}</div> : null}
                        </div>
                    </div>
                    {right ? <div className="shrink-0">{right}</div> : null}
                </div>

                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}

export default function Admin() {
    const qc = useQueryClient();

    // --- existing users ---
    const usersQ = useQuery({ queryKey: ["admin_users"], queryFn: () => api.adminUsers() });

    const createUser = useMutation({
        mutationFn: (payload) => api.adminCreateUser(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_users"] }),
    });

    const setRole = useMutation({
        mutationFn: ({ id, role }) => api.adminSetRole(id, role),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_users"] }),
    });

    // --- access requests ---
    const reqQ = useQuery({ queryKey: ["admin_access_requests"], queryFn: () => api.adminAccessRequests() });

    const approve = useMutation({
        mutationFn: ({ id, role }) => api.adminApproveAccessRequest(id, { role }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_access_requests"] }),
    });

    const reject = useMutation({
        mutationFn: ({ id, note }) => api.adminRejectAccessRequest(id, { note }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_access_requests"] }),
    });

    const revoke = useMutation({
        mutationFn: ({ id, note }) => api.adminRevokeAccessRequest(id, { note }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_access_requests"] }),
    });

    const [reqFilter, setReqFilter] = useState("pending");
    const [reqSearch, setReqSearch] = useState("");

    const reqRows = useMemo(() => {
        let rows = reqQ.data?.rows || [];

        if (reqFilter !== "all") rows = rows.filter((r) => r.status === reqFilter);

        const q = reqSearch.trim().toLowerCase();
        if (q) {
            rows = rows.filter((r) =>
                `${r.display_name || ""} ${r.email || ""} ${r.organization || ""} ${r.reason || ""}`.toLowerCase().includes(q)
            );
        }

        return rows;
    }, [reqQ.data, reqFilter, reqSearch]);

    return (
        <div className="space-y-6">
            {/* HERO */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-6 bg-white/40">
                    <div className="text-xs font-extrabold tracking-wide text-neutral-600">GESTIONE</div>
                    <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">Admin Panel</h1>
                    <div className={cx("mt-2 text-xs", UI.dim2)}>Utenti, ruoli e richieste di accesso</div>
                </div>
            </div>

            {/* ===== Access Requests ===== */}
            <ToneCard
                tone="amber"
                icon={ShieldCheck}
                title="Richieste abilitazione"
                subtitle="Approva / rifiuta / revoca"
                right={
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <Input
                                value={reqSearch}
                                onChange={(e) => setReqSearch(e.target.value)}
                                placeholder="Cerca…"
                                className="pl-9 w-[220px]"
                            />
                        </div>
                    </div>
                }
            >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Select value={reqFilter} onChange={(e) => setReqFilter(e.target.value)} className="w-[220px]">
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="revoked">Revoked</option>
                        <option value="all">Tutte</option>
                    </Select>

                    <div className={cx("text-sm", UI.dim)}>
                        {reqQ.isLoading ? "Caricamento…" : `${reqRows.length} richieste`}
                    </div>
                </div>

                {reqQ.isError && (
                    <div className="rounded-3xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-900">
                        {String(reqQ.error?.message || reqQ.error)}
                    </div>
                )}

                <div className="space-y-2 text-sm">
                    {reqRows.map((r) => (
                        <div key={r.id} className={cx("rounded-3xl overflow-hidden", "bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                            <div className="h-1.5 bg-gradient-to-r from-neutral-900/10 via-white/60 to-white/40" />
                            <div className="p-5 bg-white/40">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="font-extrabold text-neutral-900 truncate">{r.display_name}</div>
                                            <Pill tone={r.status}>{r.status}</Pill>
                                        </div>

                                        <div className={cx("mt-1", UI.dim)}>
                                            {r.email}
                                            {r.organization ? ` • ${r.organization}` : ""}
                                        </div>

                                        <div className="mt-3 whitespace-pre-wrap text-neutral-900/90">{r.reason}</div>

                                        <div className={cx("mt-3 text-xs", UI.dim2)}>
                                            Inviata: {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}
                                            {r.decided_at ? ` • Decisione: ${new Date(r.decided_at).toLocaleString()}` : ""}
                                            {r.decided_by ? ` • by ${r.decided_by}` : ""}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 sm:justify-end">
                                        {r.status === "pending" && (
                                            <>
                                                <Select
                                                    defaultValue="viewer"
                                                    className="w-[220px]"
                                                    onChange={(e) => approve.mutate({ id: r.id, role: e.target.value })}
                                                >
                                                    <option value="viewer">Approve as viewer</option>
                                                    <option value="editor">Approve as editor</option>
                                                    <option value="admin">Approve as admin</option>
                                                </Select>

                                                <button
                                                    type="button"
                                                    onClick={() => reject.mutate({ id: r.id, note: "Rifiutata da admin" })}
                                                    className={UI.btnDanger}
                                                >
                                                    <X size={16} /> Rifiuta
                                                </button>
                                            </>
                                        )}

                                        {r.status === "approved" && (
                                            <button
                                                type="button"
                                                onClick={() => revoke.mutate({ id: r.id, note: "Revocata da admin" })}
                                                className={UI.btnDark}
                                            >
                                                Revoca
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {reqRows.length === 0 && <div className={cx("text-sm", UI.dim)}>Nessuna richiesta in questa vista.</div>}
                </div>
            </ToneCard>

            {/* ===== Create user ===== */}
            <ToneCard tone="sky" icon={UserPlus} title="Crea utente (solo admin)" subtitle="Creazione manuale account">
                <form
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        createUser.mutate({
                            email: String(fd.get("email")),
                            password: String(fd.get("password")),
                            display_name: String(fd.get("display_name")),
                            role: String(fd.get("role") || "viewer"),
                        });
                        e.currentTarget.reset();
                    }}
                >
                    <Input name="display_name" placeholder="Nome" required />
                    <Input name="email" placeholder="Email" type="email" required />
                    <Input name="password" placeholder="Password (min 8)" type="password" required />
                    <Select name="role" defaultValue="viewer">
                        <option value="viewer">viewer</option>
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                    </Select>

                    <button
                        type="submit"
                        className={cx(
                            "sm:col-span-4 rounded-2xl px-4 py-3 text-sm font-extrabold transition",
                            "bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm ring-1 ring-black/10",
                            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15"
                        )}
                    >
                        {createUser.isPending ? "Creazione..." : "Crea"}
                    </button>
                </form>
            </ToneCard>

            {/* ===== Users ===== */}
            <ToneCard tone="emerald" icon={Users} title="Utenti" subtitle="Ruoli e account">
                <div className="space-y-2 text-sm">
                    {(usersQ.data?.users || []).map((u) => (
                        <div
                            key={u.id}
                            className={cx(
                                "rounded-3xl p-4 flex items-center justify-between gap-3",
                                "bg-white/55 ring-1 ring-white/45 shadow-sm"
                            )}
                        >
                            <div className="min-w-0">
                                <div className="font-extrabold text-neutral-900 truncate">{u.display_name}</div>
                                <div className={cx("text-sm truncate", UI.dim)}>{u.email}</div>
                            </div>

                            <Select
                                className="w-[180px]"
                                value={u.role}
                                onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value })}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </Select>
                        </div>
                    ))}
                </div>
            </ToneCard>

            {/* NOTE: Card import lasciato (se lo usi altrove). Qui stiamo usando uno stile uniforme anche senza toccare Card.jsx */}
        </div>
    );
}
