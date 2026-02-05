import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import Card from "../components/Card.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useState } from "react";
import LogPanel from "../components/LogPanel.jsx";

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Coc() {
    const { canWrite } = useAuth();
    const qc = useQueryClient();
    const [day, setDay] = useState(todayISO());

    const communes = useQuery({ queryKey: ["coc_communes"], queryFn: () => api.list("coc_communes") });
    const statuses = useQuery({ queryKey: ["coc_status"], queryFn: () => api.list("coc_status") });

    const upsert = useMutation({
        mutationFn: async (payload) => {
            const existing = (statuses.data?.rows || []).find((x) => x.day === payload.day && x.commune_id === payload.commune_id);
            if (existing) return api.update("coc_status", existing.id, payload);
            return api.create("coc_status", payload);
        },
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["coc_status"] });
            await qc.invalidateQueries({ queryKey: ["dashboardDay", day] });
        },
    });

    const rows = (statuses.data?.rows || []).filter((x) => x.day === day);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <div className="text-neutral-400 text-sm">Gestione COC per comune</div>
                    <h1 className="text-2xl font-semibold">Apertura / Chiusura COC</h1>
                </div>
                <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm" />
            </div>

            <Card title="Imposta dati COC (alimenta Dashboard)">
                {!canWrite && <div className="text-neutral-400 text-sm">Solo editor/admin possono modificare.</div>}

                <div className="grid gap-3">
                    {(communes.data?.rows || []).map((c) => {
                        const st = rows.find((x) => x.commune_id === c.id);
                        return (
                            <div key={c.id} className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-4">
                                <div className="font-semibold">{c.name}</div>

                                <form
                                    className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!canWrite) return;
                                        const fd = new FormData(e.currentTarget);
                                        upsert.mutate({
                                            day,
                                            commune_id: c.id,
                                            opened_at: fd.get("opened_at") ? new Date(String(fd.get("opened_at"))).toISOString() : null,
                                            closed_at: fd.get("closed_at") ? new Date(String(fd.get("closed_at"))).toISOString() : null,
                                            room_phone: String(fd.get("room_phone") || ""),
                                            notes: String(fd.get("notes") || ""),
                                        });
                                    }}
                                >
                                    <input name="opened_at" type="datetime-local" defaultValue={st?.opened_at ? st.opened_at.slice(0, 16) : ""} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                                    <input name="closed_at" type="datetime-local" defaultValue={st?.closed_at ? st.closed_at.slice(0, 16) : ""} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                                    <input name="room_phone" placeholder="Numero sala" defaultValue={st?.room_phone || ""} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-2" />
                                    <textarea name="notes" placeholder="Note" defaultValue={st?.notes || ""} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-2" rows={2} />
                                    <button disabled={!canWrite} className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 sm:col-span-2 disabled:opacity-50">
                                        Salva
                                    </button>
                                </form>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <LogPanel section="coc" day={day} />
        </div>
    );
}
