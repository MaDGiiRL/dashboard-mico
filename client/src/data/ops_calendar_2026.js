function iso(day, hhmm) {
    return `${day}T${hhmm}:00`;
}

/**
 * Appuntamenti OPS VALIDI OGNI GIORNO
 */
const OPS_DAILY = [
    {
        id: "ops-safety-link",
        title: "Collegamento con sala safety Belluno",
        location: "Belluno",
        starts_at: "07:30",
        ends_at: "23:30",
    },
    {
        id: "ops-briefing-cfd",
        title: "Briefing CFD",
        location: "Milano – Cortina",
        starts_at: "11:30",
        ends_at: null,
    },
    {
        id: "ops-allineamento-meteo",
        title: "Allineamento regionale/provinciale — Allerta meteo Milano–Cortina",
        location: "Milano – Cortina",
        starts_at: "15:00",
        ends_at: null,
    },
    {
        id: "ops-riunione-borca",
        title: "Riunione sala coordinamento Borca",
        location: "Borca",
        starts_at: "15:00",
        ends_at: null,
    },
    {
        id: "ops-cmr-operativo",
        title: "Incontro operativo CMR Milano–Cortina",
        location: "Milano – Cortina",
        starts_at: "17:00",
        ends_at: null,
    },
];

export function opsAppointmentsForDay(day) {
    return OPS_DAILY.map((x) => ({
        ...x,
        source: "OPS",
        readonly: true,
        external_id: `${day}-${x.id}`,
        starts_at: iso(day, x.starts_at),
        ends_at: x.ends_at ? iso(day, x.ends_at) : null,
    }));
}

export function opsCount() {
    return OPS_DAILY.length;
}
