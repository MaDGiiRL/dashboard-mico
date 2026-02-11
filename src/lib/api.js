// src/lib/api.js
const API = import.meta.env.VITE_API_URL;

if (!API) {
    // eslint-disable-next-line no-console
    console.error("❌ VITE_API_URL mancante. Metti in .env: VITE_API_URL=http://localhost:8080 e riavvia Vite.");
}

let token = localStorage.getItem("token") || null;

export function setToken(t) {
    token = t || null;
    try {
        if (token) localStorage.setItem("token", token);
        else localStorage.removeItem("token");
    } catch { }
}

export function getToken() {
    return token || localStorage.getItem("token") || null;
}

async function request(path, opts = {}) {
    if (!API) throw new Error("VITE_API_URL mancante (controlla .env e riavvia Vite).");

    const url = `${API}${path}`;
    const headers = { ...(opts.headers || {}) };

    const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
    if (!isForm) headers["Content-Type"] = "application/json";

    const liveToken = getToken();
    if (liveToken) headers.Authorization = `Bearer ${liveToken}`;

    let res;
    try {
        res = await fetch(url, { ...opts, headers });
    } catch (e) {
        // QUI entri quando c’è ERR_CONNECTION_REFUSED / server down / DNS / ecc.
        throw new Error(`❌ Backend non raggiungibile: ${API} (server spento o porta errata)`);
    }

    const ct = res.headers.get("content-type") || "";
    let data = null;
    let text = "";

    if (ct.includes("application/json")) data = await res.json().catch(() => null);
    else text = await res.text().catch(() => "");

    if (!res.ok) {
        const msg =
            (data && (data.error || data.message)) ||
            (text ? text.slice(0, 500) : "") ||
            `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        err.url = url;
        throw err;
    }

    return data ?? { ok: true };
}


export const api = {
    login: (email, password) =>
        request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

    me: () => request("/me"),

    // tieni qui tutte le tue altre route se vuoi:
    dashboardDay: (day) => request(`/days/${day}/dashboard`),
};
