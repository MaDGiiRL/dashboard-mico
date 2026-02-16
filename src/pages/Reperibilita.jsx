// src/pages/Reperibilita.jsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "../components/Card.jsx";
import { reperibilitaData } from "../data/reperibilitaData.js";
import { api } from "../lib/api.js";
import { Phone, Copy, Search, CalendarDays, Shield } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard?.writeText(String(text));
}

function fmtDayShort(iso) {
  try {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

const UI = {
  card: cx(
    "rounded-3xl overflow-hidden",
    "bg-white/55 backdrop-blur-md",
    "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"
  ),
  accent: "h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500",
  softRing: "ring-1 ring-white/45",
  input:
    "w-full rounded-2xl px-4 py-3 text-sm outline-none " +
    "bg-white/75 text-neutral-900 placeholder:text-neutral-400 " +
    "shadow-sm ring-1 ring-white/45 " +
    "focus:ring-4 focus:ring-indigo-500/15",
};

function Tag({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
    fuchsia: "bg-fuchsia-500/10 text-fuchsia-900 ring-1 ring-fuchsia-500/15",
    violet: "bg-violet-500/14 text-violet-950 ring-1 ring-violet-500/18",
    cyan: "bg-cyan-500/14 text-cyan-950 ring-1 ring-cyan-500/18",
    emerald: "bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/15",
    amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
  };
  return (
    <span
      className={cx(
        "rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide inline-flex items-center gap-1",
        tones[tone] || tones.neutral
      )}
    >
      {children}
    </span>
  );
}

function Input({ className, ...props }) {
  return <input {...props} className={cx(UI.input, className)} />;
}

function Btn({ onClick, href, disabled, title, children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-white/55 hover:bg-white/70 text-neutral-900 ring-white/45",
    emerald: "bg-emerald-500/12 hover:bg-emerald-500/16 text-emerald-900 ring-emerald-500/15",
  };
  const t = tones[tone] || tones.neutral;

  const Comp = href ? "a" : "button";
  const props = href
    ? { href, target: "_blank", rel: "noreferrer" }
    : { type: "button", onClick, disabled };

  return (
    <Comp
      {...props}
      title={title}
      className={cx(
        "rounded-2xl px-3 py-2 text-xs font-extrabold transition inline-flex items-center gap-2",
        "shadow-sm ring-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
        t,
        disabled ? "opacity-50 pointer-events-none" : ""
      )}
    >
      {children}
    </Comp>
  );
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
    violet: "bg-violet-500/14 text-violet-950 ring-1 ring-violet-500/18",
    cyan: "bg-cyan-500/14 text-cyan-950 ring-1 ring-cyan-500/18",
    amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
    green: "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/15",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide",
        tones[tone] || tones.neutral
      )}
    >
      {children}
    </span>
  );
}

function TabBtn({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-3 py-2 text-sm transition",
        "shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
        active
          ? "bg-violet-500/14 ring-1 ring-violet-500/18"
          : "bg-white/45 hover:bg-white/60 ring-1 ring-white/45"
      )}
    >
      {children}
    </button>
  );
}

/* ====== Febbraio 2026, griglia 7x5 ====== */
const MONTH = "2026-02";
const GRID = (() => {
  const start = new Date(Date.UTC(2026, 0, 26)); // 2026-01-26 (lun)
  const out = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i)
    );
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
  }
  return out;
})();
const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const SHIFT_NIGHT = "20-8";
const SHIFT_DAY = "8-20";
const SHIFTS = [
  { key: SHIFT_NIGHT, label: "20–8" },
  { key: SHIFT_DAY, label: "8–20" },
];

function slotKey(day, shift, slot) {
  return `${day}|${shift}|${slot}`;
}

