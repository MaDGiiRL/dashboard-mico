import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";

export default function MapDay({ features }) {
    const center = [46.139, 12.217];

    return (
        <div className="h-[60vh] rounded-2xl overflow-hidden border border-neutral-800">
            <MapContainer center={center} zoom={11} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {(features || []).map((f) => (
                    <GeoJSON key={f.id} data={f.geojson} />
                ))}
            </MapContainer>
        </div>
    );
}
