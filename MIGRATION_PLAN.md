# Migreringsplan: ASP.NET Core/SQLite → Hono/PostgreSQL

## Status och fattade beslut

Detta är den genomförbara planen för att skriva om TimeReport-backenden och samtidigt flytta
databasen till PostgreSQL.

| Område | Beslut |
|---|---|
| Runtime | Node.js 24 LTS |
| HTTP | Hono |
| ORM och migrationer | Drizzle ORM och versionsstyrda SQL-migrationer |
| Databas lokalt/CI | PostgreSQL i en tillfällig container |
| Databas produktion | Supabase-hostad PostgreSQL |
| Auth | Better Auth med cookie-sessioner och Drizzle-adapter |
| Lösenord | BCrypt, kompatibelt med befintliga cost-12-hashar |
| Validering | Zod |
| API-typer | Hono RPC och exporterad `AppType` |
| Tester | Vitest för backend/kontrakt och Playwright för E2E |
| RLS | Inte i första versionen |
| Behörighet | Explicita `user_id`-filter och ägarskapskontroller i Hono |
| Backup/restore | Infrastrukturansvar i Supabase, inte webb-endpoints |
| Produktionsbyte | Samlad cutover, ingen endpointvis proxy mellan .NET och Node |

RLS kan utvärderas senare som defense in depth. Applikationsfiltren ska behållas även om RLS
införs i framtiden.

## Målbild

```text
Utveckling
Browser → Vite :5173 → /api proxy → Hono :3000 → lokal PostgreSQL-container

Produktion
Browser → Hono :8080 ┬→ /api/* → Supabase PostgreSQL
                     └→ React/Vite dist + SPA fallback
```

Frontend och backend fortsätter ha samma origin i produktion. Vite körs bara under utveckling;
i produktion serverar Hono den byggda SPA:n.

## Omfattning som måste bevaras

Omskrivningen omfattar mer än CRUD:

- Cookie-baserad login, logout, registrering, setup av första admin och aktuell användare.
- Ägarskapskontroll för samtliga användarägda resurser.
- Projekt, tasks, tags och task default tags.
- Tidsposter inklusive create, update, delete, duplicate, reorder och weekly summary.
- Daily notes och planner blocks.
- Profil och Jira-inställningar.
- Jira issue lookup samt create/delete av worklogs.
- CSV- och Markdown-exporter.
- Samma statuskoder, JSON-format och felbeteende som frontend förväntar sig.
- Servering av SPA med `no-cache` för `index.html` och immutable cache för hashade assets.

SQLite-specifik full backup/import i webbappen ska inte portas till PostgreSQL. CSV- och
Markdown-exporterna är produktfunktioner och ska finnas kvar. Databasbackup, retention, PITR
och restore hanteras som infrastruktur i Supabase.

## Katalogstruktur under migreringen

```text
Backend/
├─ TimeReport.Api/                 # befintlig .NET-backend, orörd för rollback
└─ TimeReport.Api.Ts/
   ├─ src/
   │  ├─ app.ts                    # runtime-oberoende Hono-app
   │  ├─ index.node.ts             # Node-server och graceful shutdown
   │  ├─ config.ts
   │  ├─ auth/
   │  ├─ contracts/
   │  ├─ db/
   │  ├─ routes/
   │  └─ services/
   ├─ scripts/
   │  └─ db/
   ├─ test/
   ├─ drizzle.config.ts
   ├─ package.json
   └─ tsconfig.json
```

Efter en stabil observationsperiod tas C#-projektet bort och TypeScript-paketet flyttas i en
separat mekanisk ändring:

```text
Backend/
├─ src/
├─ scripts/
├─ test/
├─ drizzle.config.ts
├─ package.json
└─ tsconfig.json
```

Flytten ska inte göras samtidigt med produktionsbytet.

---

## Fas 0 — Säkra nuvarande beteende

### Arbete

- Inventera alla nuvarande routes, request bodies, query-parametrar, statuskoder och response
  shapes.
- Skapa en sanerad SQLite-fixture med minst en admin och två vanliga användare.
- Lägg till integrationstester mot .NET-API:t för success-, validation-, not-found- och
  unauthorized-fall.
