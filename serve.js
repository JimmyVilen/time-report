// Production entry for the Docker/Node deployment. TanStack Start builds a
// fetch handler at dist/server/server.js; this wraps it with static asset
// serving for dist/client. A Vercel deployment replaces this file with the
// platform adapter and is not affected by it.
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import startServer from './dist/server/server.js'

const port = Number(process.env.PORT ?? 3000)
const app = new Hono()

app.use('/assets/*', async (context, next) => {
  context.header('cache-control', 'public, max-age=31536000, immutable')
  await next()
})
app.use('*', serveStatic({ root: './dist/client' }))
app.all('*', (context) => startServer.fetch(context.req.raw))

const server = serve({ fetch: app.fetch, port }, (info) => {
  console.info(JSON.stringify({ event: 'server_started', port: info.port }))
})

let shuttingDown = false
function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  console.info(JSON.stringify({ event: 'shutdown', signal }))
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