export default function Reperibilita() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pc");
  const [pcKind, setPcKind] = useState("olympics");
  const [q, setQ] = useState("");

  // ✅ FIX: override locale per evitare "rimbalzo" del turno selezionato
  const [uiOverride, setUiOverride] = useState(() => new Map());
  useEffect(() => {
    // quando cambio calendario (olympics/paralympics) pulisco override
    setUiOverride(new Map());
  }, [pcKind]);

  const search = q.trim().toLowerCase();

  const pcQueryKey = useMemo(() => ["pcMonth", pcKind, MONTH], [pcKind]);

  // PC dal DB (solo Febbraio 2026)
  const pcQuery = useQuery({
    queryKey: pcQueryKey,
    queryFn: () => api.listPcMonth({ kind: pcKind, month: MONTH }),
  });

  // ✅ AGGIUNTA: mutation per riempire slot vuoti (bottone +)
  const pcAssign = useMutation({
    mutationFn: (payload) => {
      if (typeof api.pcAssign !== "function") {
        throw new Error("api.pcAssign non esiste in src/lib/api.js");
      }
      return api.pcAssign(payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: pcQueryKey });
    },
  });

  // ✅ AGGIUNTA: handler per bottone "+"
  async function addToSlot(dayIso, shift, slot) {
    const name = window.prompt("Nome reperibile:");
    if (!name || !String(name).trim()) return;

    const phone = window.prompt("Telefono reperibile:");
    if (!phone || !String(phone).trim()) return;

    pcAssign.mutate({
      kind: pcKind,
      day: dayIso,
      shift,
      slot,
      person_name: String(name).trim(),
      person_phone: String(phone).trim(),
    });
  }

  // -------- Optimistic: cambia turno del giorno subito --------
  const setDayUi = useMutation({
    mutationFn: (payload) => api.setPcDayUi(payload),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: pcQueryKey });

      const prev = qc.getQueryData(pcQueryKey);

      qc.setQueryData(pcQueryKey, (old) => {
        const cur = old || { rows: [], ui: [] };
        const day = String(payload.day).slice(0, 10);
        const active_shift = payload.active_shift;

        const ui = Array.isArray(cur.ui) ? [...cur.ui] : [];
        const idx = ui.findIndex((x) => String(x.day).slice(0, 10) === day);

        if (idx >= 0) ui[idx] = { ...ui[idx], day, active_shift };
        else ui.push({ day, active_shift });

        return { ...cur, ui };
      });

      return { prev };
    },

    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(pcQueryKey, ctx.prev);
    },

    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: pcQueryKey });
    },
  });

  // -------- Optimistic: drag&drop con SWAP --------
  const movePc = useMutation({
    mutationFn: (payload) => api.movePc(payload),

    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: pcQueryKey });

      const prev = qc.getQueryData(pcQueryKey);

      qc.setQueryData(pcQueryKey, (old) => {
        const cur = old || { rows: [], ui: [] };
        const rows = Array.isArray(cur.rows) ? [...cur.rows] : [];

        const fromDay = String(payload.from.day).slice(0, 10);
        const toDay = String(payload.to.day).slice(0, 10);
        const fromShift = payload.from.shift;
        const toShift = payload.to.shift;
        const fromSlot = Number(payload.from.slot);
        const toSlot = Number(payload.to.slot);

        const fromIdx = rows.findIndex(
          (r) =>
            String(r.day).slice(0, 10) === fromDay &&
            String(r.shift) === String(fromShift) &&
            Number(r.slot) === fromSlot
        );
        const toIdx = rows.findIndex(
          (r) =>
            String(r.day).slice(0, 10) === toDay &&
            String(r.shift) === String(toShift) &&
            Number(r.slot) === toSlot
        );

        if (fromIdx < 0) return cur;

        if (toIdx >= 0) {
          const a = rows[fromIdx];
          const b = rows[toIdx];

          rows[fromIdx] = { ...b, day: a.day, shift: a.shift, slot: a.slot };
          rows[toIdx] = { ...a, day: b.day, shift: b.shift, slot: b.slot };
        } else {
          const a = rows[fromIdx];
          rows[fromIdx] = { ...a, day: toDay, shift: toShift, slot: toSlot };
        }

        return { ...cur, rows };
      });

      return { prev };
    },

    onError: (_err, _payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(pcQueryKey, ctx.prev);
    },

    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: pcQueryKey });
    },
  });

  const { bySlot, activeShiftByDay } = useMemo(() => {
    const rows = pcQuery.data?.rows || [];
    const ui = pcQuery.data?.ui || [];

    const bySlot = new Map();
    for (const r of rows) {
      const day = String(r.day).slice(0, 10);
      bySlot.set(slotKey(day, r.shift, r.slot), r);
    }

    const activeShiftByDay = new Map();
    for (const u of ui) {
      const day = String(u.day).slice(0, 10);
      activeShiftByDay.set(day, u.active_shift);
    }

    // ✅ override locale (priorità massima)
    for (const [d, sh] of uiOverride.entries()) {
      activeShiftByDay.set(String(d).slice(0, 10), sh);
    }

    // default: se non impostato, scegli quello che esiste (priorità 20-8)
    for (const d of GRID) {
      if (!d.startsWith("2026-02-")) continue;
      if (activeShiftByDay.has(d)) continue;

      const hasNight =
        bySlot.has(slotKey(d, SHIFT_NIGHT, 1)) ||
        bySlot.has(slotKey(d, SHIFT_NIGHT, 2)) ||
        bySlot.has(slotKey(d, SHIFT_NIGHT, 3));

      const hasDay =
        bySlot.has(slotKey(d, SHIFT_DAY, 1)) ||
        bySlot.has(slotKey(d, SHIFT_DAY, 2)) ||
        bySlot.has(slotKey(d, SHIFT_DAY, 3));

      activeShiftByDay.set(d, hasNight ? SHIFT_NIGHT : hasDay ? SHIFT_DAY : SHIFT_NIGHT);
    }

    return { bySlot, activeShiftByDay };
  }, [pcQuery.data, uiOverride]);

  function allowDrop(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDragStart(e, payload) {
    try {
      e.dataTransfer.setData("application/json", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";
    } catch { }
  }

  function onDrop(e, toDay, toShift, toSlot) {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("application/json");
      const payload = JSON.parse(raw || "{}");

      if (
        payload?.fromDay === toDay &&
        payload?.fromShift === toShift &&
        Number(payload?.fromSlot) === Number(toSlot)
      )
        return;

      movePc.mutate({
        kind: pcKind,
        from: { day: payload.fromDay, shift: payload.fromShift, slot: payload.fromSlot },
        to: { day: toDay, shift: toShift, slot: toSlot },
      });
    } catch { }
  }

  // tabs statiche AIB/ANA
  const aibRows = useMemo(() => {
    const base = reperibilitaData.aib || [];
    if (!search) return base;
    return base.filter(
      (x) =>
        (x.zone || "").toLowerCase().includes(search) ||
        (x.phone || "").toLowerCase().includes(search)
    );
  }, [search]);

  const anaRows = useMemo(() => {
    const base = reperibilitaData.ana || [];
    if (!search) return base;
    return base.filter((r) =>
      [r.role, r.name, r.phone].some((v) => (v || "").toLowerCase().includes(search))
    );
  }, [search]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className={cx(UI.card, UI.softRing)}>
        <div className="p-6 bg-white/45 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs font-extrabold tracking-wide text-neutral-600">
                  CALENDARI & CONTATTI
                </div>
                <Tag tone="fuchsia">OPERATIVO</Tag>
              </div>

              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-neutral-900">
                Reperibilità
              </h1>
            </div>

            <div className="w-full sm:w-[420px]">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cerca nome, numero, data…"
                  className="pl-10 pr-4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        <TabBtn active={tab === "pc"} onClick={() => setTab("pc")}>
          <Pill tone="violet">PC</Pill>
        </TabBtn>
        <TabBtn active={tab === "aib"} onClick={() => setTab("aib")}>
          <Pill tone="green">AIB SF</Pill>
        </TabBtn>
        <TabBtn active={tab === "ana"} onClick={() => setTab("ana")}>
          <Pill tone="amber">A.N.A.</Pill>
        </TabBtn>
      </div>

      {/* PC */}
      {tab === "pc" && (
        <Card title="Reperibili PC ">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                  <CalendarDays className="w-5 h-5 text-neutral-900" />
                </div>
                <div className="min-w-0">
                  <div className="text-neutral-500 text-xs font-extrabold tracking-wide">PC</div>
                  <h2 className="text-xl font-extrabold text-neutral-900 truncate">
                    Febbraio 2026
                  </h2>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPcKind("olympics")}
                  className={cx(
                    "rounded-2xl px-3 py-2 text-sm font-extrabold transition shadow-sm ring-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                    pcKind === "olympics"
                      ? "ring-violet-500/18 bg-violet-500/14 text-violet-950"
                      : "ring-white/45 bg-white/45 hover:bg-white/60 text-neutral-800"
                  )}
                >
                  Olimpiadi
                </button>
                <button
                  type="button"
                  onClick={() => setPcKind("paralympics")}
                  className={cx(
                    "rounded-2xl px-3 py-2 text-sm font-extrabold transition shadow-sm ring-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                    pcKind === "paralympics"
                      ? "ring-cyan-500/18 bg-cyan-500/14 text-cyan-950"
                      : "ring-white/45 bg-white/45 hover:bg-white/60 text-neutral-800"
                  )}
                >
                  Paralimpiadi
                </button>
              </div>
            </div>

            {pcQuery.isLoading ? <div className="text-sm text-neutral-500">Carico turni…</div> : null}
            {pcQuery.error ? (
              <div className="text-sm text-rose-700">{pcQuery.error.message}</div>
            ) : null}

            {/* Calendario */}
            <div className={cx(UI.card, UI.softRing, "bg-white/45")}>
              <div className={UI.accent} />
              <div className="p-4 bg-white/40">
                <div className="overflow-x-auto">
                  <div className="min-w-[1750px]">
                    <div className="grid grid-cols-7 gap-2">
                      {WEEKDAYS.map((w) => (
                        <div
                          key={w}
                          className="text-[11px] font-extrabold tracking-wide text-neutral-500 px-2 py-1"
                        >
                          {w}
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 grid grid-cols-7 gap-2">
                      {GRID.map((dayIso) => {
                        const inFeb = dayIso.startsWith("2026-02-");
                        const dayNum = Number(dayIso.slice(8, 10));
                        const activeShift = activeShiftByDay.get(dayIso) || SHIFT_NIGHT;

                        return (
                          <div
                            key={dayIso}
                            className={cx(
                              "rounded-3xl ring-1 ring-white/45 overflow-hidden bg-white/40 shadow-sm",
                              !inFeb && "opacity-35"
                            )}
                          >
                            <div className="px-3 py-2 bg-white/45 flex items-center justify-between gap-2">
                              <div className="text-xs font-extrabold text-neutral-900">
                                {String(dayNum).padStart(2, "0")}
                              </div>
                              <div className="text-[11px] font-extrabold text-neutral-500">
                                {fmtDayShort(dayIso)}
                              </div>
                            </div>

                            <div className="p-3 space-y-2">
                              {/* TAB TURNO */}
                              <div className="flex gap-2">
                                {SHIFTS.map((sh) => {
                                  const isActive = activeShift === sh.key;
                                  return (
                                    <button
                                      key={sh.key}
                                      type="button"
                                      disabled={!inFeb || setDayUi.isPending}
                                      onClick={() => {
                                        if (!inFeb) return;

                                        // ✅ FIX: salva subito UI locale (evita rimbalzo)
                                        setUiOverride((prev) => {
                                          const next = new Map(prev);
                                          next.set(dayIso, sh.key);
                                          return next;
                                        });

                                        setDayUi.mutate({
                                          kind: pcKind,
                                          day: dayIso,
                                          active_shift: sh.key,
                                        });
                                      }}
                                      className={cx(
                                        "flex-1 rounded-2xl px-2 py-2 text-xs font-extrabold transition ring-1",
                                        "shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                                        isActive
                                          ? sh.key === SHIFT_NIGHT
                                            ? "bg-violet-500/14 ring-violet-500/18 text-violet-950"
                                            : "bg-cyan-500/14 ring-cyan-500/18 text-cyan-950"
                                          : "bg-white/55 ring-white/45 text-neutral-700 hover:bg-white/70"
                                      )}
                                    >
                                      {sh.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* SOLO 3 SLOT del turno attivo */}
                              <div className="space-y-2">
                                {[1, 2, 3].map((slot) => {
                                  const row = bySlot.get(slotKey(dayIso, activeShift, slot));
                                  const name = row?.person_name || "";
                                  const phone = row?.person_phone || "";

                                  const matches =
                                    !search ||
                                    dayIso.includes(search) ||
                                    name.toLowerCase().includes(search) ||
                                    phone.toLowerCase().includes(search);

                                  const visualName = matches ? name : "";
                                  const visualPhone = matches ? phone : "";

                                  return (
                                    <div
                                      key={slot}
                                      onDragOver={allowDrop}
                                      onDrop={(e) => onDrop(e, dayIso, activeShift, slot)}
                                      className={cx(
                                        "rounded-2xl px-3 py-2 ring-1 transition",
                                        "bg-white/70 ring-white/45 hover:bg-white/85",
                                        movePc.isPending && "opacity-60 pointer-events-none"
                                      )}
                                      title="Drop qui per spostare. Se occupato: SWAP."
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <div className="text-[11px] text-neutral-500 font-extrabold">
                                            Slot {slot}
                                          </div>

                                          <div
                                            draggable={Boolean(row)}
                                            onDragStart={(e) => {
                                              if (!row) return;
                                              onDragStart(e, {
                                                fromDay: dayIso,
                                                fromShift: activeShift,
                                                fromSlot: slot,
                                              });
                                            }}
                                            className={cx(
                                              "mt-1 rounded-xl px-2 py-1",
                                              row
                                                ? "cursor-grab active:cursor-grabbing bg-white/60 ring-1 ring-white/45"
                                                : "bg-white/30 border border-dashed border-white/60"
                                            )}
                                          >
                                            <div className="text-xs font-extrabold text-neutral-900 truncate">
                                              {visualName || (row ? "— (filtrato)" : "Vuoto")}
                                            </div>
                                            <div className="text-[11px] text-neutral-600 truncate">
                                              {visualPhone || (row ? "" : "Trascina qui")}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 pt-5">
                                          {/* ✅ AGGIUNTA: se slot vuoto -> bottone + */}
                                          {!row && inFeb ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                addToSlot(dayIso, activeShift, slot);
                                              }}
                                              className={cx(
                                                "h-9 w-9 rounded-2xl font-extrabold text-sm",
                                                "bg-indigo-500/12 hover:bg-indigo-500/18 text-indigo-950",
                                                "ring-1 ring-indigo-500/18 shadow-sm",
                                                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
                                                pcAssign.isPending && "opacity-60 pointer-events-none"
                                              )}
                                              title="Aggiungi reperibile"
                                            >
                                              +
                                            </button>
                                          ) : (
                                            <>
                                              <Btn
                                                onClick={() => copyToClipboard(phone)}
                                                disabled={!phone || !matches}
                                                tone="neutral"
                                                title="Copia"
                                              >
                                                <Copy className="w-3.5 h-3.5" />
                                              </Btn>
                                              <Btn
                                                href={phone && matches ? `tel:${phone}` : undefined}
                                                disabled={!phone || !matches}
                                                tone="emerald"
                                                title="Chiama"
                                              >
                                                <Phone className="w-3.5 h-3.5" />
                                              </Btn>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="text-[11px] text-neutral-500 font-extrabold">
                                turno attivo:{" "}
                                <span className="text-neutral-900">{activeShift}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 text-xs text-neutral-500 font-extrabold">
                      Drag&drop salva su DB • tab turno salva su DB (pc_day_ui) • Febbraio only.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* AIB */}
      {tab === "aib" && (
        <Card title="Reperibili AIB SF">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                <Shield className="w-5 h-5 text-neutral-900" />
              </div>
              <div>
                <div className="text-neutral-500 text-xs font-extrabold tracking-wide">AIB SF</div>
                <div className="text-xl font-extrabold text-neutral-900">Contatti per zona</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aibRows.map((z) => (
                <div key={z.zone} className={cx(UI.card, UI.softRing)}>
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
                  <div className="p-5 bg-white/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-neutral-900">{z.zone}</div>
                        <div className="text-sm text-neutral-700 mt-1">{z.phone}</div>
                      </div>
                      <div className="flex gap-2">
                        <Btn
                          href={`tel:${String(z.phone).replace(/\s+/g, "")}`}
                          tone="emerald"
                          title="Chiama"
                        >
                          <Phone className="w-3.5 h-3.5" /> Chiama
                        </Btn>
                        <Btn onClick={() => copyToClipboard(z.phone)} tone="neutral" title="Copia">
                          <Copy className="w-3.5 h-3.5" /> Copia
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {aibRows.length === 0 && <div className="text-neutral-600">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}

      {/* ANA */}
      {tab === "ana" && (
        <Card title="A.N.A. — Referenti">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
                <Shield className="w-5 h-5 text-neutral-900" />
              </div>
              <div>
                <div className="text-neutral-500 text-xs font-extrabold tracking-wide">A.N.A.</div>
                <div className="text-xl font-extrabold text-neutral-900">Referenti sul campo</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {anaRows.map((r) => (
                <div key={`${r.role}-${r.name}`} className={cx(UI.card, UI.softRing)}>
                  <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-fuchsia-500" />
                  <div className="p-5 bg-white/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-neutral-500 text-xs font-extrabold tracking-wide">
                          {r.role}
                        </div>
                        <div className="font-extrabold mt-1 text-neutral-900">{r.name}</div>
                        <div className="text-sm text-neutral-700 mt-1">{r.phone}</div>
                      </div>
                      <div className="flex gap-2">
                        <Btn
                          href={r.phone ? `tel:${r.phone}` : undefined}
                          disabled={!r.phone}
                          tone="emerald"
                          title="Chiama"
                        >
                          <Phone className="w-3.5 h-3.5" /> Chiama
                        </Btn>
                        <Btn
                          onClick={() => copyToClipboard(r.phone)}
                          disabled={!r.phone}
                          tone="neutral"
                          title="Copia"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copia
                        </Btn>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {anaRows.length === 0 && <div className="text-neutral-600">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
