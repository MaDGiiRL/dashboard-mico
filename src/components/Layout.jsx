import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import { useAuth } from "../lib/auth.jsx";
import RoleBadge from "./RoleBadge.jsx";
import Footer from "./Footer.jsx";
export default function Layout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4">
                <header className="flex items-center justify-between gap-3
                           rounded-2xl bg-neutral-800/80
                           border border-neutral-700 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-2xl bg-neutral-700 border border-neutral-600 flex items-center justify-center">
                                <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-1" />
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-neutral-700 border border-neutral-600 flex items-center justify-center">
                                <img src="/logo-mico.png" alt="Logo MICO" className="h-full w-full object-contain p-1" />
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-neutral-400">Protezione Civile</div>
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
                            onClick={logout}
                            className="rounded-xl bg-neutral-700 px-3 py-2
                         hover:bg-neutral-600 transition"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="mt-4">
                    <Navbar />
                </div>

                <main
                    className="mt-4 rounded-2xl
                     bg-neutral-800/70
                     border border-neutral-700
                     p-4 sm:p-6"
                >
                    <Outlet />
                </main>

                <Footer />
            </div>
        </div>
    );
}
