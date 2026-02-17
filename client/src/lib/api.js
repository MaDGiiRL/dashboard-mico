// src/lib/api.js
const API = import.meta.env.VITE_API_URL;

fetch(`${API}/weather_bulletins`)

if (!API) {
    // eslint-disable-next-line no-console
    console.error(
        "❌ VITE_API_URL mancante. Metti in .env: VITE_API_URL=http://localhost:8080 e riavvia Vite."
    );
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

/**
 * Rimuove chiavi con null/undefined e (opzionale) stringhe vuote.
 * Utile per evitare che il backend Zod si incazzi con "day: null" ecc.
 */
function cleanPayload(obj, { dropEmptyString = false } = {}) {
    if (!obj || typeof obj !== "object") return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === null || v === undefined) continue;
        if (dropEmptyString && typeof v === "string" && v.trim() === "") continue;
        out[k] = v;
    }
    return out;
}

async function request(path, opts = {}) {
    if (!API) throw new Error("VITE_API_URL mancante (controlla .env e riavvia Vite).");

    const url = `${API}${path}`;
    const headers = { ...(opts.headers || {}) };

    const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
    if (!isForm && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

    const liveToken = getToken();
    if (liveToken) headers.Authorization = `Bearer ${liveToken}`;

    let res;
    try {
        res = await fetch(url, { ...opts, headers });
    } catch {
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
    // =========================
    // AUTH
    // =========================
    login: (email, password) =>
        request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

    me: () => request("/me"),

    logout: () => request("/auth/logout", { method: "POST" }), // ✅ UNA SOLA VOLTA

    // public access request
    requestAccess: (payload) =>
        request("/access-requests", { method: "POST", body: JSON.stringify(payload) }),

    // =========================
    // ADMIN
    // =========================
    adminUsers: () => request("/admin/users"),

    adminCreateUser: (payload) =>
        request("/admin/users", { method: "POST", body: JSON.stringify(payload) }),

    adminSetRole: (id, role) =>
        request(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),

    adminSetActive: (id, is_active) =>
        request(`/admin/users/${id}/active`, { method: "PATCH", body: JSON.stringify({ is_active }) }),

    adminAccessRequests: (status = "all") =>
        request(`/admin/access-requests?status=${encodeURIComponent(status)}`),

    adminApproveAccessRequest: (id, payload) =>
        request(`/admin/access-requests/${id}/approve`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    adminRejectAccessRequest: (id, payload) =>
        request(`/admin/access-requests/${id}/reject`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    adminRevokeAccessRequest: (id, payload) =>
        request(`/admin/access-requests/${id}/revoke`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    // =========================
    // LOGS
    // =========================
    activityLogs: ({ day, section, limit = 100 } = {}) => {
        const qs = new URLSearchParams();
        if (day) qs.set("day", day);
        if (section) qs.set("section", section);
        qs.set("limit", String(limit));
        return request(`/activity-logs?${qs.toString()}`);
    },

    // extra logs (admin)
    adminActivityLogs: (limit = 200) =>
        request(`/admin/activity-logs?limit=${encodeURIComponent(limit)}`),

    adminDbAudit: (limit = 200) =>
        request(`/admin/db-audit?limit=${encodeURIComponent(limit)}`),

    // audit (legacy se la usi ancora)
    adminAudit: ({ limit = 200, actor_id, section, action } = {}) => {
        const qs = new URLSearchParams();
        qs.set("limit", String(limit));
        if (actor_id) qs.set("actor_id", String(actor_id));
        if (section) qs.set("section", section);
        if (action) qs.set("action", action);
        return request(`/admin/audit?${qs.toString()}`);
    },

    // =========================
    // DASHBOARD
    // =========================
    dashboardDay: (day, lite = false) =>
        request(`/days/${day}/dashboard${lite ? "?lite=1" : ""}`),

    // =========================
    // NOTE ENTRIES
    // =========================
    createNoteEntry: (payload) =>
        request("/note-entries", { method: "POST", body: JSON.stringify(payload) }),

    updateNoteEntry: (id, patch) =>
        request(`/note-entries/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteNoteEntry: (id) => request(`/note-entries/${id}`, { method: "DELETE" }),

    // legacy
    upsertAppointmentNotes: (payload) =>
        request("/appointment-notes", { method: "POST", body: JSON.stringify(payload) }),

    // =========================
    // RACES
    // =========================
    createRace: (payload) =>
        request("/races", { method: "POST", body: JSON.stringify(payload) }),

    updateRace: (id, patch) =>
        request(`/races/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteRace: (id) => request(`/races/${id}`, { method: "DELETE" }),

    // =========================
    // APPOINTMENTS
    // =========================
    createAppointment: (payload) =>
        request("/appointments", { method: "POST", body: JSON.stringify(payload) }),

    updateAppointment: (id, patch) =>
        request(`/appointments/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteAppointment: (id) => request(`/appointments/${id}`, { method: "DELETE" }),

    // =========================
    // EVENTS
    // =========================
    createEvent: (payload) =>
        request("/events", { method: "POST", body: JSON.stringify(payload) }),

    updateEvent: (id, patch) =>
        request(`/events/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteEvent: (id) => request(`/events/${id}`, { method: "DELETE" }),

    // =========================
    // COC
    // =========================
    upsertCocCommune: (payload) =>
        request("/coc-communes/upsert", { method: "POST", body: JSON.stringify(payload) }),

    upsertCocStatus: (payload) =>
        request("/coc-status/upsert", { method: "POST", body: JSON.stringify(payload) }),

    setCocOrdinanceFlag: (payload) =>
        request("/coc-ordinances/flag", { method: "POST", body: JSON.stringify(payload) }),

    uploadCocOrdinance: ({ day, commune_name, file }) => {
        const fd = new FormData();
        fd.append("file", file);
        return request(
            `/coc-ordinances/upload?day=${encodeURIComponent(day)}&commune_name=${encodeURIComponent(
                commune_name
            )}`,
            { method: "POST", body: fd }
        );
    },

    downloadCocOrdinance: async ({ day, commune_name }) => {
        const url = `${API}/coc-ordinances/download?day=${encodeURIComponent(
            day
        )}&commune_name=${encodeURIComponent(commune_name)}`;
        const headers = {};
        const liveToken = getToken();
        if (liveToken) headers.Authorization = `Bearer ${liveToken}`;

        const res = await fetch(url, { headers });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(txt || `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const cd = res.headers.get("content-disposition") || "";
        const m = cd.match(/filename="([^"]+)"/i);
        const filename = m?.[1] || "ordinanza.pdf";
        return { blob, filename };
    },

    listCocNotes: (day, commune_name) =>
        request(
            `/coc-notes?day=${encodeURIComponent(day)}&commune_name=${encodeURIComponent(commune_name)}`
        ),

    createCocNote: (payload) =>
        request("/coc-notes", { method: "POST", body: JSON.stringify(payload) }),

    deleteCocNote: (id) => request(`/coc-notes/${id}`, { method: "DELETE" }),

    // =========================
    // SAFETY BELLUNO (DB)
    // =========================
    listSafetyContacts: (with_notes = false) =>
        request(`/safety-belluno/contacts${with_notes ? "?with_notes=1" : ""}`),

    createSafetyContact: (payload) =>
        request("/safety-belluno/contacts", { method: "POST", body: JSON.stringify(payload) }),

    updateSafetyContact: (id, patch) =>
        request(`/safety-belluno/contacts/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

    deleteSafetyContact: (id) => request(`/safety-belluno/contacts/${id}`, { method: "DELETE" }),

    listSafetyContactNotes: (contactId) =>
        request(`/safety-belluno/contacts/${contactId}/notes`),

    addSafetyContactNote: (contactId, body) =>
        request(`/safety-belluno/contacts/${contactId}/notes`, {
            method: "POST",
            body: JSON.stringify({ body }),
        }),

    deleteSafetyNote: (noteId) => request(`/safety-belluno/notes/${noteId}`, { method: "DELETE" }),

    // =========================
    // ANA
    // =========================
    addAnaItem: (payload) =>
        request("/ana/items", {
            method: "POST",
            body: JSON.stringify(
                cleanPayload(payload, { dropEmptyString: true }) // ✅ niente day:null / "" ecc
            ),
        }),

    patchAnaItem: (id, patch) =>
        request(`/ana/items/${id}`, {
            method: "PATCH",
            body: JSON.stringify(cleanPayload(patch, { dropEmptyString: true })),
        }),

    deleteAnaItem: (id) => request(`/ana/items/${id}`, { method: "DELETE" }),

    listAnaNotes: ({ day, place, section_id, section_title } = {}) => {
        const qs = new URLSearchParams();
        if (day != null && day !== "") qs.set("day", day); // ✅ non manda "null"
        if (place) qs.set("place", place);
        if (section_id) qs.set("section_id", section_id);
        if (section_title) qs.set("section_title", section_title);
        return request(`/ana/notes?${qs.toString()}`);
    },

    createAnaNote: (payload) =>
        request("/ana/notes", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),

    deleteAnaNote: (id) => request(`/ana/notes/${id}`, { method: "DELETE" }),

    renameAnaSection: (payload) =>
        request("/ana/sections/rename", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),

    // =========================
    // PC (DB)
    // =========================
    listPcMonth: ({ kind, month }) =>
        request(`/pc/month?kind=${encodeURIComponent(kind)}&month=${encodeURIComponent(month)}`),

    setPcDayUi: (payload) =>
        request("/pc/day-ui", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),

    // ✅ move usa from: { id } e to: { day, shift, slot }
    movePc: (payload) =>
        request("/pc/move", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),

    // ✅ assign usato dal +
    pcAssign: (payload) =>
        request("/pc/assign", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),




    // =========================
    // UTILITY LINKS (DB)
    // =========================
    listUtilityLinks: () => request("/utility-links"),

    createUtilityLink: (payload) =>
        request("/utility-links", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),

    deleteUtilityLink: (id) => request(`/utility-links/${id}`, { method: "DELETE" }),

    // =========================
    // MAP BLIPS (DB)
    // =========================
    listMapBlips: () => request("/map-blips"),

    createMapBlip: (payload) =>
        request("/map-blips", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),

    deleteMapBlip: (id) => request(`/map-blips/${id}`, { method: "DELETE" }),



        // =========================
    // ISSUE REPORTS (SEGNALAZIONI)
    // =========================

    // utente loggato: crea segnalazione
    createIssueReport: (payload) =>
        request("/issue-reports", {
            method: "POST",
            body: JSON.stringify(cleanPayload(payload, { dropEmptyString: true })),
        }),

    // admin: lista segnalazioni (status=open|closed|all)
    adminIssueReports: (status = "all", limit = 200) => {
        const qs = new URLSearchParams();
        qs.set("status", status);
        qs.set("limit", String(limit));
        return request(`/admin/issue-reports?${qs.toString()}`);
    },

    // admin: cambia stato segnalazione
    adminSetIssueReportStatus: (id, status) =>
        request(`/admin/issue-reports/${id}/status`, {
            method: "POST",
            body: JSON.stringify({ status }),
        }),

};
