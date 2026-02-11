// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../lib/auth.jsx";
import { useNavigate, Link } from "react-router-dom";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState(null);

  return (
    <div className="relative min-h-screen text-slate-900">


      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Top badge */}
          <div className="mx-auto mb-4 w-fit rounded-full border border-white/30 bg-white/25 px-4 py-2 text-xs font-semibold text-white shadow-sm backdrop-blur">
            Dashboard Operativa • Milano–Cortina 2026
          </div>

          {/* Card */}
          <div className="relative overflow-hidden rounded-[28px] border border-white/35 bg-white/80 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.55)] backdrop-blur-xl">
            {/* Decorative gradients */}
            <div
              className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(2,132,199,0.55) 0%, rgba(2,132,199,0.0) 60%)",
              }}
            />
            <div
              className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 70% 70%, rgba(220,38,38,0.35) 0%, rgba(220,38,38,0.0) 62%)",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/55 via-white/15 to-white/0" />

            <div className="relative p-6 sm:p-7 space-y-5">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                    <img
                      src="/logo.png"
                      alt="Logo Olimpiadi"
                      className="h-full w-full object-contain p-1.5"
                    />
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                    <img
                      src="/logo-mico.png"
                      alt="Logo Protezione Civile"
                      className="h-full w-full object-contain p-1.5"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-xs text-slate-600">Protezione Civile</div>
                  <div className="text-lg font-semibold truncate">
                    Olimpiadi Milano–Cortina 2026
                  </div>
                  <div className="text-xs text-slate-600">
                    Accesso dashboard operativa
                  </div>
                </div>
              </div>

              {/* Error */}
              {err && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <div className="font-semibold">Errore</div>
                  <div className="mt-1">{err}</div>
                </div>
              )}

              {/* Form */}
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
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Email
                  </label>
                  <input
                    className={cx(
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                      "bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400",
                      "focus:ring-4 focus:ring-sky-500/15 focus:border-sky-300"
                    )}
                    name="email"
                    type="email"
                    placeholder="nome.cognome@ente.it"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    className={cx(
                      "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
                      "bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400",
                      "focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-300"
                    )}
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  className={cx(
                    "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    "text-white shadow-sm",
                    "bg-gradient-to-r from-sky-600 via-blue-700 to-rose-600",
                    "hover:brightness-[1.03] active:brightness-95",
                    "focus:outline-none focus:ring-4 focus:ring-white/40"
                  )}
                >
                  Entra
                </button>

                {/* Micro footer actions */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-600">
                    Connessione sicura • Token JWT
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/90 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                    <span className="text-slate-700 font-semibold">Online</span>
                  </span>
                </div>
              </form>

              {/* Disclaimer */}
              <div className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-3 text-xs text-slate-700">
                <b className="text-slate-900">Disclaimer:</b> la registrazione di
                nuovi utenti è gestita esclusivamente dalla
                developer/amministrazione.
                <div className="mt-2">
                  Per richiedere l’abilitazione{" "}
                  <Link
                    to="/richiesta-abilitazione"
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    clicca qui
                  </Link>
                  .
                </div>
              </div>
            </div>
          </div>

          {/* Bottom footer */}
          <div className="mt-4 text-center text-xs text-white/90">
            <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 backdrop-blur">
              Protezione Civile Regione Veneto • Dashboard interna
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
