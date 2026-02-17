// src/data/ana_assets_2026.js

/**
 * Dati statici mezzi/materiali ANA (2026)
 * Struttura pensata per essere usata in Dashboard con:
 *   anaAssetsForPlace("Borca di Cadore")
 *   anaPlaces()
 */

const ANA = [
    {
        id: "san-vito-di-cadore",
        place: "San Vito di Cadore",
        title: "Cucina campale ANA + container/materiali",
        sections: [
            {
                id: "sanvito-container-175042",
                title: "Container ISO 10 – matricola 175042 – 10G1",
                items: [
                    "N. 192 brandine (6 ceste con 32 brandine Satcom cad.)",
                    "N. 200 Kit monouso biancheria (N. 10 scatoloni con 20 kit cad). Ogni kit è composto da: 2 lenzuola, 1 federa, 1 asciugamano doccia, 1 asciugamano viso, 1 asciugatutto",
                ],
            },
            {
                id: "sanvito-guanciali-coperte-isotermiche",
                title: "Materiali (altri scatoloni)",
                items: [
                    "N. 200 Guanciali ignifughi (N. 8 scatoloni da 25 cuscini cad.)",
                    "N. 160 Coperte isotermiche monouso (N. 8 scatoloni da 20 coperte cad.)",
                ],
            },
            {
                id: "sanvito-container-tavoli-panchen",
                title: "Container ISO 10 A.N.A. (mensa)",
                items: [
                    "30 tavole e 60 panche (una decina di tavole e relative panche sono già state sistemate per la mensa — ex asilo a San Vito di Cadore)",
                ],
            },
            {
                id: "sanvito-container-coperte",
                title: "Container ISO 10 A.N.A. (assistenza popolazione)",
                items: ["N. 400 coperte per assistenza alla popolazione"],
            },
        ],
    },

    {
        id: "borca-di-cadore",
        place: "Borca di Cadore",
        title: "Mezzi ANA",
        sections: [
            {
                id: "borca-mezzi-ana",
                title: "Elenco mezzi",
                items: [
                    "n. 1 autocarro 2 assi 4x4 con retro-gru, cassone ribaltabile e biga per trasporto macchine MMT",
                    "n. 1 furgone attrezzato uso officina",
                    "n. 1 skid gommato da 40 q con fresa-neve, benna e forche per bancali",
                    "n. 1 pala Avant 750 semovente da 15 q con fresa-neve, lama, benna e forche per bancali",
                    "n. 1 fresa-neve meccanica manuale",
                    "n. 1 piattaforma elevatrice cingolata",
                ],
            },
        ],
    },
];

export function anaPlaces() {
    return ANA.map((x) => x.place);
}

export function anaAssets() {
    return ANA;
}

export function anaAssetsForPlace(place) {
    return ANA.find((x) => x.place === place) || null;
}
