// src/components/Footer.jsx
export default function Footer() {
    return (
        <footer className="mt-6">
            <div className="rounded-3xl bg-white/70 backdrop-blur shadow-sm overflow-hidden">
                {/* top accent */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-rose-500" />

                <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-neutral-600">
                        <div className="flex items-center gap-1">
                            <span>Developed with</span>
                            <span className="text-rose-500">❤️</span>
                            <span>by</span>
                            <span className="text-neutral-900 font-semibold">Sofia Vidotto</span>
                        </div>

                        <div className="text-neutral-700 font-medium">Protezione Civile Regione Veneto</div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
