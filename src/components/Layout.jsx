// src/components/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { useAuth } from "../lib/auth.jsx";
import RoleBadge from "./RoleBadge.jsx";
import Footer from "./Footer.jsx";
import { LogOut } from "lucide-react";

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

export default function Layout() {
    const { user, logout } = useAuth();

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
        </div>
    );
}
