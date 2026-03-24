# Documentazione Backend

## 1) Panoramica
Il backend è un'API REST costruita con **Fastify** (Node.js ESM), con autenticazione JWT, controllo ruoli (`admin`, `editor`, `viewer`) e persistenza su PostgreSQL. L'entrypoint registra i plugin CORS/multipart e monta i moduli route principali del progetto. 

- Runtime: Node.js + Fastify
- Database: PostgreSQL (`pg`)
- Validazione input: `zod`
- Auth: JWT (`jsonwebtoken`) + hash password (`bcryptjs`)
- Upload file: `@fastify/multipart` (limite 20MB)

## 2) Struttura cartelle (server)

```txt
server/
  src/
    index.js              # bootstrap server + registrazione route
    config.js             # caricamento env e config runtime
    db.js                 # pool PostgreSQL e helper query
    auth/
      jwt.js              # sign/verify token
      middleware.js       # requireAuth / requireRole
      password.js         # hash/verify password
    audit/
      audit.js            # log attività applicative
    routes/
      *.js                # moduli endpoint per dominio
```

## 3) Configurazione ambiente
Variabili lette in `server/src/config.js`:

- `PORT` (default `8080`)
- `DATABASE_URL` (**obbligatoria**)
- `JWT_SECRET` (**obbligatoria**)
- `CORS_ORIGIN` (lista CSV; default `http://localhost:5173`)

Nota: in ambiente non-production viene tentato il load del file `.env` locale.

### Esempio `.env`
```env
PORT=8080
DATABASE_URL=postgres://user:password@host:5432/dbname
JWT_SECRET=super-segreto
CORS_ORIGIN=http://localhost:5173,https://tuo-frontend.vercel.app
```

## 4) Avvio locale
Da cartella `server/`:

```bash
npm install
npm run dev    # watch mode
# oppure
npm start
```

Script disponibili:
- `dev`: `node --watch src/index.js`
- `start`: `node src/index.js`

## 5) Sicurezza e autorizzazione

### Flusso auth
1. `POST /auth/login` valida email/password.
2. Se utente attivo e credenziali corrette, restituisce JWT (scadenza 12h).
3. Le route protette leggono header `Authorization: Bearer <token>`.
4. Il middleware ricarica **sempre** utente/ruolo da DB (evita token stale).

### Ruoli
- `admin`: pieno controllo (incluse route amministrative e delete sensibili)
- `editor`: crea/aggiorna i dati operativi
- `viewer`: sola lettura sulle aree abilitate

## 6) Moduli API principali
Di seguito i gruppi endpoint più rilevanti (base path). Molti endpoint richiedono autenticazione e ruolo.

### Core
- `POST /auth/login`
- `GET /me`
- `POST /auth/logout`
- `GET /days/:day/dashboard`

### Accesso utenti
- `POST /access-requests`
- `GET /admin/access-requests`
- `POST /admin/access-requests/:id/approve|reject|revoke`

### Gestione utenti/admin
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/:id/role`
- `PATCH /admin/users/:id/active`
- `GET /admin/activity-logs`
- `GET /admin/db-audit`

### Domini operativi
- `/note-entries` (GET/POST/PATCH/DELETE)
- `/appointments` (POST/PATCH/DELETE)
- `/races` (POST/PATCH/DELETE)
- `/events` (POST/PATCH/DELETE)
- `/map-blips` (GET/POST/DELETE)
- `/coc-communes`, `/coc-status`, `/coc-notes`, `/coc-logistics`
- `/coc-ordinances/flag|upload|download`
- `/safety-belluno/...`
- `/ana/items`, `/ana/notes`, `/ana/sections/rename`
- `/pc/month`, `/pc/day-ui`, `/pc/move`, `/pc/assign`
- `/utility-links` (GET/POST/DELETE)
- `/issue-reports` + `/admin/issue-reports`
- `GET /rss` (proxy feed)

### CRUD generico (`/api/:table`)
`routes/crud.js` espone endpoint comuni su whitelist tabelle (es. `races`, `issues`, `weather_bulletins`, ecc.):
- `GET /api/<table>`
- `POST /api/<table>`
- `PATCH /api/<table>/:id`
- `DELETE /api/<table>/:id` (tipicamente admin)

## 7) Database access layer
`db.js` espone:
- `q(sql, params)` per query standard
- `qAsUser(user, sql, params)` che imposta variabili sessione PG (`app.user_id`, `app.user_email`, `app.user_role`) utili per audit/trigger lato DB

Connessione configurata con SSL e preferenza IPv4.

## 8) Logging e audit
Sono presenti due livelli:

1. **Activity log applicativo** (`activity_logs`) via `logActivity(...)`.
2. **DB audit** (tabella `audit_changes`) consultabile da admin.

Ogni operazione sensibile (login/logout, CRUD amministrativo, approvazioni richieste, ecc.) registra un riepilogo con prima/dopo quando disponibile.

## 9) Error handling
- Error handler globale Fastify in `index.js`.
- Response JSON uniforme: `{ error: "..." }` su errore.
- Codici frequenti: `400`, `401`, `403`, `404`, `409`, `500`.

## 10) Endpoint di servizio
- `GET /` → risposta di stato build/versione
- `GET /health` → healthcheck semplice

## 11) Suggerimenti operativi
- Tenere allineati i ruoli frontend/backend (`admin`, `editor`, `viewer`).
- Per nuove route: validare input con Zod e registrare `logActivity` dove ha senso.
- Per nuove tabelle “standard” valutare integrazione nel modulo `crud.js` se il pattern è uniforme.
