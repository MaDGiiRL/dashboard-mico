// src/components/Modal.jsx
import React from "react";
import { X } from "lucide-react";

export default function Modal({ open, title, onClose, children }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={() => onClose?.()}>
      {/* overlay */}
      <div className="absolute inset-0 bg-black/45" />

      <div
        className="relative w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col bg-white/90 backdrop-blur border border-neutral-200 overflow-hidden"
        style={{ maxHeight: "calc(100vh - 2rem)" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ✅ top accent only */}
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-white/80">
          <div className="min-w-0">
            <div className="text-xs font-extrabold tracking-wide text-neutral-500">DETTAGLIO</div>
            <div className="text-lg font-semibold truncate text-neutral-900">{title}</div>
          </div>

          <button
            type="button"
            className="rounded-2xl border p-2 transition border-neutral-200 bg-white hover:bg-neutral-50 shadow-sm"
            onClick={() => onClose?.()}
            title="Chiudi"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 2rem - 72px)" }}>
          {children}
        </div>

        {/* subtle blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
      </div>
    </div>
  );
}
