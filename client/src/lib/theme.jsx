import React from "react";

const ThemeCtx = React.createContext(null);

function getInitialTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
}

function applyTheme(theme) {
    const root = document.documentElement; // <html>
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = React.useState(getInitialTheme);

    React.useEffect(() => {
        applyTheme(theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const value = React.useMemo(
        () => ({
            theme,
            setTheme,
            toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        }),
        [theme]
    );

    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
    const ctx = React.useContext(ThemeCtx);
    if (!ctx) throw new Error("useTheme must be used within <ThemeProvider />");
    return ctx;
}
