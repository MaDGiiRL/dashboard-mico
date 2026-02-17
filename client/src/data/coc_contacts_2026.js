// src/data/coc_contacts_2026.js

const COC = [
  {
    id: "cortina-d-ampezzo",
    commune: "Cortina D'Ampezzo",
    coc_status: "aperto",
    ordinance: true,
    contacts: `Assessore Stefano Ghezze – tel: 3338615559
Ing. Roberto Manfredonia (Dirigente Settore Tecnico) tel: 3783056174
Coordinatore operai comunali – tel: 3783027890
Signora Viviana Bettiol (caposquadra volontari Protezione Civile) – tel 3474406178
Geom. Cipriotto Cristian (tecnico comunale) – tel 3333184536
Geol. Ennio Grillo (tecnico comunale) – tel 3934152171
Per. Ind. Marco Mengus (tecnico comunale) – tel 3348740780`,
    notes: "",
  },
  {
    id: "borca-di-cadore",
    commune: "Borca di Cadore",
    coc_status: "chiuso",
    ordinance: true,
    contacts: "",
    notes: "",
  },
  {
    id: "san-vito-di-cadore",
    commune: "San Vito di Cadore",
    coc_status: "aperto",
    ordinance: true,
    contacts: `Possibili funzioni coinvolte Referente Numero di telefono
Tecnica e di valutazione U. TEC – Luca Roda 3385038215
Sanità - Assistenza sociale e veterinaria Referente AULSS 1 0437 516830
Volontariato LLPP Alberto del Favero / U.TEC Stefano Polloni 347 463 0776 / 0436 897216
Logistica U. TEC – Luca Roda 3385038215
Telecomunicazioni U. TEC - Marco Maganetto 347 384 4418
Servizi essenziali U.TEC. - Luca Roda 3385038215
Censimento danni U.TEC. - Luca Roda 3385038215
Accessibilità e mobilità P.L. - Marco Angelici 3357623737
Assistenza alla popolazione Antonio Palatini / Nicola De Lotto 338 380 1755 / 3481067820
Continuità amministrativa U.PROT - Lorenzo De Lotto 0436 897212`,
    notes: "Ha un sacco di numeri",
  },
  {
    id: "valle-di-cadore",
    commune: "Valle di Cadore",
    coc_status: "chiuso",
    ordinance: false,
    contacts: "",
    notes: "COC CHIUSO - NO VOLONTARI",
  },
  {
    id: "vodo-di-cadore",
    commune: "Vodo di Cadore",
    coc_status: "aperto",
    ordinance: true,
    contacts: "",
    notes: "",
  },
  {
    id: "pieve-di-cadore",
    commune: "Pieve di Cadore",
    coc_status: "chiuso",
    ordinance: false,
    contacts: `Sindaca Sindi Manushi 328 693 5534
Funzionario tecnico Enzo Valmassoi 347 411 5350 - 334 364 7338
Funzionario tecnico Ignazio Calligaro 340 061 3370`,
    notes: `Chiamati per riferire di aprire il COC,
dicono di non aver disponibilità di personale e non vogliono aprire il COC.
Ci hanno inviato i numeri da contattare in caso di necessità.`,
  },
  {
    id: "auronzo-di-cadore",
    commune: "Auronzo di Cadore",
    coc_status: "aperto",
    ordinance: true,
    contacts: `Sindaco: Veccelio Dario 3486729200
Resp uff tecnico: 3486729201`,
    notes: "",
  },
  {
    id: "calalzo-di-cadore",
    commune: "Calalzo di Cadore",
    coc_status: "aperto",
    ordinance: true,
    contacts: `Ufficio Tecnico: 340 7935688
Polizia Locale: 328 4492043
Sindaco Sig. Luca Fanton cell. 333 3810078`,
    notes: `APERTURA CENTRO OPERATIVO COMUNALE (C.O.C.) PER CONDIZIONI
METEO AVVERSE E IN PREVISIONE DELLE OLIMPIADI MILANO – CORTINA
2026.`,
  },
  {
    id: "perarolo-di-cadore",
    commune: "Perarolo di Cadore",
    coc_status: "chiuso",
    ordinance: false,
    contacts: "",
    notes: "COC CHIUSO - NO VOLONTARI",
  },
  {
    id: "longarone",
    commune: "Longarone",
    coc_status: "chiuso",
    ordinance: true,
    contacts: "",
    notes: "",
  },
  {
    id: "ponte-nelle-alpi",
    commune: "Ponte nelle Alpi",
    coc_status: "chiuso",
    ordinance: false,
    contacts: "",
    notes: "",
  },
  {
    id: "belluno",
    commune: "Belluno",
    coc_status: "aperto",
    ordinance: true,
    contacts: `C.O.C. – tel. 0437 913543
- esigenze di Polizia locale, in orario apertura degli uffici – tel. 0437 913520`,
    notes: "",
  },
];

export function cocContactsAll() {
  return COC;
}

export function cocContactByCommune(commune) {
  return COC.find((x) => x.commune.toLowerCase() === String(commune || "").toLowerCase()) || null;
}
