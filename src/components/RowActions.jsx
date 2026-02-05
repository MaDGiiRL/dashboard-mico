// src/components/RowActions.jsx
import { Pencil, Trash2 } from "lucide-react";

export default function RowActions({ canWrite, onEdit, onDelete, disabled = false }) {
    if (!canWrite) return null;

    const btnBase =
        "rounded-xl border border-neutral-800 bg-neutral-950/20 px-2 py-2";
    const btnDisabled = "opacity-40 cursor-not-allowed pointer-events-none";

    return (
        <div className="flex items-center gap-2">
            <button
                className={`${btnBase} hover:bg-neutral-800/70 ${disabled ? btnDisabled : ""}`}
                onClick={onEdit}
                title="Modifica"
                type="button"
                disabled={disabled}
            >
                <Pencil size={16} />
            </button>
            <button
                className={`${btnBase} hover:bg-red-500/20 hover:border-red-500/40 ${disabled ? btnDisabled : ""}`}
                onClick={onDelete}
                title="Elimina"
                type="button"
                disabled={disabled}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
