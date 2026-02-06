import { useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { reperibilitaData } from "../data/reperibilitaData.js";
import { Phone, Copy, Search, CalendarDays, Shield, MapPin, ChevronDown } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtDate(iso) {
  // iso: YYYY-MM-DD
  try {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("it-IT", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard?.writeText(String(text));
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-neutral-800/60 text-neutral-200 border-neutral-700",
    green: "bg-emerald-900/40 text-emerald-200 border-emerald-800",
    red: "bg-rose-900/40 text-rose-200 border-rose-800",
    cyan: "bg-cyan-900/40 text-cyan-200 border-cyan-800",
    violet: "bg-violet-900/40 text-violet-200 border-violet-800",
    amber: "bg-amber-900/40 text-amber-200 border-amber-800",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs", tones[tone] || tones.neutral)}>
      {children}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl p-2 bg-gradient-to-br from-violet-500/20 via-cyan-500/10 to-emerald-500/10 border border-neutral-800">
          <Icon className="w-5 h-5 text-neutral-100" />
        </div>
        <div>
          <div className="text-neutral-400 text-sm">{subtitle}</div>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      </div>
      {right}
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/40 overflow-hidden">
      <button
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-950/60"
      >
        <div className="font-semibold text-left">{title}</div>
        <ChevronDown className={cx("w-4 h-4 text-neutral-300 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function Reperibilita() {
  const [tab, setTab] = useState("pc");
  const [pcKind, setPcKind] = useState("olympics"); // olympics | paralympics
  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    const pcO = reperibilitaData.pc.olympics.length;
    const pcP = reperibilitaData.pc.paralympics.length;
    const coc = reperibilitaData.coc.length;
    const aib = reperibilitaData.aib.length;
    const ana = reperibilitaData.ana.length;
    return { pcO, pcP, coc, aib, ana };
  }, []);

  const search = q.trim().toLowerCase();

  const pcRows = useMemo(() => {
    const base = pcKind === "olympics" ? reperibilitaData.pc.olympics : reperibilitaData.pc.paralympics;
    if (!search) return base;

    return base
      .map((day) => ({
        ...day,
        people: day.people.filter((p) => (p.name || "").toLowerCase().includes(search) || (p.phone || "").toLowerCase().includes(search)),
      }))
      .filter((day) => day.date.includes(search) || (day.shift || "").toLowerCase().includes(search) || day.people.length > 0);
  }, [pcKind, search]);

  const aibRows = useMemo(() => {
    const base = reperibilitaData.aib;
    if (!search) return base;
    return base.filter((x) => (x.zone || "").toLowerCase().includes(search) || (x.phone || "").toLowerCase().includes(search));
  }, [search]);

  const cocRows = useMemo(() => {
    const base = reperibilitaData.coc;
    if (!search) return base;
    return base.filter((r) =>
      [r.comune, r.coc, r.ordinanza, r.recapiti, r.note].some((v) => (v || "").toLowerCase().includes(search))
    );
  }, [search]);

  const anaRows = useMemo(() => {
    const base = reperibilitaData.ana;
    if (!search) return base;
    return base.filter((r) => [r.role, r.name, r.phone].some((v) => (v || "").toLowerCase().includes(search)));
  }, [search]);

  const mezziRows = useMemo(() => {
    const base = reperibilitaData.mezzi;
    if (!search) return base;
    return base.filter((r) => [r.place, r.text].some((v) => (v || "").toLowerCase().includes(search)));
  }, [search]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="rounded-3xl border border-neutral-800 bg-gradient-to-br from-violet-500/15 via-cyan-500/10 to-emerald-500/10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="text-neutral-300/80 text-sm">Calendari & contatti operativi</div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Reperibilità</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone="violet"><CalendarDays className="w-3.5 h-3.5" /> PC Oly: {stats.pcO}</Pill>
              <Pill tone="cyan"><CalendarDays className="w-3.5 h-3.5" /> PC Para: {stats.pcP}</Pill>
              <Pill tone="amber"><MapPin className="w-3.5 h-3.5" /> COC: {stats.coc}</Pill>
              <Pill tone="green"><Shield className="w-3.5 h-3.5" /> AIB: {stats.aib}</Pill>
              <Pill tone="neutral"><Shield className="w-3.5 h-3.5" /> ANA: {stats.ana}</Pill>
            </div>
          </div>

          <div className="w-full sm:w-[420px]">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca nome, numero, comune, data…"
                className="w-full rounded-2xl bg-neutral-950/50 border border-neutral-800 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-neutral-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: "pc", label: "PC", tone: "violet" },
          { k: "aib", label: "AIB", tone: "green" },
          { k: "coc", label: "COC & Ordinanze", tone: "amber" },
          { k: "ana", label: "A.N.A.", tone: "neutral" },
          { k: "mezzi", label: "Mezzi", tone: "cyan" },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={cx(
              "rounded-2xl border px-3 py-2 text-sm transition",
              tab === t.k
                ? "border-neutral-600 bg-neutral-950/60"
                : "border-neutral-800 bg-neutral-950/30 hover:bg-neutral-950/50"
            )}
          >
            <Pill tone={t.tone}>{t.label}</Pill>
          </button>
        ))}
      </div>

      {/* PC */}
      {tab === "pc" && (
        <Card title="Reperibili PC">
          <div className="space-y-4">
            <SectionHeader
              icon={CalendarDays}
              title="Turni giornalieri"
              subtitle={pcKind === "olympics" ? "Olimpiadi" : "Paralimpiadi"}
              right={
                <div className="flex gap-2">
                  <button
                    onClick={() => setPcKind("olympics")}
                    className={cx(
                      "rounded-2xl border px-3 py-2 text-sm",
                      pcKind === "olympics" ? "border-violet-700/60 bg-violet-500/10" : "border-neutral-800 bg-neutral-950/30"
                    )}
                  >
                    Olimpiadi
                  </button>
                  <button
                    onClick={() => setPcKind("paralympics")}
                    className={cx(
                      "rounded-2xl border px-3 py-2 text-sm",
                      pcKind === "paralympics" ? "border-cyan-700/60 bg-cyan-500/10" : "border-neutral-800 bg-neutral-950/30"
                    )}
                  >
                    Paralimpiadi
                  </button>
                </div>
              }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {pcRows.map((day) => (
                <div key={`${day.date}-${day.shift}`} className="rounded-2xl border border-neutral-800 bg-neutral-950/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{fmtDate(day.date)}</div>
                      <div className="mt-1">
                        <Pill tone={pcKind === "olympics" ? "violet" : "cyan"}>{day.shift || "-"}</Pill>
                      </div>
                    </div>
                    <div className="text-xs text-neutral-400">{day.people.length} reperibili</div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {day.people.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name || "-"}</div>
                          <div className="text-neutral-400 text-xs truncate">{p.phone || "-"}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={p.phone ? `tel:${p.phone}` : undefined}
                            className={cx(
                              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs border",
                              p.phone ? "border-emerald-700/60 bg-emerald-500/10 hover:bg-emerald-500/15" : "border-neutral-800 bg-neutral-950/30 opacity-60 pointer-events-none"
                            )}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Chiama
                          </a>
                          <button
                            onClick={() => copyToClipboard(p.phone)}
                            className={cx(
                              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs border",
                              p.phone ? "border-neutral-700 bg-neutral-950/50 hover:bg-neutral-950/70" : "border-neutral-800 bg-neutral-950/30 opacity-60"
                            )}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copia
                          </button>
                        </div>
                      </div>
                    ))}
                    {day.people.length === 0 && <div className="text-sm text-neutral-400">Nessun match col filtro.</div>}
                  </div>
                </div>
              ))}
              {pcRows.length === 0 && <div className="text-neutral-400">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}

      {/* AIB */}
      {tab === "aib" && (
        <Card title="Reperibili AIB SF">
          <div className="space-y-4">
            <SectionHeader icon={Shield} title="Contatti per zona" subtitle="AIB SF" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aibRows.map((z) => (
                <div key={z.zone} className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{z.zone}</div>
                      <div className="text-sm text-neutral-300 mt-1">{z.phone}</div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`tel:${String(z.phone).replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs border border-emerald-700/60 bg-emerald-500/10 hover:bg-emerald-500/15"
                      >
                        <Phone className="w-3.5 h-3.5" /> Chiama
                      </a>
                      <button
                        onClick={() => copyToClipboard(z.phone)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs border border-neutral-700 bg-neutral-950/50 hover:bg-neutral-950/70"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copia
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {aibRows.length === 0 && <div className="text-neutral-400">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}

      {/* COC */}
      {tab === "coc" && (
        <Card title="COC e Ordinanze">
          <div className="space-y-4">
            <SectionHeader icon={MapPin} title="Stato COC e recapiti" subtitle="Comuni" />
            <div className="space-y-3">
              {cocRows.map((r) => (
                <Accordion
                  key={r.comune}
                  title={
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{r.comune}</span>
                      <Pill tone={(r.coc || "").toLowerCase().includes("aperto") ? "green" : "red"}>
                        {(r.coc || "-").toUpperCase()}
                      </Pill>
                      <Pill tone={(r.ordinanza || "").toLowerCase().includes("si") ? "amber" : "neutral"}>
                        Ordinanza: {r.ordinanza || "-"}
                      </Pill>
                    </div>
                  }
                >
                  <div className="mt-2 space-y-3 text-sm">
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                      <div className="text-neutral-400 text-xs mb-1">Recapiti</div>
                      <pre className="whitespace-pre-wrap text-neutral-200">{r.recapiti || "—"}</pre>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                      <div className="text-neutral-400 text-xs mb-1">Note</div>
                      <div className="text-neutral-200 whitespace-pre-wrap">{r.note || "—"}</div>
                    </div>
                  </div>
                </Accordion>
              ))}
              {cocRows.length === 0 && <div className="text-neutral-400">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}

      {/* ANA */}
      {tab === "ana" && (
        <Card title="A.N.A. — Referenti">
          <div className="space-y-4">
            <SectionHeader icon={Shield} title="Referenti sul campo" subtitle="Associazione Nazionale Alpini" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {anaRows.map((r) => (
                <div key={r.role} className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900/40 to-violet-500/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-neutral-400 text-xs">{r.role}</div>
                      <div className="font-semibold mt-1">{r.name}</div>
                      <div className="text-sm text-neutral-300 mt-1">{r.phone}</div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={r.phone ? `tel:${r.phone}` : undefined}
                        className={cx(
                          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs border",
                          r.phone ? "border-emerald-700/60 bg-emerald-500/10 hover:bg-emerald-500/15" : "border-neutral-800 bg-neutral-950/30 opacity-60 pointer-events-none"
                        )}
                      >
                        <Phone className="w-3.5 h-3.5" /> Chiama
                      </a>
                      <button
                        onClick={() => copyToClipboard(r.phone)}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs border border-neutral-700 bg-neutral-950/50 hover:bg-neutral-950/70"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copia
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {anaRows.length === 0 && <div className="text-neutral-400">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}

      {/* MEZZI */}
      {tab === "mezzi" && (
        <Card title="Mezzi & logistica">
          <div className="space-y-4">
            <SectionHeader icon={MapPin} title="Dotazioni per località" subtitle="Materiali / mezzi" />
            <div className="space-y-3">
              {mezziRows.map((m) => (
                <Accordion key={m.place} title={<span className="font-semibold">{m.place}</span>}>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-neutral-200 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                    {m.text || "—"}
                  </pre>
                </Accordion>
              ))}
              {mezziRows.length === 0 && <div className="text-neutral-400">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
