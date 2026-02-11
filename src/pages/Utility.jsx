// src/pages/Utility.jsx
import { useMemo, useState } from "react";
import { ExternalLink, KeyRound, PlugZap, TrafficCone, Copy, Check } from "lucide-react";

/* ------------------ helpers ------------------ */
function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

async function copyToClipboard(text) {
    if (!text) return;
    await navigator.clipboard?.writeText(String(text));
}

/* ------------------ UI (stesso stile, NO dark) ------------------ */
const UI = {
    card: cx("rounded-3xl overflow-hidden", "bg-white/55 backdrop-blur-md", "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"),
    softRing: "ring-1 ring-white/45",
    accent: "h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500",
    dim: "text-neutral-600",
    dim2: "text-neutral-500",
};

function Section({ title, icon: Icon, children, right }) {
    return (
        <div className={cx(UI.card, UI.softRing)}>
            <div className={UI.accent} />
            <div className="p-5 bg-white/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        {Icon ? (
                            <div className="h-11 w-11 rounded-2xl bg-white/55 ring-1 ring-white/45 shadow-sm grid place-items-center">
                                <Icon size={18} className="text-neutral-900" />
                            </div>
                        ) : null}
                        <div className="min-w-0">
                            <div className="text-lg font-extrabold text-neutral-900 truncate">{title}</div>
                            <div className={cx("text-xs mt-1", UI.dim2)}>Risorse operative e credenziali</div>
                        </div>
                    </div>
                    {right ? <div className="shrink-0">{right}</div> : null}
                </div>

                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}

function LinkCard({ title, subtitle, href, icon: Icon }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={cx(
                "group block rounded-3xl overflow-hidden transition",
                "bg-white/55 ring-1 ring-white/45 shadow-sm hover:bg-white/70",
                "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
            )}
        >
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
            <div className="p-5 bg-white/40">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3">
                            {Icon ? (
                                <div className="h-11 w-11 rounded-2xl bg-white/55 ring-1 ring-white/45 shadow-sm grid place-items-center">
                                    <Icon size={18} className="text-neutral-900" />
                                </div>
                            ) : null}
                            <div className="min-w-0">
                                <div className="font-extrabold text-neutral-900 truncate">{title}</div>
                                {subtitle ? <div className={cx("text-sm mt-1", UI.dim)}>{subtitle}</div> : null}
                            </div>
                        </div>
                    </div>

                    <ExternalLink className="h-5 w-5 text-neutral-400 group-hover:text-neutral-700" />
                </div>
            </div>
        </a>
    );
}

function FieldCard({ label, value, onCopy, copied }) {
    return (
        <div className={cx("rounded-3xl overflow-hidden", "bg-white/55 ring-1 ring-white/45 shadow-sm")}>
            <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />
            <div className="p-5 bg-white/40">
                <div className="text-xs font-extrabold tracking-wide text-neutral-500">{label}</div>
                <div className="mt-2 font-extrabold text-neutral-900 break-all">{value}</div>

                <button
                    type="button"
                    onClick={onCopy}
                    className={cx(
                        "mt-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold transition",
                        "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm ring-1 ring-white/45",
                        "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                    )}
                >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copia
                </button>
            </div>
        </div>
    );
}

export default function Utility() {
    const ENEL = "https://www.e-distribuzione.it/interruzione-corrente-primo.html";
    const QMAP = "https://alertnews.qmap.it/";
    const USER_ID = "protezionecivile.ssv@regione.veneto.it";

    // Password: NON hardcodare. Mettila come env var (Vite: import.meta.env.VITE_..., CRA: process.env.REACT_APP_...)
    const PASSWORD =
        (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_UTILITY_PSW) ||
        (typeof process !== "undefined" && process.env && process.env.REACT_APP_UTILITY_PSW) ||
        "";

    const [copied, setCopied] = useState(null);

    const masked = useMemo(() => (PASSWORD ? "•".repeat(Math.min(10, PASSWORD.length)) : "—"), [PASSWORD]);

    async function doCopy(kind, text) {
        await copyToClipboard(text);
        setCopied(kind);
        window.setTimeout(() => setCopied(null), 1200);
    }

    return (
        <div className="space-y-6">
            {/* header */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-6 bg-white/40">
                    <div className="text-sm font-extrabold tracking-wide text-neutral-600">LINK RAPIDI</div>
                    <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">Utility</h1>
                    <div className={cx("mt-2 text-xs", UI.dim2)}>Accessi esterni e credenziali (solo consultazione)</div>
                </div>
            </div>

            {/* servizi */}
            <Section title="Servizi essenziali" icon={PlugZap}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LinkCard
                        title="Interruzioni corrente (e-Distribuzione / Enel)"
                        subtitle="Ricerca guasti e interruzioni programmate"
                        href={ENEL}
                        icon={PlugZap}
                    />
                    <LinkCard
                        title="Monitoraggio strade (AlertNews / QMap)"
                        subtitle="Segnalazioni e viabilità in tempo reale"
                        href={QMAP}
                        icon={TrafficCone}
                    />
                </div>
            </Section>

            {/* credenziali */}
            <Section title="Credenziali (solo consultazione)" icon={KeyRound}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <FieldCard
                        label="ID"
                        value={USER_ID}
                        copied={copied === "id"}
                        onCopy={() => doCopy("id", USER_ID)}
                    />

                    <div className={cx("rounded-3xl overflow-hidden", "bg-white/55 ring-1 ring-white/45 shadow-sm")}>
                        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
                        <div className="p-5 bg-white/40">
                            <div className="text-xs font-extrabold tracking-wide text-neutral-500">Password</div>
                            <div className="mt-2 font-extrabold text-neutral-900">{masked}</div>

                            <button
                                type="button"
                                disabled={!PASSWORD}
                                onClick={() => doCopy("psw", PASSWORD)}
                                className={cx(
                                    "mt-4 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold transition",
                                    "shadow-sm ring-1 focus:outline-none focus:ring-4 focus:ring-indigo-500/15",
                                    PASSWORD
                                        ? "bg-white/55 hover:bg-white/70 text-neutral-900 ring-white/45"
                                        : "bg-neutral-100/70 text-neutral-400 ring-white/45 cursor-not-allowed opacity-80"
                                )}
                            >
                                {copied === "psw" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                Copia password
                            </button>

                            {!PASSWORD ? (
                                <div className="mt-3 text-xs text-neutral-500">
                                    Imposta <span className="font-extrabold text-neutral-900">VITE_UTILITY_PSW</span> (Vite) oppure{" "}
                                    <span className="font-extrabold text-neutral-900">REACT_APP_UTILITY_PSW</span> (CRA).
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
}
