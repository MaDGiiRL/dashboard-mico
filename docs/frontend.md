# Documentazione Frontend

## 1) Panoramica
Il frontend è una SPA **React + Vite** con routing client-side, stato server via React Query e autenticazione basata su JWT (token salvato in `localStorage`).

- Framework UI: React
- Bundler/dev server: Vite
- Routing: `react-router-dom`
- Data fetching/cache: `@tanstack/react-query`
- Mappe: Leaflet (`leaflet`, `react-leaflet`)
- UI alerts: SweetAlert2
- Stili: CSS + Tailwind (configurato)

## 2) Struttura cartelle (client)

```txt
client/
  src/
    main.jsx            # bootstrap app + provider globali
    app/App.jsx         # routing pubblico/privato
    lib/
      api.js            # client API centralizzato
      auth.jsx          # AuthProvider + useAuth
      alerts.js         # toast/modali standard
    components/         # componenti condivisi
    pages/              # pagine per sezione funzionale
    data/               # dataset statici di supporto
  public/               # asset statici e layer geojson
```

## 3) Configurazione ambiente
Variabili principali:

- `VITE_API_URL` (**obbligatoria**) → URL backend (es. `http://localhost:8080`)
- `VITE_UTILITY_PSW` (opzionale) → password visualizzata in sezione Utility

### Esempio `.env`
```env
VITE_API_URL=http://localhost:8080
VITE_UTILITY_PSW=...
```

## 4) Avvio locale
Da cartella `client/`:

```bash
npm install
npm run dev
```

Script disponibili:
- `dev`: avvio sviluppo
- `build`: build produzione
- `preview`: preview build
- `lint`: lint ESLint

## 5) Bootstrap applicazione
`main.jsx` monta questi provider globali:
1. `QueryClientProvider` (React Query)
2. `AuthProvider` (contesto autenticazione)
3. `BrowserRouter` (routing)

Le query hanno retry limitato e non fanno refetch automatico al focus finestra.

## 6) Routing e protezione pagine
In `app/App.jsx`:

### Rotte pubbliche
- `/login`
- `/richiesta-abilitazione`

### Rotte protette (layout autenticato)
- `/` (Dashboard)
- `/coc-safety`
- `/inventario`
- `/mappa`
- `/criticita`
- `/meteo`
- `/reperibilita`
- `/activity-log`
- `/utility`
- `/admin` (solo admin)

Durante il check sessione viene mostrato `OlympicLoader`.

## 7) Autenticazione client
`lib/auth.jsx` gestisce:
- `login(email, password)`
- `logout()`
- `refresh()` (`GET /me`)
- stato: `user`, `role`, `canWrite`, `isAdmin`, `loading`

`lib/api.js` allega automaticamente header `Authorization` se token disponibile.

## 8) Livello API client
`lib/api.js` centralizza tutte le chiamate backend:
- gestione errori uniforme
- parsing JSON/text
- supporto upload `FormData`
- utility `cleanPayload` per evitare campi `null`/vuoti indesiderati

### Gruppi funzionali esposti
- Auth (`login`, `me`, `logout`)
- Access request + amministrazione utenti
- Activity logs e audit
- Dashboard day
- Note/Appuntamenti/Race/Eventi
- Moduli COC (communes, status, ordinanze, note, logistica)
- Safety Belluno
- ANA inventario/note
- PC turni/movimenti
- Utility links
- Map blips
- Issue reports

## 9) Pattern React Query (linee guida)
Pattern usato nel progetto:
- `useQuery` per list/detail
- `useMutation` per create/update/delete
- invalidazione cache via `queryClient.invalidateQueries(...)` dopo mutazioni

Questo approccio è già applicato ad esempio nella pagina `Utility`.

## 10) Asset geografici
In `public/layers/` sono presenti GeoJSON statici (es. COC, siti gara, mezzi, aree strategiche) usati dalla pagina mappa.

## 11) Convenzioni UI
- Componenti riusabili in `src/components`.
- Alert/confirm centralizzati in `src/lib/alerts.js`.
- Routing protetto via wrapper (`Protected`, `AdminOnly`) in `App.jsx`.

## 12) Troubleshooting veloce
- **Errore “VITE_API_URL mancante”**: definire la variabile in `.env` e riavviare Vite.
- **401 su chiamate protette**: token assente/scaduto o utente disabilitato lato backend.
- **Dati non aggiornati a schermo**: verificare invalidazioni React Query dopo mutation.
