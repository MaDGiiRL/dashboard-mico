// src/lib/auth.jsx
import React from "react";
import { api, setToken, getToken } from "./api.js";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const refresh = React.useCallback(async () => {
        setLoading(true);
        try {
            const me = await api.me();
            setUser(me?.user || null);
        } catch {
            // 401 o token scaduto
            setUser(null);
            setToken(null);
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ non chiamare /me se non c’è token
    React.useEffect(() => {
        const t = getToken();
        if (!t) {
            setUser(null);
            setLoading(false);
            return;
        }
        refresh();
    }, [refresh]);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const out = await api.login(email, password);

            if (!out?.token) throw new Error("Token mancante nella risposta /auth/login");

            setToken(out.token);

            // se il backend restituisce user, lo mettiamo subito
            if (out?.user) setUser(out.user);

            // riallineo con /me (opzionale ma pulito)
            await refresh();
            return out;
        } finally {
            // refresh gestisce loading in uscita
        }
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        setLoading(false);
    };

    const role = user?.role || null;
    const canWrite = role === "admin" || role === "editor";
    const isAdmin = role === "admin";

    return (
        <AuthCtx.Provider value={{ user, role, canWrite, isAdmin, loading, login, logout, refresh }}>
            {children}
        </AuthCtx.Provider>
    );
}

export function useAuth() {
    const ctx = React.useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
