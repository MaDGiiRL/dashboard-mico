// src/lib/auth.jsx
import React from "react";
import { api, setToken } from "./api.js";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const refresh = React.useCallback(async () => {
        setLoading(true);
        try {
            const me = await api.me();
            // ✅ /me ritorna { user: {...} }
            setUser(me.user || null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const login = async (email, password) => {
        const out = await api.login(email, password);
        setToken(out.token);

        // ✅ opzionale: se vuoi evitare una chiamata in più, puoi fare:
        // setUser(out.user);
        // setLoading(false);
        // ma così è più pulito e coerente col token:
        await refresh();
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
    };

    const role = user?.role || null; // ✅ ora è corretto
    const canWrite = role === "admin" || role === "editor";

    return (
        <AuthCtx.Provider value={{ user, role, canWrite, loading, login, logout, refresh }}>
            {children}
        </AuthCtx.Provider>
    );
}

export function useAuth() {
    const ctx = React.useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