- Lägg cross-user-tester som försöker läsa och ändra en annan användares resurser.
- Spara representativa golden responses för jämförelse med Hono.
- Utöka testerna för `DurationParser` och `TimeEntryResolverService` med gränsfall.
- Dokumentera verkliga SQLite-format för samtliga datum- och tidskolumner.
- Ta en verifierad `VACUUM INTO`-backup av produktionsdatabasen inför framtida repetitioner.

### Exit-kriterium

Det finns en automatiserad kontraktsbaslinje och en säker fixture som kan användas utan
produktionsdata.

## Fas 1 — Skapa TypeScript- och Hono-skelettet

### Arbete

- Skapa `Backend/TimeReport.Api.Ts` utan att ändra .NET-projektet.
- Konfigurera strict TypeScript, lint, formattering och Vitest.
- Skapa `app.ts` som exporterar Hono-appen utan att starta en port.
- Skapa `index.node.ts` med `@hono/node-server` och kontrollerad `SIGTERM`/`SIGINT`.
- Validera miljövariabler vid startup med Zod.
- Lägg till request-id, strukturerad loggning och central felhantering.
- Lägg till `/health` och `/ready`; readiness ska kunna verifiera PostgreSQL.
- Ändra Vites utvecklingsproxy från .NET-porten till Hono-porten.
- Servera Vite `dist` i produktion och implementera SPA-fallback efter alla `/api`-routes.
- Se till att okända `/api/*` ger JSON-404 och aldrig `index.html`.

### Obligatoriska miljövariabler

```text
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NODE_ENV
PORT
```

Tester använder en separat `TEST_DATABASE_URL`. Testverktyg får aldrig falla tillbaka till
`DATABASE_URL`.

### Exit-kriterium

En tom Hono-app kan byggas, testas och köras i Docker samt servera frontendens produktionsbuild.

## Fas 2 — Modellera PostgreSQL-schemat

### Principer

- Drizzle-schema och versionsstyrda migrationer är source of truth.
- Supabase Dashboard används inte för manuella schemaändringar.
- `drizzle-kit push` används inte mot produktion.
- Befintliga numeriska id:n bevaras.
- Alla foreign keys, unique constraints och delete-regler återskapas uttryckligt.
- Runtime och migrationer använder olika databasroller/credentials när miljön stödjer det.

### Typmappning

Verifiera först de verkliga SQLite-värdena och lås därefter följande avsikt:

| SQLite-data | PostgreSQL-mål | Regel |
|---|---|---|
| Numeriska primary keys | `integer generated by default as identity` | Gamla id:n får sättas explicit vid migrering |
| `date` som `yyyy-MM-dd` | PostgreSQL `date`, Drizzle string mode | Förblir kalenderdatum utan tidszon |
| `start_time`, `end_time` | `timestamp without time zone` | Bevarar lokal wall-clock-tid |
| `created_at`, `updated_at`, `pushed_at` | `timestamptz` | Normaliseras och returneras som UTC |
| `last_used_at`, `deleted_at` | `timestamptz` | Nuvarande kod skriver UTC |
| SQLite boolean som `INTEGER` | PostgreSQL `boolean` | Konverteras explicit |
| Duration och position | `integer` | Inga flyttal introduceras |

Om verkliga SQLite-värden motsäger tabellen ska typen ändras innan första migrationen, inte
kompenseras med implicit JavaScript-parsing.

### Constraints som måste verifieras

- Unique email på `users`.
- Unique `(user_id, name)` på `projects` och `tags`.
- Unique `(user_id, date)` på `daily_notes`.
- Sammansatta primary keys i `time_entry_tags` och `task_default_tags`.
- Cascade från user till användarägda data.
- `tasks.project_id` använder `ON DELETE SET NULL`.
- Relevanta index börjar med `user_id` där queries alltid filtrerar per användare.

### Exit-kriterium

Alla Drizzle-migrationer kan bygga en tom PostgreSQL-databas från noll och schemat klarar
automatiska constraint- och relationstester.

## Fas 3 — Databasscripts och reproducerbara miljöer

Skapa följande kommandon:

```json
{
  "scripts": {
    "db:migrate": "tsx scripts/db/migrate.ts",
    "db:seed": "tsx scripts/db/seed.ts",
    "db:seed:test": "tsx scripts/db/seed-test.ts",
    "db:reset:test": "tsx scripts/db/reset-test.ts",
    "db:bootstrap": "npm run db:migrate && npm run db:seed"
  }
}
```

