// src/pages/Mappa.jsx
import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import MapDay from "../components/MapDay.jsx";

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

const LAYERS = [
    { id: "alloggi", url: encodeURI("/layers/AlloggiVolontari.geojson") },
    { id: "aree", url: encodeURI("/layers/AreeStrategiche.geojson") },
    { id: "coc", url: encodeURI("/layers/COC.geojson") },
    { id: "mezzi", url: encodeURI("/layers/Mezzi.geojson") },
    { id: "municipio", url: encodeURI("/layers/Municipio.geojson") },
    { id: "parcheggi", url: encodeURI("/layers/ParcheggiMiCo.geojson") },
    { id: "siti_gara", url: encodeURI("/layers/SitiDiGara.geojson") },
    { id: "venue", url: encodeURI("/layers/VenueOlimpiche.geojson") },
];

async function fetchGeoJSON(url) {
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} su ${url}\n${text.slice(0, 120)}`);
    if (text.trim().startsWith("<")) throw new Error(`Non è JSON: ${url} sta tornando HTML.`);
    return JSON.parse(text);
}

function toFeatureArray(geojson) {
    if (!geojson) return [];
    if (geojson.type === "FeatureCollection") return geojson.features || [];
    if (geojson.type === "Feature") return [geojson];
    if (Array.isArray(geojson)) return geojson;
    return [];
}

// ✅ corrispondenza colore -> nome (usata per blip + legenda)
const LAYER_STYLE = {
    alloggi: { color: "#16a34a", label: "Alloggi volontari" },
    aree: { color: "#ea580c", label: "Aree strategiche" },
    coc: { color: "#dc2626", label: "COC" },
    mezzi: { color: "#0284c7", label: "Mezzi" },
    municipio: { color: "#64748b", label: "Municipio" },
    parcheggi: { color: "#ca8a04", label: "Parcheggi MiCo" },
    siti_gara: { color: "#7c3aed", label: "Siti di gara" },
    venue: { color: "#2563eb", label: "Venue olimpiche" },
};

function LegendOutside({ items, onAdd }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">Legenda</div>

                <button
                    type="button"
                    onClick={onAdd}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                    <Plus className="h-4 w-4" />
                    Aggiungi blip
                </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {items.map((it) => (
                    <div key={it.id} className="flex items-center gap-2">
                        <span
                            className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-300"
                            style={{ background: it.color }}
                        />
                        <span className="text-sm text-slate-800">{it.label}</span>
                    </div>
                ))}
            </div>

            <div className="mt-3 text-xs text-slate-500">
                Tip: clicca sulla mappa per pre-compilare le coordinate.
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[999]">
            <button
                type="button"
                aria-label="Chiudi"
                onClick={onClose}
                className="absolute inset-0 w-full h-full bg-black/20"
            />
            <div className="relative mx-auto mt-16 w-[92vw] max-w-xl">
                <div className="rounded-3xl overflow-hidden bg-white shadow-[0_18px_50px_rgba(0,0,0,0.10)] border border-slate-200">
                    <div className="h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500" />
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-extrabold text-slate-900">{title}</div>
                                <div className="text-xs text-slate-500 mt-1">Salvato nel database</div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-10 w-10 rounded-2xl grid place-items-center bg-white border border-slate-200 hover:bg-slate-50"
                            >
                                <X className="h-4 w-4 text-slate-900" />
                            </button>
                        </div>

                        <div className="mt-4">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Mappa() {
    const qc = useQueryClient();
    const [day] = useState(todayISO());

    // backend mapFeatures (se ti serve)
    const qDash = useQuery({
        queryKey: ["dashboardDay", day],
        queryFn: () => api.dashboardDay(day),
    });

    // layer statici
    const qLayers = useQuery({
        queryKey: ["staticLayers"],
        queryFn: async () => {
            const all = await Promise.all(
                LAYERS.map(async (l) => {
                    const gj = await fetchGeoJSON(l.url);
                    return toFeatureArray(gj).map((f) => ({
                        ...f,
                        properties: { ...(f.properties || {}), __layer: l.id },
                    }));
                })
            );
            return all.flat();
        },
        staleTime: 1000 * 60 * 60,
    });

    // ✅ blip dal DB
    const qBlips = useQuery({
        queryKey: ["mapBlips"],
        queryFn: () => api.listMapBlips(),
    });

    const createBlipM = useMutation({
        mutationFn: (payload) => api.createMapBlip(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["mapBlips"] }),
    });

    const deleteBlipM = useMutation({
        mutationFn: (id) => api.deleteMapBlip(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["mapBlips"] }),
    });

    const dbBlipFeatures = useMemo(() => {
        return (qBlips.data || []).map((b) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [b.lng, b.lat] },
            properties: {
                __layer: b.layer_id,
                title: b.title,
                note: b.note || "",
                __db_id: b.id,
                __db_kind: "map_blip",
            },
        }));
    }, [qBlips.data]);

    const mergedFeatures = useMemo(() => {
        const apiRaw = qDash.data?.mapFeatures;
        const apiFeatures = Array.isArray(apiRaw)
            ? apiRaw
            : apiRaw?.type === "FeatureCollection"
                ? apiRaw.features || []
                : [];

        const apiTagged = apiFeatures.map((f) => ({
            ...f,
            properties: { ...(f.properties || {}), __layer: f.properties?.__layer || "api" },
        }));

        return [...apiTagged, ...(qLayers.data || []), ...dbBlipFeatures];
    }, [qDash.data, qLayers.data, dbBlipFeatures]);

    const legendItems = useMemo(() => {
        const order = LAYERS.map((l) => l.id);
        return order
            .filter((id) => LAYER_STYLE[id])
            .map((id) => ({ id, color: LAYER_STYLE[id].color, label: LAYER_STYLE[id].label }));
    }, []);

    // ---- modal add blip
    const [openModal, setOpenModal] = useState(false);
    const [layerId, setLayerId] = useState(LAYERS[0]?.id || "coc");
    const [title, setTitle] = useState("");
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [note, setNote] = useState("");

    function openAdd() {
        setOpenModal(true);
    }

    function closeAdd() {
        setOpenModal(false);
        createBlipM.reset?.();
    }

    // ✅ chiamata quando clicchi sulla mappa (da MapDay)
    function onPickCoord(pickedLat, pickedLng) {
        setLat(Number(pickedLat).toFixed(5));
        setLng(Number(pickedLng).toFixed(5));
        setOpenModal(true);
    }

    function submitBlip(e) {
        e.preventDefault();

        const t = title.trim();
        const la = Number(String(lat).replace(",", "."));
        const ln = Number(String(lng).replace(",", "."));

        if (!t || !Number.isFinite(la) || !Number.isFinite(ln)) return;

        createBlipM.mutate(
            { layer_id: layerId, title: t, lat: la, lng: ln, note: note.trim() || null },
            {
                onSuccess: () => {
                    setTitle("");
                    setLat("");
                    setLng("");
                    setNote("");
                    setOpenModal(false);
                },
            }
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Mappa</h1>
                </div>
            </div>

            {(qDash.isLoading || qLayers.isLoading || qBlips.isLoading) && (
                <div className="text-sm text-slate-500">Caricamento…</div>
            )}

            {(qDash.error || qLayers.error || qBlips.error) && (
                <div className="text-sm text-red-600 whitespace-pre-wrap">
                    Errore: {String(qDash.error || qLayers.error || qBlips.error)}
                </div>
            )}

            {qLayers.data && (
                <>
                    <LegendOutside items={legendItems} onAdd={openAdd} />

                    <MapDay
                        features={mergedFeatures}
                        layerStyle={LAYER_STYLE}
                        onPickCoord={onPickCoord}   // ✅ IMPORTANTISSIMO
                    />

                    {(qBlips.data || []).length > 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="text-sm font-semibold text-slate-900 mb-2">Blip aggiunti (DB)</div>
                            <div className="space-y-2">
                                {(qBlips.data || []).map((b) => (
                                    <div key={b.id} className="flex items-center justify-between gap-3">
                                        <div className="text-sm text-slate-800">
                                            <span className="font-semibold">{b.title}</span>{" "}
                                            <span className="text-slate-500">
                                                ({Number(b.lat).toFixed(5)}, {Number(b.lng).toFixed(5)}) —{" "}
                                                {LAYER_STYLE[b.layer_id]?.label || b.layer_id}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => deleteBlipM.mutate(b.id)}
                                            className="h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 grid place-items-center"
                                            title="Rimuovi"
                                        >
                                            <Trash2 className="h-4 w-4 text-rose-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </>
            )}

            <Modal open={openModal} title="Aggiungi blip" onClose={closeAdd}>
                <form onSubmit={submitBlip} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                        <label className="text-xs font-semibold text-slate-600">Categoria (dalla legenda)</label>
                        <select
                            value={layerId}
                            onChange={(e) => setLayerId(e.target.value)}
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                            {legendItems.map((it) => (
                                <option key={it.id} value={it.id}>
                                    {it.label}
                                </option>
                            ))}
                        </select>

                        <label className="text-xs font-semibold text-slate-600">Titolo</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Es. Punto di raccolta"
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                            required
                            autoFocus
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Latitudine</label>
                                <input
                                    value={lat}
                                    onChange={(e) => setLat(e.target.value)}
                                    placeholder="46.54050"
                                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600">Longitudine</label>
                                <input
                                    value={lng}
                                    onChange={(e) => setLng(e.target.value)}
                                    placeholder="12.13570"
                                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                                    required
                                />
                            </div>
                        </div>

                        <label className="text-xs font-semibold text-slate-600">Note (opzionale)</label>
                        <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="..."
                            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                        />
                    </div>

                    {createBlipM.error ? (
                        <div className="text-sm text-rose-600">
                            Errore: {String(createBlipM.error.message || createBlipM.error)}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={closeAdd}
                            className="rounded-2xl px-3 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50"
                        >
                            Annulla
                        </button>

                        <button
                            type="submit"
                            disabled={createBlipM.isPending}
                            className={cx(
                                "rounded-2xl px-3 py-2 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50",
                                createBlipM.isPending && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            Salva
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
