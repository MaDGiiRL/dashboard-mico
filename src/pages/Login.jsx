import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [err, setErr] = useState(null);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 space-y-4">
                <h1 className="text-2xl font-semibold">Accesso</h1>
                {err && <div className="text-sm text-red-400">{err}</div>}
                <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setErr(null);
                        const fd = new FormData(e.currentTarget);
                        try {
                            await login(String(fd.get("email")), String(fd.get("password")));
                            nav("/", { replace: true });
                        } catch (e2) {
                            setErr(e2.message || "Errore login");
                        }
                    }}
                >
                    <input className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" name="email" type="email" placeholder="Email" required />
                    <input className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2" name="password" type="password" placeholder="Password" required />
                    <button className="w-full rounded-xl bg-neutral-100 text-neutral-950 px-4 py-2">Entra</button>
                </form>
            </div>
        </div>
    );
}