### `db:migrate`

- Kör granskade Drizzle-migrationer.
- Kan användas lokalt, i CI, staging och produktion.
- Loggar vilka migrationer som appliceras och avbryter tydligt vid fel.

### `db:seed`

- Lägger endast in ofarlig standard-/referensdata.
- Är idempotent och skriver inte över användardata.
- Skapar inga tabeller, användare med känt lösenord eller hemligheter.
- Första admin skapas genom appens setup-flöde.

### `db:seed:test`

- Skapar deterministisk data för minst en admin och två användare.
- Täcker alla domäntabeller, relationer, null-fall och arkiverade/raderade tillstånd.
- Skapar Better Auth-kompatibla credential accounts.
- Får endast använda `TEST_DATABASE_URL` och `NODE_ENV=test`.

### `db:reset:test`

- Återskapar endast en uttryckligen identifierad lokal/testdatabas.
- Kör därefter migrationer och test-seed.
- Avbryter om host/databasnamn liknar konfigurerad staging eller produktion.
- Får aldrig ta emot eller följa en länk till Supabase-produktion.

### Lokal och CI-körning

```text
Starta ren PostgreSQL-container
→ db:reset:test
→ starta Hono
→ starta Vite eller servera byggd frontend
→ kör Playwright
→ kasta containern
```

Databasberoende E2E körs seriellt eller med en separat databas/schema per worker.

### Exit-kriterium

En ny utvecklare och CI kan återskapa både en tom utvecklingsdatabas och en komplett
testdatabas utan manuella steg.

## Fas 4 — Better Auth och befintliga användare

### Schema och konfiguration

- Använd Better Auths Drizzle-adapter för PostgreSQL.
- Återanvänd tabellen `users` och dess numeriska `id`.
- Låt databasen generera user-id men använd sträng-/UUID-id:n för account/session/verification.
- Mappa namn, email, avatar och timestamps till befintliga user-fält.
- Definiera `is_admin` och Jira-fält som serverägda; `jira_api_token` får aldrig returneras från
  auth-API:t.
- Konfigurera HttpOnly, `SameSite=Lax`, Secure i produktion och ungefär 30 dagars session.
- Lägg Hono middleware som ger routes ett typat numeriskt `currentUserId`.

### Lösenordsmigrering

- Konfigurera custom password hash/verify med BCrypt cost 12.
- Generera Better Auths account-schema från en pinnad version.
- Skapa ett credential account per befintlig user.
- Kopiera befintlig `users.password_hash` till account-postens password-fält.
- Testa minst en verklig, sanerad BCrypt-hash från nuvarande implementation.
- Behåll den gamla kolumnen under rollbackperioden; ta bort den i en senare migration.

### Beteende

- Behåll `GET /api/auth/setup-status`.
- Behåll ett atomiskt setup-flöde där endast första användaren blir admin.
- Bevara initialt nuvarande registreringsregel: registrering är tillgänglig efter setup.
- Uppdatera frontendens auth-wrapper till Better Auth utan att skriva om featurekomponenterna.
- Acceptera en planerad engångsutloggning vid cutover; ASP.NET-cookies migreras inte.

### Exit-kriterium

Befintliga och nya användare kan logga in, logga ut och läsa sin profil. Två samtidiga
setup-anrop kan inte skapa två första administratörer.

## Fas 5 — Migrera SQLite-data till PostgreSQL

Skapa `scripts/db/migrate-sqlite-to-postgres.ts` som körs manuellt och inte följer med i
runtime-imagen.

### Krav

- SQLite-källan öppnas read-only.
- PostgreSQL-målet måste vara tomt men färdigmigrerat.
- All data flyttas i foreign-key-ordning i en PostgreSQL-transaktion.
- Numeriska id:n bevaras exakt.
- Boolean och datum/tid konverteras uttryckligt.
- Better Auth credential accounts skapas från BCrypt-hasharna.
- PostgreSQL identity-sekvenser återställs efter explicita id-inserts.
- Scriptet avbryter om målet redan innehåller domändata.
- Dry-run läser och validerar utan att skriva.
- Loggar får endast innehålla antal och id:n, aldrig lösenordshashar eller Jira-token.

### Efterkontroller

