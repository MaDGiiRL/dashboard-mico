// src/pages/Utility.jsx
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ExternalLink,
    KeyRound,
    PlugZap,
    TrafficCone,
    Copy,
    Check,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import { api } from "../lib/api.js";

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
    card: cx(
        "rounded-3xl overflow-hidden",
        "bg-white/55 backdrop-blur-md",
        "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"
    ),
    softRing: "ring-1 ring-white/45",
    accent: "h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500",
    dim: "text-neutral-600",
    dim2: "text-neutral-500",
};

function Section({ title, icon: Icon, children, right, subtitle = "Risorse operative e credenziali" }) {
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
                            <div className={cx("text-xs mt-1", UI.dim2)}>{subtitle}</div>
                        </div>
                    </div>
                    {right ? <div className="shrink-0">{right}</div> : null}
                </div>

                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}

function LinkCard({ title, subtitle, href, icon: Icon, right }) {
    return (
        <div className="relative">
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

                        <div className="flex items-center gap-2">
                            {right}
                            <ExternalLink className="h-5 w-5 text-neutral-400 group-hover:text-neutral-700" />
                        </div>
                    </div>
                </div>
            </a>
        </div>
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

function Modal({ open, title, onClose, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999]">
            {/* overlay */}
            <button
                type="button"
                aria-label="Chiudi"
                onClick={onClose}
                className="absolute inset-0 w-full h-full bg-black/20"
            />

            {/* panel */}
            <div className="relative mx-auto mt-16 w-[92vw] max-w-xl">
                <div className={cx(UI.card, UI.softRing, "bg-white/70")}>
                    <div className={UI.accent} />
                    <div className="p-5 bg-white/50">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-extrabold text-neutral-900">{title}</div>
                                <div className={cx("text-xs mt-1", UI.dim2)}>Salvato nel database</div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className={cx(
                                    "h-10 w-10 rounded-2xl grid place-items-center",
                                    "bg-white/60 ring-1 ring-white/45 shadow-sm hover:bg-white/80",
                                    "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                                )}
                            >
                                <X className="h-4 w-4 text-neutral-900" />
                            </button>
                        </div>

                        <div className="mt-4">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Utility() {
    const qc = useQueryClient();

    const ENEL = "https://www.e-distribuzione.it/interruzione-corrente-primo.html";
    const QMAP = "https://alertnews.qmap.it/";
    const USER_ID = "protezionecivile.ssv@regione.veneto.it";

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

    // ---- DB links (utility links)
    const linksQ = useQuery({
        queryKey: ["utilityLinks"],
        queryFn: () => api.listUtilityLinks(),
    });

    const createM = useMutation({
        mutationFn: (payload) => api.createUtilityLink(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["utilityLinks"] }),
    });

    const deleteM = useMutation({
        mutationFn: (id) => api.deleteUtilityLink(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["utilityLinks"] }),
    });

    // modal state
    const [openModal, setOpenModal] = useState(false);

    // form state
    const [newTitle, setNewTitle] = useState("");
    const [newHref, setNewHref] = useState("");
    const [newSubtitle, setNewSubtitle] = useState("");

    function openAdd() {
        setOpenModal(true);
    }

    function closeAdd() {
        setOpenModal(false);
        createM.reset?.();
    }

    function submitNewLink(e) {
        e.preventDefault();
        const title = newTitle.trim();
        const href = newHref.trim();
        const subtitle = newSubtitle.trim();

        if (!title || !href) return;

        createM.mutate(
            { title, href, subtitle: subtitle || null, sort_order: 0 },
            {
                onSuccess: () => {
                    setNewTitle("");
                    setNewHref("");
                    setNewSubtitle("");
                    setOpenModal(false);
                },
            }
        );
    }

    return (
        <div className="space-y-6">
            {/* header */}
            <div className={cx(UI.card, UI.softRing)}>
                <div className={UI.accent} />
                <div className="p-6 bg-white/40">
                    <div className="text-sm font-extrabold tracking-wide text-neutral-600">LINK RAPIDI</div>
                    <h1 className="mt-1 text-2xl font-extrabold text-neutral-900">Utility</h1>
                    <div className={cx("mt-2 text-xs", UI.dim2)}>Accessi esterni e credenziali</div>
                </div>
            </div>

            {/* servizi essenziali + link aggiuntivi DB */}
            <Section
                title="Servizi essenziali"
                icon={PlugZap}
                subtitle=""
                right={
                    <button
                        type="button"
                        onClick={openAdd}
                        className={cx(
                            "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold transition",
                            "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm ring-1 ring-white/45",
                            "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                        )}
                    >
                        <Plus className="h-4 w-4" />
                        Aggiungi link
                    </button>
                    
                }
                
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* fissi */}
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

                    {/* dal DB */}
                    {linksQ.isLoading ? (
                        <div className={cx("text-sm", UI.dim2)}>Caricamento link aggiuntivi…</div>
                    ) : linksQ.error ? (
                        <div className="text-sm text-rose-600">Errore: {String(linksQ.error.message || linksQ.error)}</div>
                    ) : (
                        (linksQ.data || []).map((l) => (
                            <LinkCard
                                key={l.id}
                                title={l.title}
                                subtitle={l.subtitle}
                                href={l.href}
                                icon={ExternalLink}
                                right={
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            deleteM.mutate(l.id);
                                        }}
                                        title="Rimuovi"
                                        className={cx(
                                            "inline-flex items-center justify-center",
                                            "h-9 w-9 rounded-2xl bg-white/55 ring-1 ring-white/45 shadow-sm",
                                            "hover:bg-white/70 focus:outline-none focus:ring-4 focus:ring-rose-500/15"
                                        )}
                                    >
                                        <Trash2 className="h-4 w-4 text-rose-600" />
                                    </button>
                                }
                            />
                        ))
                    )}
                </div>

                {!linksQ.isLoading && !linksQ.error && (linksQ.data || []).length === 0 ? (
                    <div className={cx("mt-3 text-xs", UI.dim2)}></div>
                ) : null}
            </Section>

            {/* MODALE aggiungi */}
            <Modal open={openModal} title="Aggiungi link utile" onClose={closeAdd}>
                <form onSubmit={submitNewLink} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Titolo (es. Meteo ARPAV)"
                            className="rounded-2xl bg-white/70 ring-1 ring-white/45 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                            required
                            autoFocus
                        />
                        <input
                            value={newHref}
                            onChange={(e) => setNewHref(e.target.value)}
                            placeholder="https://..."
                            className="rounded-2xl bg-white/70 ring-1 ring-white/45 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                            required
                        />
                        <input
                            value={newSubtitle}
                            onChange={(e) => setNewSubtitle(e.target.value)}
                            placeholder="Sottotitolo (opzionale)"
                            className="rounded-2xl bg-white/70 ring-1 ring-white/45 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                        />
                    </div>

                    {createM.error ? (
                        <div className="text-sm text-rose-600">Errore: {String(createM.error.message || createM.error)}</div>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={closeAdd}
                            className={cx(
                                "rounded-2xl px-3 py-2 text-sm font-extrabold transition",
                                "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                "focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                            )}
                        >
                            Annulla
                        </button>

                        <button
                            type="submit"
                            disabled={createM.isPending}
                            className={cx(
                                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold transition",
                                "bg-white/65 hover:bg-white/80 text-neutral-900 shadow-sm ring-1 ring-white/45",
                                "focus:outline-none focus:ring-4 focus:ring-indigo-500/15",
                                createM.isPending && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            <Plus className="h-4 w-4" />
                            Salva
                        </button>
                    </div>
                </form>
            </Modal>

            {/* credenziali */}
            <Section title="Credenziali" icon={KeyRound} subtitle="">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <FieldCard label="ID" value={USER_ID} copied={copied === "id"} onCopy={() => doCopy("id", USER_ID)} />

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
