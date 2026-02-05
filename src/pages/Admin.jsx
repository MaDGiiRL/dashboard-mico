import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card from "../components/Card.jsx";
import { api } from "../lib/api.js";

export default function Admin() {
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ["admin_users"], queryFn: () => api.adminUsers() });

    const createUser = useMutation({
        mutationFn: (payload) => api.adminCreateUser(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_users"] }),
    });

    const setRole = useMutation({
        mutationFn: ({ id, role }) => api.adminSetRole(id, role),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["admin_users"] }),
    });

    return (
        <div className="space-y-6">
            <div>
                <div className="text-neutral-400 text-sm">Gestione utenti</div>
                <h1 className="text-2xl font-semibold">Admin Panel</h1>
            </div>

            <Card title="Crea utente (solo admin)">
                <form
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        createUser.mutate({
                            email: String(fd.get("email")),
                            password: String(fd.get("password")),
                            display_name: String(fd.get("display_name")),
                            role: String(fd.get("role") || "viewer"),
                        });
                        e.currentTarget.reset();
                    }}
                >
                    <input name="display_name" placeholder="Nome" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" required />
                    <input name="email" placeholder="Email" type="email" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" required />
                    <input name="password" placeholder="Password (min 8)" type="password" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" required />
                    <select name="role" className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2">
                        <option value="viewer">viewer</option>
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                    </select>
                    <button className="rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2 sm:col-span-4">
                        Crea
                    </button>
                </form>
            </Card>

            <Card title="Utenti">
                <div className="space-y-2 text-sm">
                    {(q.data?.users || []).map((u) => (
                        <div key={u.id} className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 flex items-center justify-between gap-3">
                            <div>
                                <div className="font-semibold">{u.display_name}</div>
                                <div className="text-neutral-400">{u.email}</div>
                            </div>
                            <select
                                className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2"
                                value={u.role}
                                onChange={(e) => setRole.mutate({ id: u.id, role: e.target.value })}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