- Radantal per tabell stämmer.
- Inga orphan records finns.
- Min/max-id och nästa sekvensvärde är korrekta.
- Representativa tidsvärden och durationsresultat är identiska.
- Varje lösenordsanvändare har exakt ett credential account.
- Login fungerar med befintligt lösenord.
- Ett urval av API/golden responses matchar .NET-versionen.

### Exit-kriterium

Migreringen kan upprepas från samma SQLite-backup till en ny tom PostgreSQL-databas och ger
samma verifieringsresultat varje gång.

## Fas 6 — Porta domänlogik och API

### Först: rena tjänster

Porta och golden-testa:

1. `DurationParser`.
2. `TimeEntryResolverService`.
3. Jira issue-key parsing och ADF-textutvinning.
4. Jira worklog-datumformat.
5. CSV escaping och exportformat.

Undvik implicit `Date.parse`. Datum och klockslag valideras med explicita Zod-format.

### Därefter: routes i riskordning

1. Tags.
2. Projects.
3. Tasks och task default tags.
4. Daily notes.
5. Planner blocks.
6. Profile.
7. Time entries.
8. Jira-anrop.
9. CSV- och Markdown-export.

### Regel för varje databasoperation

- `currentUserId` kommer endast från verifierad Better Auth-session.
- `user_id` ingår i själva SQL-villkoret för select/update/delete.
- Alla inkommande relations-id:n verifieras tillhöra samma användare.
- Join-tabeller får inte skapa relationer mellan två användares resurser.
- Adminstatus läses server-side från databasen.
- Path, query och body valideras med Zod.
- Response shape, casing, null-värden och statuskod kontraktstestas.

### Tidsposternas särskilda krav

- Create flyttar positioner, skapar entry, sätter tags och uppdaterar task atomiskt.
- Duplicate flyttar positioner samt kopierar entry och tags atomiskt.
- Reorder påverkar endast aktuell användares entries.
- Start/slut har företräde framför explicit duration i effective duration.
- Weekly summary fortsätter vara måndag–söndag med korrekt ISO-vecka.
- Jira worklog-id skrivs först efter lyckat Jira-svar.
- Jira-delete vid update fortsätter vara best effort.

### Exit-kriterium

Alla kontraktstester körs mot Hono/PostgreSQL och ger avsedda resultat. Inga routes använder
SQLite eller EF-semantik indirekt.

## Fas 7 — Typad frontendklient

- Exportera `AppType` från den sammansatta Hono-appen.
- Skapa `hc<AppType>` med relative/same-origin base URL och inkluderade credentials.
- Behåll befintliga funktioner i `Frontend/src/api/*` som tunna wrappers under övergången.
- Behåll TanStack Query; Hono RPC ersätter endast transporttypningen.
- Behåll central `ApiError`-normalisering och nuvarande 401-navigation.
- Låt filnedladdningar använda vanlig `fetch` om det ger tydligare blob/stream-hantering.
- Ta bort manuella DTO-interface resursvis, inte i en enda stor diff.

### Exit-kriterium

Frontend bygger utan duplicerade request-/response-typer för migrerade endpoints och hela
Playwright-sviten passerar.

## Fas 8 — Infrastruktur och container

- Bygg frontend och backend i separata Docker build stages.
- Kopiera endast produktionsartefakter och dependencies till Node 24-runtime-imagen.
- Kör processen som icke-root.
- Exponera endast Hono-port 8080.
- Montera ingen lokal databas- eller Dropbox-backupvolym.
- Injicera Supabase `DATABASE_URL` som hemlighet.
- Verifiera TLS, connection pool limits och graceful shutdown.
- Kör Drizzle-migrationer som ett explicit deploy-steg, inte från varje parallell appinstans.
- Konfigurera Supabase backup/retention/PITR enligt vald plan.
- Dokumentera och öva restore mot separat projekt/databas.
- Lägg larm/loggning för databasanslutningsfel och misslyckade migrationer.

Appens admin-endpoint för full SQLite-export/import tas bort. SQLite→PostgreSQL-scriptet är ett
separat cutoververktyg, inte en webbfunktion.

### Exit-kriterium

Produktionslik image kan köras mot en stagingdatabas, servera SPA:n, hantera auth och klara E2E.
En dokumenterad restore har provats utan produktionsdata.

## Fas 9 — Repetition och produktionscutover

### Repetera först

