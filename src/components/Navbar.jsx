// src/components/Navbar.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import {
    LayoutDashboard,
    MapPinned,
    AlertTriangle,
    CloudSun,
    Phone,
    Shield,
    Building2,
    Boxes,
} from "lucide-react";

const links = [
    { to: "/", label: "Dashboard", Icon: LayoutDashboard, tone: "indigo" },
    { to: "/coc-safety", label: "Centri Operativi", Icon: Building2, tone: "amber" },
    { to: "/inventario", label: "Volontariato", Icon: Boxes, tone: "teal" },
    // { to: "/criticita", label: "Criticità", Icon: AlertTriangle, tone: "rose" },
    { to: "/reperibilita", label: "Contatti", Icon: Phone, tone: "violet" },
    { to: "/mappa", label: "Mappa", Icon: MapPinned, tone: "emerald" },
    { to: "/utility", label: "Servizi Essenziali", Icon: AlertTriangle, tone: "fuchsia" },
    { to: "/meteo", label: "Meteo", Icon: CloudSun, tone: "sky" },
];

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

const toneMap = {
    indigo: {
        chip: "hover:bg-indigo-500/10 hover:border-indigo-200",
        dot: "bg-indigo-500",
    },
    sky: { chip: "hover:bg-sky-500/10 hover:border-sky-200", dot: "bg-sky-500" },
    emerald: { chip: "hover:bg-emerald-500/10 hover:border-emerald-200", dot: "bg-emerald-500" },
    violet: { chip: "hover:bg-violet-500/10 hover:border-violet-200", dot: "bg-violet-500" },
    amber: { chip: "hover:bg-amber-500/10 hover:border-amber-200", dot: "bg-amber-500" },
    teal: { chip: "hover:bg-teal-500/10 hover:border-teal-200", dot: "bg-teal-500" },
    rose: { chip: "hover:bg-rose-500/10 hover:border-rose-200", dot: "bg-rose-500" },
    fuchsia: { chip: "hover:bg-fuchsia-500/10 hover:border-fuchsia-200", dot: "bg-fuchsia-500" },
};

export default function Navbar() {
    const { isAdmin } = useAuth();

    return (
        <nav className="rounded-3xl border p-2 bg-white/70 border-neutral-200 shadow-sm backdrop-blur overflow-hidden">

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {links.map(({ to, label, Icon, tone }) => {
                    const t = toneMap[tone] || toneMap.indigo;

                    return (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                cx(
                                    "shrink-0 rounded-2xl px-3 py-2 text-sm flex items-center gap-2 border transition",
                                    "border-transparent",
                                    t.chip,
                                    isActive
                                        ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                        : "text-neutral-700"
                                )
                            }
                            title={label}
                        >
                            <span className={cx("h-2 w-2 rounded-full", isAdmin ? "opacity-90" : "opacity-80", t.dot)} />
                            <Icon size={18} className="opacity-90" />
                            <span className="whitespace-nowrap font-semibold">{label}</span>
                        </NavLink>
                    );
                })}

                {isAdmin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            cx(
                                "shrink-0 rounded-2xl px-3 py-2 text-sm flex items-center gap-2 ml-auto border transition",
                                "hover:bg-indigo-500/10 hover:border-indigo-200",
                                isActive ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "text-neutral-700 border-transparent"
                            )
                        }
                        title="Admin"
                    >
                        <span className="h-2 w-2 rounded-full bg-indigo-600" />
                        <Shield size={18} className="opacity-90" />
                        <span className="whitespace-nowrap font-semibold">Admin</span>
                    </NavLink>
                )}
            </div>
        </nav>
    );
}
