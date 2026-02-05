// src/lib/auth.jsx
import React from "react";
import { api, setToken } from "./api.js";

const Ctx = React.createContext(null);

export function useAuth() {
    const v = React.useContext(Ctx);
    if (!v) throw new Error("useAuth must be used within AuthProvider");
    return v;
}

export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        (async () => {
            try {
                const me = await api.me();
                setUser(me.user);
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        const res = await api.login(email, password);
        setToken(res.token);
        const me = await api.me();
        setUser(me.user);
        setLoading(false);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    // Normalizzazione robusta: "Admin"/"admin"/"EDITOR" -> "admin"/"editor"
    const role = String(user?.role || "").trim().toLowerCase();

    const canWrite = role === "admin" || role === "editor";
    const isAdmin = role === "admin";

    return (
        <Ctx.Provider
            value={{
                user,
                loading,
                login,
                logout,
                role,     // es: "admin"
                canWrite, // boolean
                isAdmin,  // boolean
            }}
        >
            {children}
        </Ctx.Provider>
    );
}
