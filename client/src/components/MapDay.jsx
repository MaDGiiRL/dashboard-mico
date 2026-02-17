// src/components/MapDay.jsx
import { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from "react-leaflet";
import L from "leaflet";

function getLayerId(feature) {
    return feature?.properties?.__layer || "api";
}

function getTitle(feature) {
    const p = feature?.properties || {};
    return p.title || p.name || p.nome || "Punto";
}

function fmtCoord(n) {
    const x = Number(n);
    return Number.isFinite(x) ? x.toFixed(5) : "";
}

// ✅ click normale sulla mappa -> passa coordinate al parent
function ClickCatcher({ onPickCoord }) {
    useMapEvents({
        click(e) {
            onPickCoord?.(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function MapDay({ features, layerStyle, onPickCoord }) {
    // Cortina d'Ampezzo
    const center = [46.5405, 12.1357];
    const zoom = 13;

    const featureCollection = useMemo(
        () => ({ type: "FeatureCollection", features: features || [] }),
        [features]
    );

    // ✅ forza refresh del layer GeoJSON quando cambiano i features
    const geoKey = useMemo(() => {
        const fs = features || [];
        const last = fs[fs.length - 1];
        const lastId = last?.properties?.__db_id || last?.id || last?.properties?.id || "";
        return `${fs.length}-${lastId}`;
    }, [features]);

    const styleFor = (feature) => {
        const lid = getLayerId(feature);
        const s = layerStyle?.[lid] || { color: "#2563eb", label: lid };
        return { color: s.color, weight: 2, fillOpacity: 0.2 };
    };

    return (
        <div className="h-[60vh] rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
                <ClickCatcher onPickCoord={onPickCoord} />

                <TileLayer
                    attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <GeoJSON
                    key={geoKey}
                    data={featureCollection}
                    // ✅ punti come circle marker (blip)
                    pointToLayer={(feature, latlng) => {
                        const s = styleFor(feature);
                        return L.circleMarker(latlng, {
                            radius: 7,
                            weight: 2,
                            color: s.color,
                            fillColor: s.color,
                            fillOpacity: 0.9,
                        });
                    }}
                    // ✅ stile per linee/poligoni
                    style={(feature) => styleFor(feature)}
                    // ✅ tooltip + popup su click
                    onEachFeature={(feature, layer) => {
                        const p = feature?.properties || {};
                        const lid = getLayerId(feature);
                        const label = layerStyle?.[lid]?.label || lid;

                        // coordinate (GeoJSON point: [lng, lat])
                        const coords = feature?.geometry?.type === "Point" ? feature.geometry.coordinates : null;
                        const lng = coords?.[0];
                        const lat = coords?.[1];

                        // Tooltip (hover)
                        layer.bindTooltip(`${getTitle(feature)} — ${label}`, {
                            sticky: true,
                            direction: "top",
                        });

                        // Popup (click)
                        const html = `
              <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
                <div style="font-weight:800; font-size:14px; margin-bottom:6px;">
                  ${String(getTitle(feature))}
                </div>
                <div style="font-size:12px; opacity:.75; margin-bottom:8px;">
                  Categoria: ${String(label)}
                </div>
                ${lat != null && lng != null
                                ? `<div style="font-size:12px; margin-bottom:6px;">
                        <b>Coord:</b> ${fmtCoord(lat)}, ${fmtCoord(lng)}
                       </div>`
                                : ""
                            }
                ${p.note ? `<div style="font-size:12px;"><b>Note:</b> ${String(p.note)}</div>` : ""}
              </div>
            `;
                        layer.bindPopup(html);
                    }}
                />
            </MapContainer>
        </div>
    );
}
