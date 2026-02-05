import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../components/Card.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function Meteo() {
    const { canWrite } = useAuth();
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["weather_bulletins"], queryFn: () => api.list("weather_bulletins") });

    const create = useMutation({
        mutationFn: (payload) => api.create("weather_bulletins", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["weather_bulletins"] }),
    });

    return (
        <div className="space-y-6">
            <div>
                <div className="text-neutral-400 text-sm">Bollettini</div>
                <h1 className="text-2xl font-semibold">Meteo</h1>
            </div>

            {canWrite && (
                <Card title="Nuovo bollettino">
                    <form
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            create.mutate({
                                day: String(fd.get("day")),
                                source: String(fd.get("source") || ""),
                                content: String(fd.get("content") || ""),
                            });
                            e.currentTarget.reset();
                        }}
                    >
                        <input name="day" type="date" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" required />
                        <input name="source" placeholder="Fonte" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-2" />
                        <textarea name="content" placeholder="Testo bollettino" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-3" rows={4} required />
                        <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 sm:col-span-3">Salva</button>
                    </form>
                </Card>
            )}

            <Card title="Storico">
                <div className="space-y-2 text-sm">
                    {(q.data?.rows || []).map((b) => (
                        <div key={b.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                            <div className="text-neutral-400">{b.day} • {b.source || "Fonte"}</div>
                            <div className="mt-1 whitespace-pre-wrap">{b.content}</div>
                        </div>
                    ))}
                    {(q.data?.rows || []).length === 0 && <div className="text-neutral-400">Nessun bollettino.</div>}
                </div>
            </Card>

            <LogPanel section="weather" />
        </div>
    );
}
