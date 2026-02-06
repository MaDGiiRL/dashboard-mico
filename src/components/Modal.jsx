// src/components/Modal.jsx
import React from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children }) {
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => onClose?.()}>
            <div className="absolute inset-0 bg-black/70" />

            <div
                className="relative w-full max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col"
                style={{ maxHeight: "calc(100vh - 2rem)" }} // ✅ resta dentro viewport
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 border-b border-neutral-800 px-5 py-4">
                    <div className="min-w-0">
                        <div className="text-sm text-neutral-400">Dettaglio</div>
                        <div className="text-lg font-semibold truncate">{title}</div>
                    </div>

                    <button
                        type="button"
                        className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-2 hover:bg-neutral-800/60"
                        onClick={() => onClose?.()}
                        title="Chiudi"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ✅ scroll interno */}
                <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 2rem - 72px)" }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
