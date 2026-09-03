import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createApp } from './app.js'
import { createAuth } from './auth/auth.js'
import { loadConfig } from './config.js'
import { createDatabase } from './db/client.js'

const config = loadConfig()
const { db, client } = createDatabase(config.DATABASE_URL)
const auth = createAuth(db, config)
const api = createApp({
  db,
  auth,
  readiness: async () => {
    await db.execute(sql`select 1`)
  },
})
const app = new Hono()
app.route('/', api)

if (config.NODE_ENV === 'production') {
  const root = '../../Frontend/dist'
  app.use('/assets/*', async (context, next) => {
    context.header('cache-control', 'public, max-age=31536000, immutable')
    await next()
  })
  app.use('/assets/*', serveStatic({ root }))
  app.get('*', async (context, next) => {
    if (context.req.path.startsWith('/api/'))
      return context.json({ error: 'Not found' }, 404)
    context.header('cache-control', 'no-cache')
    return serveStatic({ root, path: 'index.html' })(context, next)
  })
}

const server = serve({ fetch: app.fetch, port: config.PORT }, (info) => {
  console.info(JSON.stringify({ event: 'server_started', port: info.port }))
})
let shuttingDown = false
function shutdown(signal: string): void {
  if (shuttingDown) return
  shuttingDown = true
  console.info(JSON.stringify({ event: 'shutdown', signal }))
  server.close(() => {
    void client.end({ timeout: 5 }).then(() => process.exit(0))
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => {
  shutdown('SIGTERM')
})
process.on('SIGINT', () => {
  shutdown('SIGINT')
})
