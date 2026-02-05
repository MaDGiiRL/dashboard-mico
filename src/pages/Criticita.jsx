import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import Card from "../components/Card.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { useAuth } from "../lib/auth.jsx";
import { useState } from "react";

export default function Criticita() {
    const { canWrite } = useAuth();
    const qc = useQueryClient();

    const issues = useQuery({ queryKey: ["issues"], queryFn: () => api.list("issues") });

    const [openIssueId, setOpenIssueId] = useState(null);
    const comments = useQuery({
        queryKey: ["issue_comments", openIssueId],
        queryFn: () => api.issueComments(openIssueId),
        enabled: !!openIssueId,
    });

    const create = useMutation({
        mutationFn: (payload) => api.create("issues", payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
    });

    const update = useMutation({
        mutationFn: ({ id, patch }) => api.update("issues", id, patch),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
    });

    const addComment = useMutation({
        mutationFn: ({ id, message }) => api.addIssueComment(id, message),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["issue_comments", openIssueId] }),
    });

    return (
        <div className="space-y-6">
            <div>
                <div className="text-neutral-400 text-sm">Ticket + confronto</div>
                <h1 className="text-2xl font-semibold">Criticità</h1>
            </div>

            {canWrite && (
                <Card title="Nuova criticità">
                    <form
                        className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const fd = new FormData(e.currentTarget);
                            create.mutate({
                                title: String(fd.get("title")),
                                description: String(fd.get("description") || ""),
                                severity: String(fd.get("severity") || "media"),
                                status: "aperta",
                                owner: String(fd.get("owner") || ""),
                                day: fd.get("day") ? String(fd.get("day")) : null,
                            });
                            e.currentTarget.reset();
                        }}
                    >
                        <input name="title" required placeholder="Titolo" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-2" />
                        <input name="owner" placeholder="Owner" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                        <select name="severity" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2">
                            <option value="bassa">bassa</option>
                            <option value="media" defaultValue="media">media</option>
                            <option value="alta">alta</option>
                            <option value="critica">critica</option>
                        </select>
                        <input name="day" type="date" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                        <textarea name="description" placeholder="Descrizione" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 sm:col-span-4" rows={2} />
                        <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 sm:col-span-4">Aggiungi</button>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card title="Lista criticità">
                    <div className="space-y-2 text-sm">
                        {(issues.data?.rows || []).map((it) => (
                            <div key={it.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold">{it.title}</div>
                                        <div className="text-neutral-400">{it.severity} • {it.status} • {it.owner || "-"}</div>
                                    </div>
                                    <button
                                        className="rounded-xl bg-neutral-800 px-3 py-1 hover:bg-neutral-700"
                                        onClick={() => setOpenIssueId(it.id)}
                                    >
                                        Apri
                                    </button>
                                </div>

                                {canWrite && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <select
                                            className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1"
                                            value={it.status}
                                            onChange={(e) => update.mutate({ id: it.id, patch: { status: e.target.value } })}
                                        >
                                            <option value="aperta">aperta</option>
                                            <option value="in_lavorazione">in_lavorazione</option>
                                            <option value="risolta">risolta</option>
                                            <option value="chiusa">chiusa</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                        {(issues.data?.rows || []).length === 0 && <div className="text-neutral-400">Nessun ticket.</div>}
                    </div>
                </Card>

                <Card title="Discussione">
                    {!openIssueId && <div className="text-neutral-400 text-sm">Seleziona un ticket.</div>}
                    {openIssueId && (
                        <div className="space-y-3 text-sm">
                            <div className="space-y-2">
                                {(comments.data?.rows || []).map((c) => (
                                    <div key={c.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                                        <div className="text-neutral-400">{c.author_name} • {new Date(c.created_at).toLocaleString()}</div>
                                        <div className="mt-1 whitespace-pre-wrap">{c.message}</div>
                                    </div>
                                ))}
                            </div>

                            {canWrite && (
                                <form
                                    className="flex gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const fd = new FormData(e.currentTarget);
                                        const msg = String(fd.get("msg") || "");
                                        if (!msg.trim()) return;
                                        addComment.mutate({ id: openIssueId, message: msg });
                                        e.currentTarget.reset();
                                    }}
                                >
                                    <input name="msg" placeholder="Scrivi un commento…" className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" />
                                    <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2">Invia</button>
                                </form>
                            )}

                            {!canWrite && <div className="text-neutral-400">Solo editor/admin possono commentare.</div>}
                        </div>
                    )}
                </Card>
            </div>

            <LogPanel section="issues" />
        </div>
    );
}
