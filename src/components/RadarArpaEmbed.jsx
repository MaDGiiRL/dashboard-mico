// src/components/RadarArpaEmbed.jsx
import { useEffect, useRef, useState } from "react";

function cx(...xs) {
    return xs.filter(Boolean).join(" ");
}

export default function RadarArpaEmbed() {
    const src = "https://meteo.arpa.veneto.it/?page=mosaicoradar";

    const [maybeBlocked, setMaybeBlocked] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        setLoaded(false);
        setMaybeBlocked(false);

        timerRef.current = window.setTimeout(() => {
            if (!loaded) setMaybeBlocked(true);
        }, 4000);

        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [src, loaded]);

    return (
        <div className="space-y-3">
            <div className="rounded-3xl border border-neutral-200 bg-white/85 shadow-sm overflow-hidden">
                {/* accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-olympic-blue via-olympic-yellow to-olympic-red" />

                {/* header */}
                <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-neutral-200 bg-gradient-to-r from-olympic-ice via-white to-white">
                    <div className="text-sm">
                        <div className="font-semibold text-neutral-900">Mosaico radar ARPAV</div>
                        <div className="text-xs text-neutral-600">Dati divulgativi ARPAV • aggiornamento ~10 min</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                        <a
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                            className={cx(
                                "px-3 py-1.5 rounded-xl text-sm border transition",
                                "border-olympic-blue/25 bg-olympic-blue/10 text-olympic-navy",
                                "hover:bg-olympic-blue/15"
                            )}
                            title="Apri su ARPAV"
                        >
                            Apri
                        </a>
                    </div>
                </div>

                {/* iframe area */}
                <div className="relative w-full aspect-[16/10] bg-olympic-ice">
                    {!loaded ? (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-olympic-blue/10 via-white to-olympic-green/10" />
                    ) : null}

                    <iframe
                        title="Mosaico Radar ARPAV"
                        src={src}
                        className="absolute inset-0 h-full w-full"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        onLoad={() => {
                            setLoaded(true);
                            setMaybeBlocked(false);
                        }}
                    />

                    {maybeBlocked ? (
                        <div className="absolute inset-0 grid place-items-center p-6">
                            <div className="max-w-md rounded-3xl border border-olympic-red/25 bg-white/90 shadow-sm p-4">
                                <div className="font-semibold text-neutral-900">Iframe bloccato dal sito ARPAV</div>
                                <div className="mt-1 text-sm text-neutral-700">
                                    Alcuni siti impediscono l&apos;embed (X-Frame-Options/CSP). Aprilo in una nuova scheda:
                                </div>
                                <a
                                    className="mt-3 inline-flex items-center justify-center rounded-xl border border-olympic-red/25 bg-olympic-red/10 px-3 py-2 text-sm font-semibold text-olympic-navy hover:bg-olympic-red/15"
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Apri ARPAV
                                </a>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="text-xs text-neutral-600">
                Fonte: <span className="font-semibold">ARPAV</span> (Mosaico Radar Meteorologico Regionale).
            </div>
        </div>
    );
}
