Intentionally empty: `vite.config.ts` sets `envDir` here so that Vite never
loads the runtime `.env` at the repository root. That file configures the Node
server (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `NODE_ENV`), and a
`NODE_ENV=development` line in it would make `vite build` produce a development
bundle. Add client-side `VITE_*` variables here if the app ever needs any.
