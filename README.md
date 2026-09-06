# TimeReport

Time reporting app built as a single TanStack Start application with a Hono API.

## Tech Stack

- **Framework**: TanStack Start (React 19, TanStack Router, Vite 8)
- **API**: Hono, mounted as a server route at `/api/*`
- **Data**: Drizzle ORM, PostgreSQL
- **Auth**: Better Auth, BCrypt and HttpOnly/SameSite=Lax cookie sessions
- **UI**: Tailwind CSS v4, TanStack Query, Lexical
- **Deploy**: Single non-root Node container

## Architecture

One Vite app builds both halves:

- `src/routes/` — file-based routes. `_app.tsx` is the authenticated layout and
  holds the session guard; `api/$.ts` is a splat server route that hands every
  `/api/*` request to the Hono app untouched.
- `src/server/` — the API: Hono routes, Drizzle schema, Better Auth, services.
  Server-only; the Start plugin keeps it out of the client bundle.
- `src/features/`, `src/components/`, `src/api/` — the UI and its fetch wrappers.

The API contract is unchanged from when the backend was a standalone server;
see [docs/contract-inventory.md](docs/contract-inventory.md).

## Getting Started

### Requirements

- Node.js 24+
- Docker for local PostgreSQL

**Terminal 1 – PostgreSQL:**

```bash
docker compose up -d db
```

**Terminal 2 – app:**

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Open http://localhost:5173. There is no proxy any more: the UI and the API are
served from the same origin.

### Environment

`.env` configures the Node process (`DATABASE_URL`, `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `NODE_ENV`, `PORT`). Vite deliberately does **not** read it —
`vite.config.ts` points `envDir` at the empty `env/` directory, because a
`NODE_ENV=development` line in `.env` would otherwise make `vite build` emit a
development bundle. Client-side `VITE_*` variables, if ever needed, belong in
`env/`.

### Building for Production

```bash
npm run build   # -> dist/client and dist/server
npm start       # serve.js serves dist/client and delegates to dist/server
```

### Docker

```bash
BETTER_AUTH_SECRET="replace-with-at-least-32-random-characters" docker compose up --build
# App available at http://localhost:8080
```

## Checks

```bash
npm run typecheck   # app project, then the stricter server project
npm run lint
npm test            # set TEST_DATABASE_URL for the PostgreSQL contract tests
```

`tsconfig.json` covers the UI; `tsconfig.server.json` adds the stricter flags
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noPropertyAccessFromIndexSignature`) that `src/server`, `test` and `scripts`
were written against. ESLint mirrors the same split.
