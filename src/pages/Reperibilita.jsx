// src/pages/Reperibilita.jsx
import { useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import LogPanel from "../components/LogPanel.jsx";
import { reperibilitaData } from "../data/reperibilitaData.js";
import { Phone, Copy, Search, CalendarDays, Shield, MapPin, ChevronDown } from "lucide-react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function fmtDate(iso) {
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

/* ---- style tokens (allineati Dashboard) ---- */
const UI = {
  card: cx("rounded-3xl overflow-hidden", "bg-white/55 backdrop-blur-md", "shadow-[0_18px_50px_rgba(0,0,0,0.10)]"),
  accent: "h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500",
  softRing: "ring-1 ring-white/45",
  dim: "text-neutral-600",
  dim2: "text-neutral-500",
  input:
    "w-full rounded-2xl px-4 py-3 text-sm outline-none " +
    "bg-white/75 text-neutral-900 placeholder:text-neutral-400 " +
    "shadow-sm ring-1 ring-white/45 " +
    "focus:ring-4 focus:ring-indigo-500/15",
};

function Tag({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
    indigo: "bg-indigo-500/10 text-indigo-900 ring-1 ring-indigo-500/15",
    emerald: "bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/15",
    rose: "bg-rose-500/10 text-rose-900 ring-1 ring-rose-500/15",
    sky: "bg-sky-500/10 text-sky-900 ring-1 ring-sky-500/15",
    fuchsia: "bg-fuchsia-500/10 text-fuchsia-900 ring-1 ring-fuchsia-500/15",
    amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
    violet: "bg-violet-500/14 text-violet-950 ring-1 ring-violet-500/18",
    cyan: "bg-cyan-500/14 text-cyan-950 ring-1 ring-cyan-500/18",
  };
  return (
    <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide inline-flex items-center gap-1", tones[tone] || tones.neutral)}>
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
    rose: "bg-rose-500/12 hover:bg-rose-500/16 text-rose-900 ring-rose-500/15",
    indigo: "bg-indigo-500/12 hover:bg-indigo-500/16 text-indigo-900 ring-indigo-500/15",
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
  // alias a Tag ma con classi più “pill”
  const tones = {
    neutral: "bg-white/55 text-neutral-700 ring-1 ring-white/45",
    green: "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/15",
    red: "bg-rose-500/12 text-rose-900 ring-1 ring-rose-500/15",
    cyan: "bg-cyan-500/14 text-cyan-950 ring-1 ring-cyan-500/18",
    violet: "bg-violet-500/14 text-violet-950 ring-1 ring-violet-500/18",
    amber: "bg-amber-500/14 text-amber-950 ring-1 ring-amber-500/18",
  };
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide", tones[tone] || tones.neutral)}>
      {children}
    </span>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, right }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-2xl ring-1 ring-white/45 bg-white/55 grid place-items-center shadow-sm">
          <Icon className="w-5 h-5 text-neutral-900" />
        </div>
        <div className="min-w-0">
          <div className="text-neutral-500 text-xs font-extrabold tracking-wide">{subtitle}</div>
          <h2 className="text-xl font-extrabold text-neutral-900 truncate">{title}</h2>
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cx(UI.card, UI.softRing, "bg-white/45")}>
      <div className={UI.accent} />
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-white/40 hover:bg-white/55 transition"
      >
        <div className="font-extrabold text-left text-neutral-900">{title}</div>
        <ChevronDown className={cx("w-4 h-4 text-neutral-600 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="px-5 pb-5">{children}</div> : null}
    </div>
  );
}

function TabBtn({ active, tone = "neutral", children, onClick }) {
  const activeCls =
    tone === "violet"
      ? "bg-violet-500/14 ring-1 ring-violet-500/18"
      : tone === "emerald"
        ? "bg-emerald-500/12 ring-1 ring-emerald-500/15"
        : tone === "amber"
          ? "bg-amber-500/14 ring-1 ring-amber-500/18"
          : tone === "cyan"
            ? "bg-cyan-500/14 ring-1 ring-cyan-500/18"
            : "bg-white/55 ring-1 ring-white/45";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-3 py-2 text-sm transition",
        "shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/15",
        active ? activeCls : "bg-white/45 hover:bg-white/60 ring-1 ring-white/45"
      )}
    >
      {children}
    </button>
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
        people: day.people.filter(
          (p) => (p.name || "").toLowerCase().includes(search) || (p.phone || "").toLowerCase().includes(search)
        ),
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
    return base.filter((r) => [r.comune, r.coc, r.ordinanza, r.recapiti, r.note].some((v) => (v || "").toLowerCase().includes(search)));
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
      <div className={cx(UI.card, UI.softRing)}>
        <div className="p-6 bg-white/45 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs font-extrabold tracking-wide text-neutral-600">CALENDARI & CONTATTI</div>
                <Tag tone="fuchsia">OPERATIVO</Tag>
              </div>

              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-neutral-900">Reperibilità</h1>

              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="violet">
                  <CalendarDays className="w-3.5 h-3.5" /> PC Oly: {stats.pcO}
                </Pill>
                <Pill tone="cyan">
                  <CalendarDays className="w-3.5 h-3.5" /> PC Para: {stats.pcP}
                </Pill>
                <Pill tone="amber">
                  <MapPin className="w-3.5 h-3.5" /> COC: {stats.coc}
                </Pill>
                <Pill tone="green">
                  <Shield className="w-3.5 h-3.5" /> AIB: {stats.aib}
                </Pill>
                <Pill tone="neutral">
                  <Shield className="w-3.5 h-3.5" /> ANA: {stats.ana}
                </Pill>
              </div>
            </div>

            <div className="w-full sm:w-[420px]">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca nome, numero, comune, data…" className="pl-10 pr-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: "pc", label: "PC", tone: "violet" },
          { k: "aib", label: "AIB", tone: "emerald" },
          { k: "coc", label: "COC & Ordinanze", tone: "amber" },
          { k: "ana", label: "A.N.A.", tone: "neutral" },
          { k: "mezzi", label: "Mezzi", tone: "cyan" },
        ].map((t) => (
          <TabBtn key={t.k} active={tab === t.k} tone={t.tone} onClick={() => setTab(t.k)}>
            <Pill tone={t.tone === "emerald" ? "green" : t.tone}>{t.label}</Pill>
          </TabBtn>
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
              }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {pcRows.map((day) => (
                <div key={`${day.date}-${day.shift}`} className={cx(UI.card, UI.softRing)}>
                  <div className={UI.accent} />
                  <div className="p-5 bg-white/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-neutral-900">{fmtDate(day.date)}</div>
                        <div className="mt-2">
                          <Pill tone={pcKind === "olympics" ? "violet" : "cyan"}>{day.shift || "-"}</Pill>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-600 font-extrabold">{day.people.length} reperibili</div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {day.people.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-3xl bg-white/55 ring-1 ring-white/45 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="font-extrabold truncate text-neutral-900">{p.name || "-"}</div>
                            <div className="text-neutral-600 text-xs truncate mt-0.5">{p.phone || "-"}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Btn href={p.phone ? `tel:${p.phone}` : undefined} disabled={!p.phone} tone="emerald" title="Chiama">
                              <Phone className="w-3.5 h-3.5" />
                              Chiama
                            </Btn>
                            <Btn onClick={() => copyToClipboard(p.phone)} disabled={!p.phone} tone="neutral" title="Copia">
                              <Copy className="w-3.5 h-3.5" />
                              Copia
                            </Btn>
                          </div>
                        </div>
                      ))}
                      {day.people.length === 0 && <div className="text-sm text-neutral-600">Nessun match col filtro.</div>}
                    </div>
                  </div>
                </div>
              ))}
              {pcRows.length === 0 && <div className="text-neutral-600">Nessun dato.</div>}
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
                <div key={z.zone} className={cx(UI.card, UI.softRing)}>
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />
                  <div className="p-5 bg-white/40">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-neutral-900">{z.zone}</div>
                        <div className="text-sm text-neutral-700 mt-1">{z.phone}</div>
                      </div>
                      <div className="flex gap-2">
                        <Btn href={`tel:${String(z.phone).replace(/\s+/g, "")}`} tone="emerald" title="Chiama">
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
                      <span className="text-neutral-900">{r.comune}</span>
                      <Pill tone={(r.coc || "").toLowerCase().includes("aperto") ? "green" : "red"}>{(r.coc || "-").toUpperCase()}</Pill>
                      <Pill tone={(r.ordinanza || "").toLowerCase().includes("si") ? "amber" : "neutral"}>
                        Ordinanza: {r.ordinanza || "-"}
                      </Pill>
                    </div>
                  }
                >
                  <div className="mt-2 space-y-3 text-sm">
                    <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                      <div className="text-neutral-500 text-xs font-extrabold tracking-wide mb-2">RECAPITI</div>
                      <pre className="whitespace-pre-wrap text-neutral-900">{r.recapiti || "—"}</pre>
                    </div>
                    <div className="rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                      <div className="text-neutral-500 text-xs font-extrabold tracking-wide mb-2">NOTE</div>
                      <div className="text-neutral-900 whitespace-pre-wrap">{r.note || "—"}</div>
                    </div>
                  </div>
                </Accordion>
              ))}
              {cocRows.length === 0 && <div className="text-neutral-600">Nessun dato.</div>}
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
                <div key={`${r.role}-${r.name}`} className={cx(UI.card, UI.softRing)}>
                  <div className="h-1.5 bg-gradient-to-r from-violet-500 via-indigo-500 to-fuchsia-500" />
                  <div className="p-5 bg-white/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-neutral-500 text-xs font-extrabold tracking-wide">{r.role}</div>
                        <div className="font-extrabold mt-1 text-neutral-900">{r.name}</div>
                        <div className="text-sm text-neutral-700 mt-1">{r.phone}</div>
                      </div>
                      <div className="flex gap-2">
                        <Btn href={r.phone ? `tel:${r.phone}` : undefined} disabled={!r.phone} tone="emerald" title="Chiama">
                          <Phone className="w-3.5 h-3.5" /> Chiama
                        </Btn>
                        <Btn onClick={() => copyToClipboard(r.phone)} disabled={!r.phone} tone="neutral" title="Copia">
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

      {/* MEZZI */}
      {tab === "mezzi" && (
        <Card title="Mezzi & logistica">
          <div className="space-y-4">
            <SectionHeader icon={MapPin} title="Dotazioni per località" subtitle="Materiali / mezzi" />
            <div className="space-y-3">
              {mezziRows.map((m) => (
                <Accordion key={m.place} title={<span className="font-extrabold">{m.place}</span>}>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-neutral-900 rounded-3xl bg-white/55 ring-1 ring-white/45 p-4">
                    {m.text || "—"}
                  </pre>
                </Accordion>
              ))}
              {mezziRows.length === 0 && <div className="text-neutral-600">Nessun dato.</div>}
            </div>
          </div>
        </Card>
      )}

      {/* LogPanel (se ti serve) */}
      {/* <LogPanel /> */}
    </div>
  );
}
