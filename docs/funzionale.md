# Documentazione Funzionale Dashboard MiCo

## 1) Scopo della dashboard
La Dashboard MiCo è un pannello operativo unico per coordinare attività, risorse e comunicazioni durante eventi complessi (es. grandi eventi sportivi/territoriali), con particolare focus su:

- pianificazione giornaliera,
- monitoraggio criticità,
- coordinamento COC,
- gestione personale/turni,
- tracciamento segnalazioni,
- storico attività e audit.

In pratica, centralizza in un solo punto dati che altrimenti sarebbero dispersi tra fogli, chat e strumenti eterogenei.

## 2) Ruoli utente e permessi funzionali

### Viewer
- Consulta dati e dashboard.
- Non modifica i record operativi.

### Editor
- Aggiorna contenuti operativi (appuntamenti, note, mappe, logistica, ecc.).
- Non accede alle funzioni amministrative complete.

### Admin
- Gestisce utenti, ruoli, attivazioni account.
- Approva/rifiuta/revoca richieste di accesso.
- Consulta log attività e audit DB.

## 3) Aree funzionali principali

## 3.1 Dashboard giornaliera
**Cosa gestisce**
- Vista operativa per giorno (`day`) con informazioni aggregate.
- Supporto al coordinamento decisionale rapido.

**Valore operativo**
- Permette un “quadro situazione” unico per briefing e passaggi consegne.

## 3.2 Mappa operativa
**Cosa gestisce**
- Visualizzazione layer geografici (siti, aree strategiche, mezzi, parcheggi, ecc.).
- Marker dinamici (map blips) per punti rilevanti temporanei.

**Valore operativo**
- Riduce i tempi di comunicazione su posizioni e aree di intervento.

## 3.3 Criticità / Segnalazioni
**Cosa gestisce**
- Inserimento segnalazioni operative.
- Workflow admin di stato segnalazioni (aperte/chiuse).

**Valore operativo**
- Traccia la vita delle criticità e migliora la prioritizzazione.

## 3.4 Meteo
**Cosa gestisce**
- Consultazione bollettini/meteo integrati nella vista operativa.
- Supporto alle decisioni preventive (safety/logistica/eventi).

## 3.5 Reperibilità / Turnazioni
**Cosa gestisce**
- Pianificazione turni/movimenti del personale (modulo PC).
- Assegnazioni su giorno/fascia/slot con operazioni di move/assign.

**Valore operativo**
- Migliora copertura operativa e continuità dei presidi.

## 3.6 COC Safety
**Cosa gestisce**
- Stato COC per comune,
- ordinanze (flag/upload/download),
- note territoriali,
- logistica COC per intervalli temporali,
- contatti e note safety (modulo Belluno).

**Valore operativo**
- Rende omogeneo il coordinamento tra sala operativa e territorio.

## 3.7 Inventario ANA
**Cosa gestisce**
- Anagrafica e disponibilità materiali/asset,
- note per sezioni/luoghi,
- rinomina sezioni inventariali.

**Valore operativo**
- Aumenta visibilità su risorse disponibili e stato materiali.

## 3.8 Utility operative
**Cosa gestisce**
- Raccolta link e risorse operative utili,
- credenziali/parametri rapidi per consultazione interna.

**Valore operativo**
- Riduce attrito operativo e tempo perso nel reperire strumenti.

## 3.9 Activity Log
**Cosa gestisce**
- Tracciamento delle operazioni applicative principali (chi ha fatto cosa).

**Valore operativo**
- Supporta accountability, troubleshooting e ricostruzione eventi.

## 3.10 Amministrazione
**Cosa gestisce**
- Ciclo di vita utenti (creazione, ruolo, attivo/non attivo),
- richieste di abilitazione,
- consultazione log applicativi e audit DB.

**Valore operativo**
- Governo centralizzato degli accessi e conformità operativa.

## 4) Flussi funzionali chiave

### 4.1 Richiesta accesso → abilitazione
1. Utente esterno compila richiesta.
2. Admin valuta.
3. In caso approvazione, viene creato l’utente con ruolo assegnato.
4. Utente effettua login e accede alle sezioni consentite.

### 4.2 Gestione giornata operativa
1. Team apre Dashboard del giorno.
2. Aggiorna appuntamenti/eventi/note.
3. Verifica mappa e criticità.
4. Allinea COC/logistica/meteo.
5. Registra modifiche con tracciabilità nei log.

### 4.3 Gestione criticità
1. Operatore inserisce segnalazione.
2. Admin monitora coda segnalazioni.
3. Aggiorna stato fino a chiusura.
4. Storico disponibile per analisi post-evento.

## 5) Dati/oggetti gestiti (macro-categorie)
La dashboard gestisce principalmente:

- utenti e permessi,
- richieste di accesso,
- note operative,
- appuntamenti/gare/eventi,
- stato e documenti COC,
- logistica territoriale,
- contatti safety e annotazioni,
- inventario ANA,
- assegnazioni turni PC,
- marker geografici,
- link utility,
- segnalazioni criticità,
- log attività + audit.

## 6) KPI operativi consigliati (opzionali)
Per valorizzare la dashboard a livello manageriale puoi monitorare:

- tempo medio approvazione richieste accesso,
- numero criticità aperte vs chiuse per giorno,
- tempo medio chiusura criticità,
- numero aggiornamenti operativi per turno,
- copertura turni (slot coperti / slot totali),
- numero interventi su dati COC per giornata.

## 7) Quando usare questa dashboard
È particolarmente adatta quando servono:

- coordinamento multi-team,
- forte tracciabilità decisionale,
- aggiornamento real-time/near real-time del quadro operativo,
- separazione netta dei permessi tra consultazione e modifica.
