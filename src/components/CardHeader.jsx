// src/components/CardHeader.jsx
import React from "react";
import { Plus, Lock } from "lucide-react";

export default function CardHeader({ icon: Icon, title, canAdd, onAdd, addLabel = "Aggiungi" }) {
    return (
        <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
                {Icon ? <Icon size={18} className="text-neutral-300" /> : null}
                <div className="font-semibold">{title}</div>
            </div>

            <div className="shrink-0">
                {canAdd ? (
                    <button
                        type="button"
                        className="rounded-xl border border-neutral-800 bg-neutral-950/20 px-3 py-2 text-sm hover:bg-neutral-800/60 flex items-center gap-2"
                        onClick={onAdd}
                        title={addLabel}
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">{addLabel}</span>
                    </button>
                ) : (
                    <div
                        className="rounded-xl border border-neutral-800 bg-neutral-950/20 px-3 py-2 text-sm text-neutral-400 flex items-center gap-2"
                        title="Non hai permessi di modifica"
                    >
                        <Lock size={16} />
                        <span className="hidden sm:inline">Solo lettura</span>
                    </div>
                )}
            </div>
        </div>
    );
}
