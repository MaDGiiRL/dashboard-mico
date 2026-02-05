import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import Layout from "../components/Layout.jsx";

import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Calendar from "../pages/Calendar.jsx";
import Coc from "../pages/Coc.jsx";
import Gare from "../pages/Gare.jsx";
import Criticita from "../pages/Criticita.jsx";
import Meteo from "../pages/Meteo.jsx";
import Rubrica from "../pages/Rubrica.jsx";
import Admin from "../pages/Admin.jsx";

function Protected({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="p-6 text-neutral-300">Caricamento…</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

function AdminOnly({ children }) {
    const { isAdmin } = useAuth();
    if (!isAdmin) return <div className="p-6">Non autorizzato.</div>;
    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/"
                element={
                    <Protected>
                        <Layout />
                    </Protected>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="calendario" element={<Calendar />} />
                <Route path="coc" element={<Coc />} />
                <Route path="gare" element={<Gare />} />
                <Route path="criticita" element={<Criticita />} />
                <Route path="meteo" element={<Meteo />} />
                <Route path="rubrica" element={<Rubrica />} />
                <Route
                    path="admin"
                    element={
                        <AdminOnly>
                            <Admin />
                        </AdminOnly>
                    }
                />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
