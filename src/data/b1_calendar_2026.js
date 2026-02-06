// src/data/b1_calendar_2026.js
// Calendario B1 (rifatto da testo Idealista incollato dall'utente)
// Struttura giorno-per-giorno: ISO date -> { races: [], specials: [] }

export const B1_CALENDAR_2026 = {
    "2026-01-25": {
        races: [],
        specials: [
            {
                type: "special",
                title: "Torcia olimpica",
                starts_at: "2026-01-25T00:00:00",
                ends_at: "2026-01-25T23:59:00",
                notes: "",
            },
        ],
    },

    // =========================
    // OLIMPIADI INVERNALI 2026 (dal testo Idealista incollato)
    // 4–5 Feb: anticipazione
    // 6–22 Feb: Giochi
    // =========================

    "2026-02-04": {
        races: [
            {
                sport: "curling",
                name: "Curling: qualificazioni doppio misto (sessione serale)",
                starts_at: "2026-02-04T19:05:00",
                ends_at: "2026-02-04T21:05:00",
                venue: "",
                notes: "",
            },
        ],
        specials: [],
    },

    "2026-02-05": {
        races: [
            {
                sport: "curling",
                name: "Curling: eliminatorie / gironi doppio misto (sessione mattino)",
                starts_at: "2026-02-05T10:05:00",
                ends_at: "2026-02-05T12:05:00",
                venue: "",
                notes: "",
            },
            {
                sport: "curling",
                name: "Curling: eliminatorie / gironi doppio misto (sessione pomeriggio)",
                starts_at: "2026-02-05T14:35:00",
                ends_at: "2026-02-05T16:35:00",
                venue: "",
                notes: "",
            },
            {
                sport: "curling",
                name: "Curling: eliminatorie / gironi doppio misto (sessione serale)",
                starts_at: "2026-02-05T19:05:00",
                ends_at: "2026-02-05T21:05:00",
                venue: "",
                notes: "",
            },
            {
                sport: "hockey",
                name: "Hockey su ghiaccio femminile: preliminari (sessioni)",
                starts_at: "2026-02-05T12:10:00",
                ends_at: "2026-02-05T23:40:00",
                venue: "",
                notes: "",
            },
            {
                sport: "snowboard",
                name: "Snowboard: qualificazioni big air maschile",
                starts_at: "2026-02-05T19:30:00",
                ends_at: "2026-02-05T21:45:00",
                venue: "",
                notes: "",
            },
        ],
        specials: [],
    },

    "2026-02-06": {
        races: [
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Team event",
                starts_at: "2026-02-06T09:55:00",
                ends_at: "2026-02-06T14:55:00",
                venue: "",
                notes: "",
            },
            {
                sport: "hockey",
                name: "Hockey su ghiaccio femminile: preliminari",
                starts_at: "2026-02-06T12:10:00",
                ends_at: "2026-02-06T17:10:00",
                venue: "",
                notes: "",
            },
        ],
        specials: [
            {
                type: "special",
                title: "Cerimonia di apertura (Stadio Meazza, Milano)",
                starts_at: "2026-02-06T20:00:00",
                ends_at: "2026-02-06T22:30:00",
                notes: "",
            },
        ],
    },

    "2026-02-07": {
        races: [
            // Gare con medaglie in palio (da elenco Idealista)
            {
                sport: "sci_alpino",
                name: "Sci alpino: Discesa libera uomini",
                starts_at: "2026-02-07T11:30:00",
                ends_at: "2026-02-07T13:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Skiathlon 10km+10km donne",
                starts_at: "2026-02-07T13:00:00",
                ends_at: "2026-02-07T14:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "salto_sci",
                name: "Salto con gli sci: Trampolino normale individuale donne",
                starts_at: "2026-02-07T18:45:00",
                ends_at: "2026-02-07T21:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale big air uomini",
                starts_at: "2026-02-07T19:30:00",
                ends_at: "2026-02-07T21:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 3000m donne",
                starts_at: "2026-02-07T16:00:00",
                ends_at: "2026-02-07T17:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-08": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Discesa libera donne",
                starts_at: "2026-02-08T11:30:00",
                ends_at: "2026-02-08T13:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "biathlon",
                name: "Biathlon: Staffetta mista 4x6km",
                starts_at: "2026-02-08T14:05:00",
                ends_at: "2026-02-08T15:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Skiathlon 10km+10km uomini",
                starts_at: "2026-02-08T12:30:00",
                ends_at: "2026-02-08T14:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "slittino",
                name: "Slittino: Individuale uomini (run 3 e 4)",
                starts_at: "2026-02-08T17:00:00",
                ends_at: "2026-02-08T19:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale slalom gigante parallelo uomini",
                starts_at: "2026-02-08T13:00:00",
                ends_at: "2026-02-08T14:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale slalom gigante parallelo donne",
                starts_at: "2026-02-08T13:00:00",
                ends_at: "2026-02-08T14:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 5000m uomini",
                starts_at: "2026-02-08T16:00:00",
                ends_at: "2026-02-08T18:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-09": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Combinata a squadre uomini (discesa libera)",
                starts_at: "2026-02-09T10:30:00",
                ends_at: "2026-02-09T12:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpino",
                name: "Sci alpino: Combinata a squadre uomini (slalom)",
                starts_at: "2026-02-09T14:00:00",
                ends_at: "2026-02-09T15:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale freeski slopestyle donne",
                starts_at: "2026-02-09T12:30:00",
                ends_at: "2026-02-09T14:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "salto_sci",
                name: "Salto con gli sci: Trampolino normale individuale uomini",
                starts_at: "2026-02-09T19:00:00",
                ends_at: "2026-02-09T21:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale big air donne",
                starts_at: "2026-02-09T19:30:00",
                ends_at: "2026-02-09T21:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 1000m donne",
                starts_at: "2026-02-09T17:30:00",
                ends_at: "2026-02-09T19:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-10": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Combinata a squadre donne (discesa libera)",
                starts_at: "2026-02-10T10:30:00",
                ends_at: "2026-02-10T12:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpino",
                name: "Sci alpino: Combinata a squadre donne (slalom)",
                starts_at: "2026-02-10T14:00:00",
                ends_at: "2026-02-10T15:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "biathlon",
                name: "Biathlon: 20km individuale uomini",
                starts_at: "2026-02-10T13:30:00",
                ends_at: "2026-02-10T15:30:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Finale sprint tecnica classica donne",
                starts_at: "2026-02-10T11:45:00",
                ends_at: "2026-02-10T13:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Finale sprint tecnica classica uomini",
                starts_at: "2026-02-10T11:45:00",
                ends_at: "2026-02-10T13:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "curling",
                name: "Curling: Finale per il bronzo doppio misto",
                starts_at: "2026-02-10T14:05:00",
                ends_at: "2026-02-10T16:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "curling",
                name: "Curling: Finale per l'oro doppio misto",
                starts_at: "2026-02-10T18:05:00",
                ends_at: "2026-02-10T20:25:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "slittino",
                name: "Slittino: Individuale donne (run 3 e 4)",
                starts_at: "2026-02-10T17:00:00",
                ends_at: "2026-02-10T19:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "salto_sci",
                name: "Salto con gli sci: Gara a squadre miste",
                starts_at: "2026-02-10T18:45:00",
                ends_at: "2026-02-10T21:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "short_track",
                name: "Short track: Staffetta mista (finali)",
                starts_at: "2026-02-10T10:30:00",
                ends_at: "2026-02-10T13:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-11": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Super G uomini",
                starts_at: "2026-02-11T11:30:00",
                ends_at: "2026-02-11T13:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "biathlon",
                name: "Biathlon: 15km individuale donne",
                starts_at: "2026-02-11T14:15:00",
                ends_at: "2026-02-11T16:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Danza sul ghiaccio (programma libero)",
                starts_at: "2026-02-11T19:30:00",
                ends_at: "2026-02-11T23:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale moguls donne",
                starts_at: "2026-02-11T14:15:00",
                ends_at: "2026-02-11T15:35:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "slittino",
                name: "Slittino: Doppio uomini (run 1 e 2)",
                starts_at: "2026-02-11T17:30:00",
                ends_at: "2026-02-11T20:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "slittino",
                name: "Slittino: Doppio donne (run 1 e 2)",
                starts_at: "2026-02-11T17:30:00",
                ends_at: "2026-02-11T20:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "nordic_combined",
                name: "Combinata nordica: Individuale Gundersen uomini NH (salto)",
                starts_at: "2026-02-11T10:00:00",
                ends_at: "2026-02-11T10:45:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "nordic_combined",
                name: "Combinata nordica: Individuale Gundersen uomini NH (10 km)",
                starts_at: "2026-02-11T13:45:00",
                ends_at: "2026-02-11T14:35:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 1000m uomini",
                starts_at: "2026-02-11T18:30:00",
                ends_at: "2026-02-11T20:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-12": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Super G donne",
                starts_at: "2026-02-12T11:30:00",
                ends_at: "2026-02-12T13:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: 10 km TL a intervalli donne",
                starts_at: "2026-02-12T13:00:00",
                ends_at: "2026-02-12T14:55:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale moguls uomini",
                starts_at: "2026-02-12T12:15:00",
                ends_at: "2026-02-12T13:35:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "slittino",
                name: "Slittino: Staffetta a squadre",
                starts_at: "2026-02-12T18:30:00",
                ends_at: "2026-02-12T19:55:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "short_track",
                name: "Short track: 500m donne (finali)",
                starts_at: "2026-02-12T20:15:00",
                ends_at: "2026-02-12T22:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "short_track",
                name: "Short track: 1000m uomini (finali)",
                starts_at: "2026-02-12T20:15:00",
                ends_at: "2026-02-12T22:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "skeleton",
                name: "Skeleton: uomini (1ª e 2ª manche)",
                starts_at: "2026-02-12T09:30:00",
                ends_at: "2026-02-12T12:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finali snowboard cross uomini",
                starts_at: "2026-02-12T13:45:00",
                ends_at: "2026-02-12T15:25:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale halfpipe donne",
                starts_at: "2026-02-12T19:30:00",
                ends_at: "2026-02-12T21:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 5000m donne",
                starts_at: "2026-02-12T16:30:00",
                ends_at: "2026-02-12T18:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-13": {
        races: [
            {
                sport: "biathlon",
                name: "Biathlon: 10km sprint uomini",
                starts_at: "2026-02-13T14:00:00",
                ends_at: "2026-02-13T15:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: 10 km TL a intervalli uomini",
                starts_at: "2026-02-13T12:00:00",
                ends_at: "2026-02-13T13:55:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Programma libero individuale uomini",
                starts_at: "2026-02-13T19:00:00",
                ends_at: "2026-02-13T23:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "skeleton",
                name: "Skeleton: uomini (3ª e 4ª manche)",
                starts_at: "2026-02-13T19:30:00",
                ends_at: "2026-02-13T22:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finali snowboard cross donne",
                starts_at: "2026-02-13T13:30:00",
                ends_at: "2026-02-13T15:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale halfpipe uomini",
                starts_at: "2026-02-13T19:30:00",
                ends_at: "2026-02-13T21:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 10000m uomini",
                starts_at: "2026-02-13T16:00:00",
                ends_at: "2026-02-13T18:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-14": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom gigante uomini (1ª manche)",
                starts_at: "2026-02-14T10:00:00",
                ends_at: "2026-02-14T12:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom gigante uomini (2ª manche)",
                starts_at: "2026-02-14T13:30:00",
                ends_at: "2026-02-14T15:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "biathlon",
                name: "Biathlon: Sprint 7.5km donne",
                starts_at: "2026-02-14T14:45:00",
                ends_at: "2026-02-14T16:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Staffetta 4x7.5km donne",
                starts_at: "2026-02-14T12:00:00",
                ends_at: "2026-02-14T14:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale dual moguls donne",
                starts_at: "2026-02-14T10:30:00",
                ends_at: "2026-02-14T12:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "short_track",
                name: "Short track: 1500m uomini (finali)",
                starts_at: "2026-02-14T20:15:00",
                ends_at: "2026-02-14T23:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "skeleton",
                name: "Skeleton: donne (3ª e 4ª manche)",
                starts_at: "2026-02-14T18:00:00",
                ends_at: "2026-02-14T20:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "salto_sci",
                name: "Salto con gli sci: Individuale uomini trampolino lungo",
                starts_at: "2026-02-14T18:45:00",
                ends_at: "2026-02-14T21:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 500m uomini",
                starts_at: "2026-02-14T16:00:00",
                ends_at: "2026-02-14T18:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-15": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom gigante donne (1ª manche)",
                starts_at: "2026-02-15T10:00:00",
                ends_at: "2026-02-15T12:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom gigante donne (2ª manche)",
                starts_at: "2026-02-15T13:30:00",
                ends_at: "2026-02-15T15:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "biathlon",
                name: "Biathlon: Inseguimento 12.5km uomini",
                starts_at: "2026-02-15T11:15:00",
                ends_at: "2026-02-15T12:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "biathlon",
                name: "Biathlon: Inseguimento 10km donne",
                starts_at: "2026-02-15T14:45:00",
                ends_at: "2026-02-15T16:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "bob",
                name: "Bob: Monobob donne (1ª e 2ª manche)",
                starts_at: "2026-02-15T10:00:00",
                ends_at: "2026-02-15T12:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Staffetta 4x7.5km uomini",
                starts_at: "2026-02-15T12:00:00",
                ends_at: "2026-02-15T14:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Coppie (programma corto)",
                starts_at: "2026-02-15T19:45:00",
                ends_at: "2026-02-15T22:25:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale dual moguls uomini",
                starts_at: "2026-02-15T10:30:00",
                ends_at: "2026-02-15T12:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "skeleton",
                name: "Skeleton: squadre miste",
                starts_at: "2026-02-15T18:00:00",
                ends_at: "2026-02-15T20:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "salto_sci",
                name: "Salto con gli sci: Individuale donne trampolino lungo",
                starts_at: "2026-02-15T18:45:00",
                ends_at: "2026-02-15T21:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finali snowboard squadre miste",
                starts_at: "2026-02-15T13:45:00",
                ends_at: "2026-02-15T15:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 500m donne",
                starts_at: "2026-02-15T16:00:00",
                ends_at: "2026-02-15T18:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-16": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom uomini (1ª manche)",
                starts_at: "2026-02-16T10:00:00",
                ends_at: "2026-02-16T12:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom uomini (2ª manche)",
                starts_at: "2026-02-16T13:30:00",
                ends_at: "2026-02-16T15:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "bob",
                name: "Bob: Monobob donne (3ª e 4ª manche)",
                starts_at: "2026-02-16T19:00:00",
                ends_at: "2026-02-16T22:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Coppie (programma libero)",
                starts_at: "2026-02-16T20:00:00",
                ends_at: "2026-02-16T23:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale freeski big air donne",
                starts_at: "2026-02-16T19:30:00",
                ends_at: "2026-02-16T21:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "short_track",
                name: "Short track: 1000m donne (finali)",
                starts_at: "2026-02-16T11:00:00",
                ends_at: "2026-02-16T13:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "salto_sci",
                name: "Salto con gli sci: Gara a squadre uomini",
                starts_at: "2026-02-16T19:00:00",
                ends_at: "2026-02-16T21:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-17": {
        races: [
            {
                sport: "biathlon",
                name: "Biathlon: Staffetta 4x7.5km uomini",
                starts_at: "2026-02-17T14:30:00",
                ends_at: "2026-02-17T16:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "bob",
                name: "Bob: Doppio uomini (3ª e 4ª manche)",
                starts_at: "2026-02-17T19:00:00",
                ends_at: "2026-02-17T22:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Individuale donne (programma corto)",
                starts_at: "2026-02-17T18:45:00",
                ends_at: "2026-02-17T23:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale freeski big air uomini",
                starts_at: "2026-02-17T19:30:00",
                ends_at: "2026-02-17T21:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "nordic_combined",
                name: "Combinata nordica: Individuale Gundersen uomini LH (salto)",
                starts_at: "2026-02-17T10:00:00",
                ends_at: "2026-02-17T10:45:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "nordic_combined",
                name: "Combinata nordica: Individuale Gundersen uomini LH (10 km)",
                starts_at: "2026-02-17T13:45:00",
                ends_at: "2026-02-17T14:35:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale slopestyle donne",
                starts_at: "2026-02-17T13:00:00",
                ends_at: "2026-02-17T14:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: Inseguimento a squadre (finali uomini e donne)",
                starts_at: "2026-02-17T14:30:00",
                ends_at: "2026-02-17T17:25:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-18": {
        races: [
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom donne (1ª manche)",
                starts_at: "2026-02-18T10:00:00",
                ends_at: "2026-02-18T12:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpino",
                name: "Sci alpino: Slalom donne (2ª manche)",
                starts_at: "2026-02-18T13:30:00",
                ends_at: "2026-02-18T15:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "biathlon",
                name: "Biathlon: Staffetta 4x6km donne",
                starts_at: "2026-02-18T14:45:00",
                ends_at: "2026-02-18T16:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Sprint a squadre TL (finali uomini)",
                starts_at: "2026-02-18T11:45:00",
                ends_at: "2026-02-18T13:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Sprint a squadre TL (finali donne)",
                starts_at: "2026-02-18T11:45:00",
                ends_at: "2026-02-18T13:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale aerials donne",
                starts_at: "2026-02-18T11:30:00",
                ends_at: "2026-02-18T13:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "short_track",
                name: "Short track: 500m uomini (finali) + Staffetta 3000m donne (finali)",
                starts_at: "2026-02-18T20:15:00",
                ends_at: "2026-02-18T22:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "snowboard",
                name: "Snowboard: Finale slopestyle uomini",
                starts_at: "2026-02-18T12:30:00",
                ends_at: "2026-02-18T14:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-19": {
        races: [
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Individuale donne (programma libero)",
                starts_at: "2026-02-19T19:00:00",
                ends_at: "2026-02-19T23:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale aerials uomini",
                starts_at: "2026-02-19T11:30:00",
                ends_at: "2026-02-19T13:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "hockey",
                name: "Hockey su ghiaccio: Finale bronzo donne",
                starts_at: "2026-02-19T14:40:00",
                ends_at: "2026-02-19T17:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "hockey",
                name: "Hockey su ghiaccio: Finale oro donne",
                starts_at: "2026-02-19T19:10:00",
                ends_at: "2026-02-19T22:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "nordic_combined",
                name: "Combinata nordica: Team sprint uomini LH (salto)",
                starts_at: "2026-02-19T10:00:00",
                ends_at: "2026-02-19T10:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "nordic_combined",
                name: "Combinata nordica: Team sprint uomini (2x7.5km)",
                starts_at: "2026-02-19T14:00:00",
                ends_at: "2026-02-19T15:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpinismo",
                name: "Sci alpinismo: Sprint uomini e donne (finali)",
                starts_at: "2026-02-19T12:55:00",
                ends_at: "2026-02-19T14:45:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 1500m uomini",
                starts_at: "2026-02-19T16:30:00",
                ends_at: "2026-02-19T18:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-20": {
        races: [
            {
                sport: "biathlon",
                name: "Biathlon: Mass start 15km uomini",
                starts_at: "2026-02-20T14:15:00",
                ends_at: "2026-02-20T15:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "bob",
                name: "Bob: Doppio donne (1ª e 2ª manche)",
                starts_at: "2026-02-20T10:00:00",
                ends_at: "2026-02-20T12:30:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "curling",
                name: "Curling: Finale per il bronzo uomini",
                starts_at: "2026-02-20T19:05:00",
                ends_at: "2026-02-20T22:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Ski cross donne (finali)",
                starts_at: "2026-02-20T12:00:00",
                ends_at: "2026-02-20T13:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale freeski halfpipe uomini",
                starts_at: "2026-02-20T19:30:00",
                ends_at: "2026-02-20T21:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "short_track",
                name: "Short track: 1500m donne (finali) + Staffetta 5000m uomini (finali)",
                starts_at: "2026-02-20T20:15:00",
                ends_at: "2026-02-20T22:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: 1500m donne",
                starts_at: "2026-02-20T16:30:00",
                ends_at: "2026-02-20T18:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-21": {
        races: [
            {
                sport: "biathlon",
                name: "Biathlon: Mass start 12.5km donne",
                starts_at: "2026-02-21T14:15:00",
                ends_at: "2026-02-21T15:15:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "bob",
                name: "Bob: Doppio donne (3ª e 4ª manche)",
                starts_at: "2026-02-21T19:00:00",
                ends_at: "2026-02-21T22:10:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Mass start 50km tecnica classica uomini",
                starts_at: "2026-02-21T11:00:00",
                ends_at: "2026-02-21T14:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "curling",
                name: "Curling: Finale per il bronzo donne",
                starts_at: "2026-02-21T14:05:00",
                ends_at: "2026-02-21T17:05:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "curling",
                name: "Curling: Finale per l'oro uomini",
                starts_at: "2026-02-21T19:05:00",
                ends_at: "2026-02-21T22:25:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "figure_skating",
                name: "Pattinaggio di figura: Gala di esibizione",
                starts_at: "2026-02-21T20:00:00",
                ends_at: "2026-02-21T22:30:00",
                venue: "",
                notes: "",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Ski cross uomini (finali)",
                starts_at: "2026-02-21T12:00:00",
                ends_at: "2026-02-21T13:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Aerials a squadre miste (finale)",
                starts_at: "2026-02-21T10:45:00",
                ends_at: "2026-02-21T12:35:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_freestyle",
                name: "Sci freestyle: Finale freeski halfpipe donne",
                starts_at: "2026-02-21T19:30:00",
                ends_at: "2026-02-21T21:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "hockey",
                name: "Hockey su ghiaccio: Finale per il bronzo uomini",
                starts_at: "2026-02-21T20:40:00",
                ends_at: "2026-02-21T23:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_alpinismo",
                name: "Sci alpinismo: Finale staffetta mista",
                starts_at: "2026-02-21T13:30:00",
                ends_at: "2026-02-21T14:50:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "speed_skating",
                name: "Pattinaggio di velocità: Mass start uomini + Mass start donne",
                starts_at: "2026-02-21T15:00:00",
                ends_at: "2026-02-21T18:00:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [],
    },

    "2026-02-22": {
        races: [
            {
                sport: "bob",
                name: "Bob: Bob a 4 uomini (3ª e 4ª manche)",
                starts_at: "2026-02-22T10:00:00",
                ends_at: "2026-02-22T13:20:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "sci_fondo",
                name: "Sci di fondo: Mass start 50km tecnica classica donne",
                starts_at: "2026-02-22T10:00:00",
                ends_at: "2026-02-22T13:35:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "curling",
                name: "Curling: Finale per l'oro donne",
                starts_at: "2026-02-22T11:05:00",
                ends_at: "2026-02-22T14:25:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
            {
                sport: "hockey",
                name: "Hockey su ghiaccio: Finale per l'oro uomini",
                starts_at: "2026-02-22T13:40:00",
                ends_at: "2026-02-22T16:40:00",
                venue: "",
                notes: "EVENTO MEDAGLIA",
            },
        ],
        specials: [
            {
                type: "special",
                title: "Cerimonia di chiusura (Arena di Verona)",
                starts_at: "2026-02-22T20:00:00",
                ends_at: "2026-02-22T22:00:00",
                notes: "TBD (orario non indicato nel testo)",
            },
        ],
    },

    // =========================
    // RESTO FILE (lasciato come nel tuo originale)
    // =========================

    "2026-03-04": {
        races: [
            { sport: "curling", name: "Curling", starts_at: "2026-03-04T19:05:00", ends_at: "2026-03-04T20:50:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-05": {
        races: [
            { sport: "curling", name: "Curling", starts_at: "2026-03-05T10:05:00", ends_at: "2026-03-05T11:50:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-05T19:05:00", ends_at: "2026-03-05T20:50:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-06": {
        races: [
            { sport: "curling", name: "Curling", starts_at: "2026-03-06T09:05:00", ends_at: "2026-03-06T10:50:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-07": {
        races: [
            { sport: "sci", name: "Sci", starts_at: "2026-03-07T09:30:00", ends_at: "2026-03-07T13:15:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "snowboard", name: "Snowboard", starts_at: "2026-03-07T11:00:00", ends_at: "2026-03-07T12:25:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-07T09:35:00", ends_at: "2026-03-07T12:05:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-07T14:35:00", ends_at: "2026-03-07T16:20:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-07T18:35:00", ends_at: "2026-03-07T21:05:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-08": {
        races: [
            { sport: "snowboard", name: "Snowboard", starts_at: "2026-03-08T11:00:00", ends_at: "2026-03-08T13:25:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-08T09:35:00", ends_at: "2026-03-08T12:05:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-08T14:35:00", ends_at: "2026-03-08T16:20:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-08T18:35:00", ends_at: "2026-03-08T21:05:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-09": {
        races: [
            { sport: "sci", name: "Sci", starts_at: "2026-03-09T09:30:00", ends_at: "2026-03-09T13:15:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-09T09:35:00", ends_at: "2026-03-09T12:05:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-09T14:35:00", ends_at: "2026-03-09T16:20:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-09T18:35:00", ends_at: "2026-03-09T21:05:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-10": {
        races: [
            { sport: "sci", name: "Sci", starts_at: "2026-03-10T09:00:00", ends_at: "2026-03-10T11:30:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "sci", name: "Sci", starts_at: "2026-03-10T13:00:00", ends_at: "2026-03-10T15:40:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-10T09:35:00", ends_at: "2026-03-10T12:05:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-10T14:35:00", ends_at: "2026-03-10T16:20:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-10T18:35:00", ends_at: "2026-03-10T21:05:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-11": {
        races: [
            { sport: "curling", name: "Curling", starts_at: "2026-03-11T09:05:00", ends_at: "2026-03-11T11:35:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-11T14:35:00", ends_at: "2026-03-11T16:40:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-11T20:05:00", ends_at: "2026-03-11T22:35:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-12": {
        races: [
            { sport: "sci", name: "Sci", starts_at: "2026-03-12T09:00:00", ends_at: "2026-03-12T10:20:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "sci", name: "Sci", starts_at: "2026-03-12T12:30:00", ends_at: "2026-03-12T14:00:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-12T13:35:00", ends_at: "2026-03-12T16:05:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-12T18:35:00", ends_at: "2026-03-12T21:05:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-13": {
        races: [
            { sport: "sci", name: "Sci", starts_at: "2026-03-13T09:00:00", ends_at: "2026-03-13T10:50:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "sci", name: "Sci", starts_at: "2026-03-13T12:30:00", ends_at: "2026-03-13T14:40:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-13T10:05:00", ends_at: "2026-03-13T12:35:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-13T18:35:00", ends_at: "2026-03-13T21:05:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-14": {
        races: [
            { sport: "sci", name: "Sci", starts_at: "2026-03-14T09:00:00", ends_at: "2026-03-14T10:10:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "sci", name: "Sci", starts_at: "2026-03-14T13:00:00", ends_at: "2026-03-14T14:35:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "snowboard", name: "Snowboard", starts_at: "2026-03-14T10:00:00", ends_at: "2026-03-14T11:25:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "snowboard", name: "Snowboard", starts_at: "2026-03-14T11:50:00", ends_at: "2026-03-14T13:45:00", venue: "Cortina d'Ampezzo", notes: "" },
            { sport: "curling", name: "Curling", starts_at: "2026-03-14T15:05:00", ends_at: "2026-03-14T18:05:00", venue: "Cortina d'Ampezzo", notes: "" },
        ],
        specials: [],
    },

    "2026-03-15": {
        races: [
            { sport: "sci", name: "Sci", starts_at: "2026-03-15T09:00:00", ends_at: "2026-03-15T10:40:00", venue: "Cortina d'Ampezzo", notes: "Chiusura giochi" },
            { sport: "sci", name: "Sci", starts_at: "2026-03-15T12:00:00", ends_at: "2026-03-15T13:45:00", venue: "Cortina d'Ampezzo", notes: "Chiusura giochi" },
        ],
        specials: [],
    },

    "2026-03-16": {
        races: [],
        specials: [
            { type: "special", title: "Ripristino sala CCS", starts_at: "2026-03-16T08:00:00", ends_at: "2026-03-16T14:00:00", notes: "" },
        ],
    },
};

export function b1Day(dayISO) {
    return B1_CALENDAR_2026[dayISO] || { races: [], specials: [] };
}

export function b1RacesForDay(dayISO) {
    const day = b1Day(dayISO);
    return (day.races || []).map((r, idx) => ({
        ...r,
        id: `b1-${dayISO}-${idx}`,
        source: "B1",
        readonly: true,
    }));
}

export function b1SpecialsForDay(dayISO) {
    const day = b1Day(dayISO);
    return (day.specials || []).map((s, idx) => ({
        ...s,
        id: `b1s-${dayISO}-${idx}`,
        source: "B1",
        readonly: true,
    }));
}

export function b1RaceCount(dayISO) {
    return b1Day(dayISO).races?.length || 0;
}

export function b1HasAny(dayISO) {
    const d = b1Day(dayISO);
    return (d.races?.length || 0) + (d.specials?.length || 0) > 0;
}
