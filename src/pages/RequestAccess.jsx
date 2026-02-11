// src/pages/RequestAccess.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

export default function RequestAccess() {
    const [ok, setOk] = useState(false);
    const [err, setErr] = useState(null);
    const [pending, setPending] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl border bg-white/70 border-neutral-200 shadow-sm dark:bg-neutral-900/40 dark:border-neutral-800 dark:shadow-none backdrop-blur p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Richiesta abilitazione</div>
                        <h1 className="text-2xl font-semibold">Accesso alla dashboard</h1>
                    </div>

                    <Link
                        to="/login"
                        className="rounded-2xl border px-3 py-2 text-sm
              bg-white border-neutral-200 hover:bg-neutral-100
              dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
                    >
                        Torna al login
                    </Link>
                </div>

                <div className="text-sm text-neutral-700 dark:text-neutral-300">
                    La creazione utenti non è pubblica: <span className="font-semibold">solo la developer</span> può registrare nuovi utenti.
                    Compila il form per richiedere l’abilitazione.
                </div>

                {ok && (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
                        Richiesta inviata. Verrai contattato dall’amministrazione.
                    </div>
                )}

                {err && (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-900 dark:text-rose-100">
                        {err}
                    </div>
                )}

                <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setErr(null);
                        setOk(false);
                        setPending(true);

                        const fd = new FormData(e.currentTarget);
                        const payload = {
                            name: String(fd.get("name") || "").trim(),
                            email: String(fd.get("email") || "").trim(),
                            ente: String(fd.get("ente") || "").trim(),
                            note: String(fd.get("note") || "").trim(),
                        };

                        if (!payload.name || !payload.email) {
                            setErr("Nome ed email sono obbligatori.");
                            setPending(false);
                            return;
                        }

                        try {
                            await api.requestAccess(payload);
                            setOk(true);
                            e.currentTarget.reset();
                        } catch (e2) {
                            setErr(e2?.message || "Errore invio richiesta");
                        } finally {
                            setPending(false);
                        }
                    }}
                >
                    <input
                        name="name"
                        placeholder="Nome e cognome *"
                        required
                        className={cx(
                            "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                            "bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400",
                            "focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-300",
                            "dark:bg-neutral-950/40 dark:border-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500",
                            "dark:focus:ring-indigo-400/25 dark:focus:border-indigo-500/40"
                        )}
                    />

                    <input
                        name="email"
                        type="email"
                        placeholder="Email istituzionale *"
                        required
                        className={cx(
                            "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                            "bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400",
                            "focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-300",
                            "dark:bg-neutral-950/40 dark:border-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500",
                            "dark:focus:ring-indigo-400/25 dark:focus:border-indigo-500/40"
                        )}
                    />

                    <input
                        name="ente"
                        placeholder="Ente / Struttura (opzionale)"
                        className={cx(
                            "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                            "bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400",
                            "focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-300",
                            "dark:bg-neutral-950/40 dark:border-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500",
                            "dark:focus:ring-indigo-400/25 dark:focus:border-indigo-500/40"
                        )}
                    />

                    <textarea
                        name="note"
                        rows={4}
                        placeholder="Motivazione / ruolo / note (opzionale)"
                        className={cx(
                            "w-full rounded-2xl border px-4 py-3 text-sm outline-none",
                            "bg-white border-neutral-200 text-neutral-900 placeholder:text-neutral-400",
                            "focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-300",
                            "dark:bg-neutral-950/40 dark:border-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500",
                            "dark:focus:ring-indigo-400/25 dark:focus:border-indigo-500/40"
                        )}
                    />

                    <button
                        disabled={pending}
                        className={cx(
                            "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition",
                            "bg-neutral-900 text-white hover:bg-neutral-800",
                            "dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white",
                            "disabled:opacity-60 disabled:cursor-not-allowed"
                        )}
                    >
                        {pending ? "Invio..." : "Invia richiesta"}
                    </button>

                    <div className="text-xs text-neutral-600 dark:text-neutral-400">
                        Le richieste saranno valutate dall’amministrazione. Se hai già una richiesta pendente, non inviare duplicati.
                    </div>
                </form>
            </div>
        </div>
    );
}
