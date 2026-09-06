import { sql } from 'drizzle-orm'
import { createApp } from './app'
import { createAuth } from './auth/auth'
import { loadConfig } from './config'
import { createDatabase } from './db/client'

// The whole server graph is built lazily and memoised on first request. Building
// it at module scope would make importing this file throw during `vite build`
// (no DATABASE_URL) and would open a fresh connection pool on every HMR reload.
let instance: ReturnType<typeof build> | undefined

function build() {
  loadDotEnv()
  const config = loadConfig()
  const { db, client } = createDatabase(config.DATABASE_URL)
  const auth = createAuth(db, config)
  const app = createApp({
    db,
    auth,
    readiness: async () => {
      await db.execute(sql`select 1`)
    },
  })
  return { config, db, client, auth, app }
}

export function getServer() {
  instance ??= build()
  return instance
}

export function handleRequest(request: Request): Promise<Response> | Response {
  return getServer().app.fetch(request)
}

// Vite does not populate `process.env` from `.env` for server-side code the way
// `node --env-file` did for the standalone backend, so load it here. In hosted
// environments the file is absent and the platform supplies the variables.
function loadDotEnv(): void {
  if (process.env['DATABASE_URL']) return
  try {
    process.loadEnvFile('.env')
  } catch {
    // No .env on disk: rely on the ambient environment.
  }
}
