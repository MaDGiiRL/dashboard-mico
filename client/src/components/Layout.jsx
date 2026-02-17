// src/components/Layout.jsx
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { useAuth } from "../lib/auth.jsx";
import RoleBadge from "./RoleBadge.jsx";
import Footer from "./Footer.jsx";
import { LogOut, Bug, X, Send, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

/* --- mini UI tokens (coerenti col tuo stile glass) --- */
const UI = {
    card: cx("rounded-3xl overflow-hidden", "bg-white/55 backdrop-blur-md", "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"),
    softRing: "ring-1 ring-white/45",
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
    btnDark:
        "rounded-2xl px-3 py-2 text-sm font-extrabold transition inline-flex items-center gap-2 " +
        "bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm ring-1 ring-black/10 " +
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-neutral-900/15",
    btnGhost:
        "rounded-2xl px-3 py-2 text-sm font-extrabold transition inline-flex items-center gap-2 " +
        "bg-white/35 hover:bg-white/55 text-neutral-900 shadow-sm ring-1 ring-white/45",
};

function Input({ className, ...props }) {
    return <input {...props} className={cx(UI.input, className)} />;
}

function Select({ className, ...props }) {
    return <select {...props} className={cx(UI.select, className)} />;
}

/* ---------- Banner sviluppo ---------- */
function DevBanner({ onReport }) {
    return (
        <div className={cx(UI.card, UI.softRing)}>
            <div className="h-1.5 bg-gradient-to-r from-amber-500 via-fuchsia-500 to-indigo-500" />
            <div className="p-4 sm:p-5 bg-white/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex items-start gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-white/55 ring-1 ring-white/45 shadow-sm grid place-items-center">
                            <AlertTriangle size={18} className="text-neutral-900" />
                        </div>

                        <div className="min-w-0">
                            <div className="text-sm font-extrabold text-neutral-900">🚧 Dashboard in sviluppo</div>
                            <div className="text-xs text-neutral-600 mt-1">
                                Alcune funzionalità potrebbero cambiare o non essere complete. Se noti qualcosa che non va, segnalacelo.
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0">
                        <button type="button" onClick={onReport} className={UI.btnDark}>
                            <Bug size={16} /> Segnala un problema
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Modale segnalazione ---------- */
function ReportModal({ open, onClose, defaultPage, user }) {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [severity, setSeverity] = useState("medium");

    const canSubmit = title.trim().length >= 3 && message.trim().length >= 10;

    const create = useMutation({
        mutationFn: (payload) => api.createIssueReport(payload),
        onSuccess: () => {
            setTitle("");
            setMessage("");
            setSeverity("medium");
            onClose();
        },
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80]">
            {/* backdrop */}
            <div className="absolute inset-0 bg-neutral-900/35 backdrop-blur-[2px]" onClick={onClose} />

            {/* dialog */}
            <div className="absolute inset-0 grid place-items-center p-4">
                <div className={cx("w-full max-w-xl", UI.card, UI.softRing)}>
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

                    <div className="p-5 sm:p-6 bg-white/40">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="text-lg font-extrabold text-neutral-900">Segnala un problema</div>
                                <div className="text-xs text-neutral-600 mt-1">
                                    La segnalazione arriverà in <span className="font-semibold">Admin → Segnalazioni</span>.
                                </div>
                            </div>

                            <button type="button" onClick={onClose} className={UI.btnGhost} title="Chiudi">
                                <X size={16} /> Chiudi
                            </button>
                        </div>

                        <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <Input
                                    className="sm:col-span-2"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Titolo (es. 'Errore su richieste abilitazione')"
                                />
                                <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                                    <option value="low">Severità: low</option>
                                    <option value="medium">Severità: medium</option>
                                    <option value="high">Severità: high</option>
                                </Select>
                            </div>

                            <textarea
                                className={cx(UI.input, "min-h-[140px] resize-none")}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Descrivi cosa non va (passi per riprodurre, messaggi di errore, ecc.)"
                            />

                            <div className="text-xs text-neutral-600 flex flex-wrap gap-2">
                                <span className="rounded-full px-3 py-1 bg-white/40 ring-1 ring-white/45">
                                    Pagina: <span className="font-semibold">{defaultPage || "-"}</span>
                                </span>
                                <span className="rounded-full px-3 py-1 bg-white/40 ring-1 ring-white/45">
                                    Utente: <span className="font-semibold">{user?.email || user?.name || "-"}</span>
                                </span>
                            </div>

                            {create.isError ? (
                                <div className="rounded-3xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-900">
                                    {String(create.error?.message || create.error)}
                                </div>
                            ) : null}

                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button type="button" onClick={onClose} className={UI.btnGhost}>
                                    Annulla
                                </button>

                                <button
                                    type="button"
                                    disabled={!canSubmit || create.isPending}
                                    className={cx(UI.btnDark, (!canSubmit || create.isPending) && "opacity-60 cursor-not-allowed")}
                                    onClick={() =>
                                        create.mutate({
                                            title: title.trim(),
                                            message: message.trim(),
                                            severity,
                                            page: defaultPage || null,
                                            user_agent: navigator.userAgent,
                                        })
                                    }
                                >
                                    <Send size={16} />
                                    {create.isPending ? "Invio..." : "Invia segnalazione"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();
    const loc = useLocation();
    const [reportOpen, setReportOpen] = useState(false);

    const page = useMemo(() => loc?.pathname || "", [loc]);

    return (
        <div className="min-h-screen text-neutral-900 relative overflow-hidden">
            {/* Overlay layers (login-like premium) */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/75 via-white/60 to-white/90" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(50%_50%_at_90%_10%,rgba(236,72,153,0.16),transparent_55%),radial-gradient(50%_50%_at_10%_90%,rgba(34,197,94,0.14),transparent_55%)]" />
            <div className="absolute inset-0 -z-10 backdrop-blur-[2px]" />

            <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 space-y-4">
                {/* Header (sticky + premium glass) */}
                <header
                    className={cx(
                        "sticky top-3 z-40",
                        "relative overflow-hidden rounded-3xl",
                        "bg-white/55 backdrop-blur-md",
                        "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"
                    )}
                >
                    {/* thin accent */}
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

                    {/* subtle inner highlight (no hard border) */}
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-white/40" />

                    <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex items-center gap-2">
                                {/* Logo glass */}
                                <div className="relative h-10 w-10 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="pointer-events-none absolute inset-0 ring-1 ring-white/55" />
                                    <div className="pointer-events-none absolute -top-6 -left-6 h-12 w-12 rounded-full bg-white/50 blur-md" />
                                    <img
                                        src="/logo.png"
                                        alt="Logo Olimpiadi"
                                        className="relative h-full w-full object-contain p-1.5"
                                    />
                                </div>

                                {/* Logo glass */}
                                <div className="relative h-10 w-10 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="pointer-events-none absolute inset-0 ring-1 ring-white/55" />
                                    <div className="pointer-events-none absolute -top-6 -left-6 h-12 w-12 rounded-full bg-white/50 blur-md" />
                                    <img
                                        src="/logo-mico.png"
                                        alt="Logo Protezione Civile"
                                        className="relative h-full w-full object-contain p-1.5"
                                    />
                                </div>
                            </div>

                            <div className="min-w-0">
                                <div className="text-[11px] font-semibold tracking-wide text-neutral-600/90">
                                    Protezione Civile
                                </div>
                                <div className="text-lg sm:text-xl font-extrabold truncate text-neutral-900">
                                    Olimpiadi Milano-Cortina 2026
                                </div>
                                <div className="text-[12px] text-neutral-600/90">Dashboard operativa</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 text-sm">
                            <div className="hidden sm:block text-neutral-700 truncate max-w-[220px]">
                                {user?.name || user?.email || "—"}
                            </div>

                            <RoleBadge role={user?.role || "viewer"} />

                            {/* Logout = premium pill + icon */}
                            <button
                                onClick={logout}
                                type="button"
                                className={cx(
                                    "group inline-flex items-center gap-2",
                                    "rounded-full px-3 py-1",
                                    "bg-white/60 hover:bg-white/80",
                                    "text-neutral-900 font-semibold",
                                    "shadow-sm",
                                    "ring-1 ring-white/45",
                                    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15"
                                )}
                                title="Logout"
                            >
                                <span className="grid place-items-center h-4 w-4 rounded-full bg-neutral-900/5 group-hover:bg-neutral-900/7 transition">
                                    <LogOut size={16} className="opacity-80" />
                                </span>
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* controlled glows */}
                    <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-24 w-80 rounded-full bg-fuchsia-500/8 blur-3xl" />
                </header>

                {/* BANNER sviluppo + bottone segnalazione */}
                <DevBanner onReport={() => setReportOpen(true)} />

                <Navbar />

                {/* Main (same premium style, minimal borders) */}
                <main
                    className={cx(
                        "relative overflow-hidden rounded-3xl",
                        "bg-white/55 backdrop-blur-md",
                        "shadow-[0_18px_50px_rgba(0,0,0,0.10)]",
                        "p-4 sm:p-6"
                    )}
                >
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-white/40" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

                    <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-10 right-20 h-44 w-44 rounded-full bg-rose-500/8 blur-3xl" />

                    <Outlet />
                </main>

                <Footer />
            </div>

            {/* MODALE segnalazione */}
            <ReportModal
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                defaultPage={page}
                user={user}
            />
        </div>
    );
}
