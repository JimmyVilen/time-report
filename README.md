# TimeReport

Time reporting app built with Hono, PostgreSQL, React and TypeScript.

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
docker compose up -d db
```

**Terminal 2 – Backend:**
```bash
cd Backend
npm install
cp .env.example .env
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
cd ../Backend && npm run build
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
Backend/
├─ src/
│  ├─ routes/                 One Hono router per resource
│  ├─ auth/                   Better Auth setup and session middleware
│  ├─ db/                     Drizzle schema and client
│  ├─ services/               duration, time-entry-resolver, jira, csv
│  └─ index.node.ts           Server entry, static files and SPA fallback
├─ drizzle/                   Generated SQL migrations
├─ scripts/db/                migrate, seed and test-database tooling
├─ test/                      Vitest suites
└─ docs/contract-inventory.md Full API contract
Frontend/
└─ src/
   ├─ api/                    Fetch wrappers per resource
   ├─ components/             Shared UI components
   ├─ features/               Feature modules (dashboard, projects, tasks...)
   └─ lib/                    Helper functions (durationParser, dateUtils...)
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

Projects, tasks, tags, daily notes, planner and profile follow the same shape; see `Backend/docs/contract-inventory.md` for the full contract.

## Tests

```bash
cd Backend
npm run typecheck
npm run lint
npm run format:check
npm test
```

Unit and route tests run without a database. The PostgreSQL contract suite is
skipped unless `TEST_DATABASE_URL` is set; it deliberately refuses to fall back
to `DATABASE_URL`, so it can never touch a development or production database.

```bash
cd Backend
NODE_ENV=test TEST_DATABASE_URL=postgresql://... npm run db:reset:test
NODE_ENV=test TEST_DATABASE_URL=postgresql://... npm test
```
