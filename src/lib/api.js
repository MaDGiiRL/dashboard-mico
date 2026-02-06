// src/lib/api.js
const API = import.meta.env.VITE_API_URL;

let token = localStorage.getItem("token");

export function setToken(t) {
    token = t;
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
}

async function request(path, opts = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
}

export const api = {
    login: (email, password) =>
        request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    me: () => request("/me"),

    list: (table) => request(`/api/${table}`),
    create: (table, payload) => request(`/api/${table}`, { method: "POST", body: JSON.stringify(payload) }),
    update: (table, id, patch) => request(`/api/${table}/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    remove: (table, id) => request(`/api/${table}/${id}`, { method: "DELETE" }),

    dashboardDay: (day) => request(`/days/${day}/dashboard`),

    // note overlay (OPS + B1 + COC + ANA)
    upsertAppointmentNote: (payload) =>
        request("/appointment-notes", { method: "POST", body: JSON.stringify(payload) }),
    appointmentNotesDay: (day) => request(`/appointment-notes/${day}`),

    // ✅ COC: apri/chiudi/upsert (no duplicati)
    upsertCocStatus: (payload) =>
        request("/coc-status/upsert", { method: "POST", body: JSON.stringify(payload) }),

    // ✅ COC: aggiungi/ensure comune (crea coc_communes se manca)
    ensureCocCommune: (payload) =>
        request("/coc-communes/ensure", { method: "POST", body: JSON.stringify(payload) }),

    // COC ordinanza
    upsertCocOrdinance: (payload) =>
        request("/coc-ordinances/upsert", { method: "POST", body: JSON.stringify(payload) }),

    // ✅ ANA: aggiungi mezzi/materiali (overlay DB)
    addAnaItem: (payload) => request("/ana-items", { method: "POST", body: JSON.stringify(payload) }),
};
