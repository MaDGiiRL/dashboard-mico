export async function fetchGeoJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return res.json();
}

export function toFeatureCollection(data) {
    // Supporta FeatureCollection oppure array di Feature
    if (!data) return { type: "FeatureCollection", features: [] };
    if (data.type === "FeatureCollection") return data;
    if (Array.isArray(data)) return { type: "FeatureCollection", features: data };
    if (data.type === "Feature") return { type: "FeatureCollection", features: [data] };
    return { type: "FeatureCollection", features: [] };
}
