import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../components/Card.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { useState } from "react";

export default function Rubrica() {
    const { canWrite } = useAuth();
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["contacts"], queryFn: () => api.list("contacts") });
    const [search, setSearch] = useState("");

    const create = useMutation({
        mutationFn: (payload) => api.create("contacts", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
    });

    const rows = (q.data?.rows || []).filter((c) => {
        const s = search.toLowerCase();
        return (
            (c.full_name || "").toLowerCase().includes(s) ||
            (c.organization || "").toLowerCase().includes(s) ||
            (c.role_text || "").toLowerCase().includes(s) ||
            (c.phone || "").toLowerCase().includes(s)
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <div className="text-neutral-400 text-sm">Contatti</div>
                    <h1 className="text-2xl font-semibold">Rubrica</h1>
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cerca…"
                    className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
                />
            </div>

            {canWrite && (
                <Card title="Nuovo contatto">
                    <form
                        className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            create.mutate({
                                full_name: String(fd.get("full_name")),
                                organization: String(fd.get("organization") || ""),
                                role_text: String(fd.get("role_text") || ""),
                                phone: String(fd.get("phone") || ""),
                                email: String(fd.get("email") || ""),
                                notes: String(fd.get("notes") || ""),
                            });
                            e.currentTarget.reset();
                        }}
                    >
                        <input name="full_name" placeholder="Nome" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" required />
                        <input name="organization" placeholder="Ente" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                        <input name="role_text" placeholder="Ruolo" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                        <input name="phone" placeholder="Telefono" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                        <input name="email" placeholder="Email" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                        <textarea name="notes" placeholder="Note" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-3" rows={2} />
                        <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 sm:col-span-3">Salva</button>
                    </form>
                </Card>
            )}

            <Card title="Elenco">
                <div className="space-y-2 text-sm">
                    {rows.map((c) => (
                        <div key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                            <div className="font-semibold">{c.full_name}</div>
                            <div className="text-neutral-400">{c.organization || "-"} • {c.role_text || "-"}</div>
                            <div className="text-neutral-300">{c.phone || "-"} {c.email ? `• ${c.email}` : ""}</div>
                            {c.notes && <div className="mt-1 text-neutral-300">{c.notes}</div>}
                        </div>
                    ))}
                    {rows.length === 0 && <div className="text-neutral-400">Nessun contatto.</div>}
                </div>
            </Card>

            <LogPanel section="contacts" />
        </div>
    );
}
