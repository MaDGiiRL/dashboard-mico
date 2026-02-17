export default function RoleBadge({ role }) {
    const r = String(role || "").toLowerCase();

    const map = {
        admin: "bg-olympic-red/10 text-olympic-navy ring-1 ring-olympic-red/20",
        operator: "bg-olympic-blue/10 text-olympic-navy ring-1 ring-olympic-blue/20",
        ops: "bg-olympic-green/10 text-olympic-navy ring-1 ring-olympic-green/20",
        viewer: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200",
    };

    const cls = map[r] || map.viewer;

    return <span className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${cls}`}>{role}</span>;
}
