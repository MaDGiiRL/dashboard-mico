import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

export default function LogPanel({ section, day }) {
    const q = useQuery({
        queryKey: ["logs", section, day],
        queryFn: () => api.logs(section, day, 30),
    });

    return (
        <div className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/30 p-4">
            <div className="mb-3 font-semibold">Attività (log)</div>
            <div className="space-y-2 text-sm">
                {(q.data?.rows || []).map((l) => (
                    <div key={l.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                        <div className="flex flex-wrap gap-2 text-neutral-400">
                            <span>{new Date(l.occurred_at).toLocaleString()}</span>
                            <span>•</span>
                            <span>{l.actor_name || "?"}</span>
                            <span className="rounded-full bg-neutral-800 px-2">{l.action}</span>
                        </div>
                        <div className="mt-1">{l.summary || l.entity_type}</div>
                    </div>
                ))}
                {q.isLoading && <div className="text-neutral-400">Caricamento log…</div>}
            </div>
        </div>
    );
}
