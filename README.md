# TimeReport

Time reporting app built with Hono, PostgreSQL, React and TypeScript. The legacy ASP.NET Core/SQLite backend remains in `Backend/TimeReport.Api` during the rollback period.

## Tech Stack

- **Backend**: Node.js 24, Hono, Drizzle ORM, PostgreSQL
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query
- **Auth**: Better Auth, BCrypt and HttpOnly/SameSite=Lax cookie sessions
- **Deploy**: Single non-root Node container serving the Vite build

## Getting Started

### Requirements

- Node.js 24+
- Docker for local PostgreSQL

### Running in Development

**Terminal 1 – PostgreSQL:**
```bash
docker run --rm --name timereport-postgres -e POSTGRES_USER=timereport -e POSTGRES_PASSWORD=timereport -e POSTGRES_DB=timereport -p 5432:5432 postgres:17-alpine
```

**Terminal 2 – Backend:**
```bash
cd Backend/TimeReport.Api.Ts
npm install
# Export the values shown in .env.example, then:
npm run db:migrate
npm run dev
```

**Terminal 3 – Frontend:**
```bash
cd Frontend
npm install
npm run dev
# Frontend at http://localhost:5173 (proxies /api → Hono :3000)
```

Open http://localhost:5173 in your browser.

### Building for Production

```bash
cd Frontend && npm run build
cd ../Backend/TimeReport.Api.Ts && npm run build
```

### Docker

```bash
# Build and run
BETTER_AUTH_SECRET="replace-with-at-least-32-random-characters" docker compose up --build

# App available at http://localhost:8080
```

The Compose migration service exits before the app starts. Production injects a Supabase `DATABASE_URL`; database backup/restore is infrastructure, not a web endpoint.

## Project Structure

```
src/
├─ Backend/
│  ├─ TimeReport.Api/          ASP.NET Core API
│  │  ├─ Controllers/          API endpoints
│  │  ├─ Data/
│  │  │  ├─ Entities/          EF Core entities
│  │  │  └─ AppDbContext.cs
│  │  ├─ Services/             DurationParser, TimeEntryResolver, JiraService
│  │  └─ wwwroot/              Vite build (auto-generated)
│  └─ TimeReport.Api.Tests/    Unit tests
└─ Frontend/
   └─ src/
      ├─ api/                  Fetch wrappers per resource
      ├─ components/           Shared UI components
      ├─ features/             Feature modules (dashboard, projects, tasks...)
      └─ lib/                  Helper functions (durationParser, dateUtils...)
```

## API Endpoints

### Auth (no authentication required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/setup-status | Are there any users? |
| POST | /api/auth/setup | Create first admin user |
| POST | /api/auth/login | Log in |
| POST | /api/auth/logout | Log out |
| POST | /api/auth/register | Register new user |
| GET | /api/auth/me | Get current user |

### Time Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/time-entries?date= | Get entries for a date |
| POST | /api/time-entries | Create entry (prepend, position 0) |
| PUT | /api/time-entries/{id} | Update |
| DELETE | /api/time-entries/{id} | Delete |
| POST | /api/time-entries/{id}/duplicate | Duplicate |
| POST | /api/time-entries/reorder | Reorder |
| GET | /api/time-entries/weekly-summary?date= | Weekly summary (Mon–Sun) |
| POST | /api/time-entries/{id}/push-to-jira | Push worklog to Jira |
| GET | /api/time-entries/export?from=&to= | CSV export |

## Known Differences from Rails Version

| Rails | New Stack | Notes |
|---|---|---|
| Turbo Streams | TanStack Query invalidation | Automatic re-fetch on mutation |
| Hotwire drag-and-drop | @dnd-kit/sortable | Similar UX |
| EasyMDE markdown editor | Simple textarea + react-markdown | Can be extended with react-simplemde-editor |
| I18n day names | Intl.DateTimeFormat('sv-SE') | Built into the browser |
| Rails flash messages | Inline error messages in forms | |
| Server-side markdown | react-markdown (client-side) | |

## Tests

```bash
# Run unit tests
cd Backend/TimeReport.Api.Ts
npm run typecheck
npm run lint
npm test
```

Tests cover:
- `DurationParser` – parsing "1h 30m", "90m", "1.5h" etc.
- `TimeEntryResolverService` – start+end→duration, start+duration→end, etc.
