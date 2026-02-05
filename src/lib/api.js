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

    issueComments: (id) => request(`/issues/${id}/comments`),
    addIssueComment: (id, message) =>
        request(`/issues/${id}/comments`, { method: "POST", body: JSON.stringify({ message }) }),

    logs: (section, day, limit = 50) => {
        const sp = new URLSearchParams();
        if (section) sp.set("section", section);
        if (day) sp.set("day", day);
        sp.set("limit", String(limit));
        return request(`/activity-logs?${sp.toString()}`);
    },

    adminUsers: () => request("/admin/users"),
    adminCreateUser: (payload) => request("/admin/users", { method: "POST", body: JSON.stringify(payload) }),
    adminSetRole: (id, role) =>
        request(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
};
