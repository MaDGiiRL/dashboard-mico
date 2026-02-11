export default function CardHeader({ icon: Icon, title, canAdd, onAdd, addLabel = "Aggiungi" }) {
    return (
        <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
                {Icon ? <Icon size={18} className="text-neutral-700" /> : null}
                <div className="font-extrabold text-neutral-900 truncate">{title}</div>
            </div>

            <div className="shrink-0">
                {canAdd ? (
                    <button
                        type="button"
                        className={[
                            "rounded-2xl px-3 py-2 text-sm flex items-center gap-2 transition",
                            "bg-white/55 hover:bg-white/70 text-neutral-900 shadow-sm",
                            "ring-1 ring-white/45",
                            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                        ].join(" ")}
                        onClick={onAdd}
                        title={addLabel}
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline font-semibold">{addLabel}</span>
                    </button>
                ) : (
                    <div
                        className={[
                            "rounded-2xl px-3 py-2 text-sm flex items-center gap-2",
                            "bg-black/5 text-neutral-600",
                            "ring-1 ring-black/5",
                        ].join(" ")}
                        title="Non hai permessi di modifica"
                    >
                        <Lock size={16} />
                        <span className="hidden sm:inline font-semibold">Solo lettura</span>
                    </div>
                )}
            </div>
        </div>
    );
}
