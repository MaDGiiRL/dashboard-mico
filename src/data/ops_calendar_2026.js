// src/data/ops_calendar_2026.js
import { b1HasAny } from "./b1_calendar_2026.js";

/**
 * Appuntamenti OPS fissi (solo lettura):
 * - 07:30–23:30 collegamento sala safety belluno
 * - 11:30 briefing CFD
 * - 15:00 allineamento reg/prov allerta meteo Milano–Cortina
 * - 17:00 incontro operativo CMR Milano–Cortina
 *
 * Per default li mostriamo solo nei giorni "operativi" secondo B1 (gare/speciali),
 * così non intasano il calendario nei giorni vuoti.
 * Se li vuoi SEMPRE, basta rimuovere il controllo b1HasAny.
 */
export function opsAppointmentsForDay(dayISO) {
    if (!b1HasAny(dayISO)) return [];

    const mk = (idx, title, starts, ends, location = "", notes = "") => ({
        id: `ops-${dayISO}-${idx}`,
        source: "OPS",
        readonly: true,
        title,
        location,
        starts_at: `${dayISO}T${starts}:00`,
        ends_at: ends ? `${dayISO}T${ends}:00` : null,
        notes,
    });

    return [
        mk(1, "Collegamento con Sala Safety Belluno", "07:30", "23:30", "Belluno", "Collegamento continuativo"),
        mk(2, "Briefing CFD", "11:30", "12:00", "", "Briefing CFD"),
        mk(
            3,
            "Allineamento regionale/provinciale – allerta meteo Milano–Cortina",
            "15:00",
            "15:30",
            "",
            "Allineamento regionale/provinciale"
        ),
        mk(4, "Incontro operativo CMR Milano–Cortina", "17:00", "18:00", "", "CMR Milano–Cortina"),
    ];
}

export function opsCount(dayISO) {
    return opsAppointmentsForDay(dayISO).length;
}
