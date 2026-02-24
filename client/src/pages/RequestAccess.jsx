// src/pages/RequestAccess.jsx
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

/* stesso “linguaggio” premium delle altre pagine (no dark mode) */
const UI = {
    shell: "min-h-screen flex items-center justify-center p-4 text-neutral-900 relative overflow-hidden",
    bg1: "absolute inset-0 -z-10 bg-gradient-to-b from-white/75 via-white/60 to-white/90",
    bg2:
        "absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(50%_50%_at_90%_10%,rgba(236,72,153,0.16),transparent_55%),radial-gradient(50%_50%_at_10%_90%,rgba(34,197,94,0.14),transparent_55%)]",
    blur: "absolute inset-0 -z-10 backdrop-blur-[2px]",

    card:
        "w-full max-w-lg rounded-3xl overflow-hidden bg-white/55 backdrop-blur-md " +
        "shadow-[0_18px_50px_rgba(0,0,0,0.10)] ring-1 ring-white/45",
    accent: "h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500",

    label: "text-sm text-neutral-600",
    title: "text-2xl font-extrabold text-neutral-900",
    help: "text-sm text-neutral-700",
    tiny: "text-xs text-neutral-600",

    input:
        "w-full rounded-2xl px-4 py-3 text-sm outline-none " +
        "bg-white/75 text-neutral-900 placeholder:text-neutral-400 " +
        "shadow-sm ring-1 ring-white/45 " +
        "focus:ring-4 focus:ring-indigo-500/15",

    btn:
        "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition " +
        "bg-neutral-900 text-white hover:bg-neutral-800 " +
        "disabled:opacity-60 disabled:cursor-not-allowed",

    linkBtn:
        "rounded-2xl px-3 py-2 text-sm font-semibold transition " +
        "bg-white/55 hover:bg-white/70 text-neutral-900 " +
        "ring-1 ring-white/45 shadow-sm",
};

function Alert({ tone = "ok", children }) {
    const tones = {
        ok: "bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/15",
        err: "bg-rose-500/10 text-rose-900 ring-1 ring-rose-500/15",
    };
    return <div className={cx("rounded-2xl px-4 py-3 text-sm", tones[tone] || tones.ok)}>{children}</div>;
}

export default function RequestAccess() {
    const formRef = useRef(null);

    const [ok, setOk] = useState(false);
    const [err, setErr] = useState(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();

        // prendo il form subito (non dipendo da e.currentTarget dopo gli await)
        const form = e.currentTarget;

        setErr(null);
        setOk(false);
        setPending(true);

        const fd = new FormData(form);
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

            // reset safe (niente errore anche se form non c'è più)
            formRef.current?.reset?.();
        } catch (e2) {
            setErr(e2?.message || "Errore invio richiesta");
        } finally {
            setPending(false);
        }
    }

    return (
        <div className={UI.shell}>
            {/* stesso background “premium” del layout */}
            <div className={UI.bg1} />
            <div className={UI.bg2} />
            <div className={UI.blur} />

            <div className={UI.card}>
                <div className={UI.accent} />

                <div className="p-6 sm:p-7 space-y-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className={UI.label}>Richiesta abilitazione</div>
                            <h1 className={UI.title}>Accesso alla dashboard</h1>
                        </div>

                        <Link to="/login" className={UI.linkBtn}>
                            Torna al login
                        </Link>
                    </div>

                    <div className={UI.help}>
                        La creazione utenti non è pubblica: <span className="font-semibold">solo la developer</span> può registrare nuovi utenti.
                        Compila il form per richiedere l’abilitazione.
                    </div>

                    {ok ? <Alert tone="ok">Richiesta inviata. Verrai contattato dall’amministrazione.</Alert> : null}
                    {err ? <Alert tone="err">{err}</Alert> : null}

                    <form ref={formRef} className="space-y-3" onSubmit={onSubmit}>
                        <input name="name" placeholder="Nome e cognome *" required className={UI.input} />
                        <input name="email" type="email" placeholder="Email istituzionale *" required className={UI.input} />
                        <input name="ente" placeholder="Ente / Struttura (opzionale)" className={UI.input} />

                        <textarea
                            name="note"
                            rows={4}
                            placeholder="Motivazione / ruolo / note (opzionale)"
                            className={cx(UI.input, "resize-none")}
                        />

                        <button disabled={pending} className={UI.btn}>
                            {pending ? "Invio..." : "Invia richiesta"}
                        </button>

                        <div className={UI.tiny}>
                            Le richieste saranno valutate dall’amministrazione. Se hai già una richiesta pendente, non inviare duplicati.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}