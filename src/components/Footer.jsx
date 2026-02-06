export default function Footer() {
    return (
        <footer className="mt-6 border-t border-neutral-800">
            <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-neutral-400">
                    {/* Sinistra */}
                    <div className="flex items-center gap-1">
                        <span>Developed with</span>
                        <span className="text-red-500">❤️</span>
                        <span>by</span>
                        <span className="text-neutral-200 font-medium">
                            Sofia Vidotto
                        </span>
                    </div>

                    {/* Destra */}
                    <div className="text-neutral-300">
                        Protezione Civile Regione Veneto
                    </div>
                </div>
            </div>
        </footer>
    );
}
