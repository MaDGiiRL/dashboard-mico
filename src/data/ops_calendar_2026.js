// src/data/ops_calendar_2026.js
function iso(day, hhmm) {
    // ISO locale "YYYY-MM-DDTHH:MM:00"
    return `${day}T${hhmm}:00`;
}

const OPS = {
    "2026-02-06": [
        {
            id: "ops-2026-02-06-safety-link",
            external_id: "2026-02-06-safety-link",
            title: "Collegamento con sala safety Belluno",
            location: "Belluno",
            starts_at: iso("2026-02-06", "07:30"),
            ends_at: iso("2026-02-06", "23:30"),
        },
        {
            id: "ops-2026-02-06-briefing-cfd",
            external_id: "2026-02-06-briefing-cfd",
            title: "Briefing CFD",
            location: "",
            starts_at: iso("2026-02-06", "11:30"),
            ends_at: null,
        },
        {
            id: "ops-2026-02-06-allineamento-meteo",
            external_id: "2026-02-06-allineamento-meteo",
            title: "Allineamento regionale/provinciale — Allerta meteo Milano–Cortina",
            location: "Milano – Cortina",
            starts_at: iso("2026-02-06", "15:00"),
            ends_at: null,
        },
        {
            id: "ops-2026-02-06-cmr-operativo",
            external_id: "2026-02-06-cmr-operativo",
            title: "Incontro operativo CMR Milano–Cortina",
            location: "Milano – Cortina",
            starts_at: iso("2026-02-06", "17:00"),
            ends_at: null,
        },
    ],
};

export function opsAppointmentsForDay(day) {
    return (OPS[day] || []).map((x) => ({
        ...x,
        source: "OPS",
        readonly: true,
    }));
}

export function opsCount(day) {
    return OPS[day]?.length || 0;
}