Minst två fullständiga repetitioner ska göras mot färska PostgreSQL-mål från en aktuell kopia av
SQLite-databasen. Mät tidsåtgången och spara verifieringsrapporten.

### Cutover

1. Stoppa skrivtrafik och den gamla containern.
2. Ta en sista verifierad `VACUUM INTO`-backup av SQLite.
3. Skapa/återställ en tom Supabase-måldatabas med granskade Drizzle-migrationer.
4. Kör SQLite→PostgreSQL-migreringen inklusive Better Auth accounts.
5. Kör alla efterkontroller för antal, relationer, sekvenser, tidsvärden och auth.
6. Starta TypeScript-imagen med produktionens `DATABASE_URL` och Better Auth secret/base URL.
7. Logga in på nytt och smoke-testa:
   - dashboard och veckosummering;
   - create/edit/delete/duplicate/reorder;
   - projects, tasks och tags;
   - notes och planner;
   - profil och Jira;
   - CSV/Markdown-export.
8. Kontrollera applikations- och Supabase-loggar, connection count och backupstatus.
9. Öppna skrivtrafiken när kontrollerna passerar.

### Rollback

Under verifieringsfönstret:

1. Stoppa TypeScript-containern och skrivtrafiken omedelbart.
2. Återkoppla den orörda SQLite-filen/pre-cutover-backupen.
3. Starta den pinnade .NET-imagen.
4. Dokumentera att eventuella skrivningar som hunnit göras i PostgreSQL efter cutover inte följer
   med tillbaka.

Håll därför verifieringsfönstret kort och öppna inte skrivtrafik innan kritiska smoke tests har
passerat.

### Exit-kriterium

Node/Hono kör produktionstrafiken mot Supabase, användarna kan logga in med befintliga lösenord
och inga kontrakts-, data- eller säkerhetsavvikelser har upptäckts.

## Fas 10 — Observation och städning

- Behåll .NET-imagen och SQLite-backupen under överenskommen observationsperiod.
- Följ fel, query latency, connection usage och authproblem.
- Ta bort gammal `DatabaseController`, SQLite-backupkod och relaterat UI permanent.
- Ta bort `users.password_hash` först i en separat migration efter att rollbackperioden gått ut.
- Ta bort C#-projektet först när rollback till det inte längre behövs.
- Flytta därefter `Backend/TimeReport.Api.Ts` till den slutliga `Backend/`-strukturen i en separat
  mekanisk commit.
- Uppdatera README, Docker, utvecklingskommandon och arkitekturdokumentation.
- Utvärdera RLS separat efter stabilisering; det är inte en del av denna migration.

## Föreslagen leveransordning

1. Kontraktsbaslinje och fixture-databas.
2. Hono-skelett, config, loggning och statiska filer.
3. PostgreSQL/Drizzle-schema och lokala databasscripts.
4. Better Auth och hashkompatibilitet.
5. SQLite→PostgreSQL-migreringsscript med verifiering.
6. Enkla domänroutes.
7. Time entries och Jira.
8. Typad frontendklient och full E2E.
9. Docker, staging och två cutover-repetitioner.
10. Produktionscutover.
11. Observation och borttagning av .NET/SQLite.

Varje leverans ska vara byggbar och testbar. Undvik att samtidigt ändra UI-design,
affärsregler och API-kontrakt; en avvikelse ska kunna klassificeras som avsedd ändring eller
portningsbugg.

## Definition of Done

- PostgreSQL-schemat kan skapas från noll med versionsstyrda Drizzle-migrationer.
- Lokal/testdatabas kan bootstrapas/resetas utan manuella steg och utan risk för produktion.
- Befintliga id:n, relationer och tidsvärden är bevarade efter migrering.
- Befintliga användare kan logga in med sina BCrypt-lösenord.
- Alla användarägda queries har explicit `user_id`-filter.
- Cross-user reads, writes och relationskopplingar är automatiskt testade.
- Create/duplicate/reorder är transaktionella.
- Jira-beteende och felmappning är verifierade mot fake server och staging.
- Frontend serveras av Hono med korrekt SPA-fallback och cache-policy.
- E2E kör mot lokal, tillfällig PostgreSQL och passerar i CI.
- Supabase backup/restore är konfigurerad, dokumenterad och provad.
- Cutover och rollback har repeterats mot en aktuell datakopia.
- RLS är uttryckligen utanför första leveransen.
