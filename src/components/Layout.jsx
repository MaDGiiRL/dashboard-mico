import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { useAuth } from "../lib/auth.jsx";
import RoleBadge from "./RoleBadge.jsx";

export default function Layout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4">
                <header className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {/* LOGHI */}
                        <div className="flex items-center gap-2">
                            {/* Logo principale */}
                            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                <img
                                    src="/logo.png"
                                    alt="Logo"
                                    className="h-full w-full object-contain p-1"
                                />
                            </div>

                            {/* Logo MICO */}
                            <div className="h-10 w-10 rounded-2xl overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                                <img
                                    src="/logo-mico.png"
                                    alt="Logo MICO"
                                    className="h-full w-full object-contain p-1"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-neutral-400">
                                Protezione Civile
                            </div>
                            <div className="text-lg font-semibold">
                                Olimpiadi Milano-Cortina 2026
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <div className="hidden sm:block text-neutral-300">
                            {user?.name}
                        </div>
                        <RoleBadge role={user?.role || "viewer"} />
                        <button
                            className="rounded-xl bg-neutral-800 px-3 py-2 hover:bg-neutral-700"
                            onClick={logout}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* NAVBAR ORIZZONTALE */}
                <div className="mt-4">
                    <Navbar />
                </div>

                {/* CONTENT */}
                <main className="mt-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
