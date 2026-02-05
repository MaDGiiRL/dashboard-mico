import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import {
    LayoutDashboard,
    CalendarDays,
    Building2,
    MapPinned,
    AlertTriangle,
    CloudSun,
    Phone,
    Shield,
} from "lucide-react";

const links = [
    { to: "/", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/calendario", label: "Calendario", Icon: CalendarDays },
    { to: "/coc", label: "COC", Icon: Building2 },
    // { to: "/gare", label: "Gare + Mappa", Icon: MapPinned },
    { to: "/criticita", label: "Criticità", Icon: AlertTriangle },
    { to: "/meteo", label: "Meteo", Icon: CloudSun },
    { to: "/rubrica", label: "Rubrica", Icon: Phone },
];

export default function Navbar() {
    const { isAdmin } = useAuth();

    return (
        <nav className="rounded-2xl bg-neutral-900/40 border border-neutral-800 p-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {/* links */}
                {links.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            [
                                "shrink-0 rounded-xl px-3 py-2 text-sm flex items-center gap-2",
                                "hover:bg-neutral-800/70 border border-transparent",
                                isActive ? "bg-neutral-800 border-neutral-700" : "",
                            ].join(" ")
                        }
                        title={label}
                    >
                        <Icon size={18} className="text-neutral-300" />
                        <span className="whitespace-nowrap">{label}</span>
                    </NavLink>
                ))}

                {isAdmin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            [
                                "shrink-0 rounded-xl px-3 py-2 text-sm flex items-center gap-2 ml-auto",
                                "hover:bg-neutral-800/70 border border-transparent",
                                isActive ? "bg-neutral-800 border-neutral-700" : "",
                            ].join(" ")
                        }
                        title="Admin"
                    >
                        <Shield size={18} className="text-neutral-300" />
                        <span className="whitespace-nowrap">Admin</span>
                    </NavLink>
                )}
            </div>
        </nav>
    );
}
