import { randomUUID } from 'node:crypto'
import { Hono } from 'hono'
import type { Database } from './db/client.js'
import type { Auth } from './auth/auth.js'
import { authRoutes } from './auth/routes.js'
import { requireSession, type AppEnv } from './auth/middleware.js'
import { dailyNoteRoutes } from './routes/daily-notes.js'
import { plannerBlockRoutes } from './routes/planner-blocks.js'
import { tagRoutes } from './routes/tags.js'
import { profileRoutes } from './routes/profile.js'
import { projectRoutes } from './routes/projects.js'
import { taskRoutes } from './routes/tasks.js'
import { timeEntryRoutes } from './routes/time-entries.js'

export interface AppDependencies {
  db?: Database
  auth?: Auth
  readiness?: () => Promise<void>
}

export function createApp(dependencies: AppDependencies = {}) {
  const app = new Hono<AppEnv>()
  app.use('*', async (context, next) => {
    const requestId = context.req.header('x-request-id') || randomUUID()
    context.header('x-request-id', requestId)
    const startedAt = performance.now()
    await next()
    console.info(
      JSON.stringify({
        requestId,
        method: context.req.method,
        path: context.req.path,
        status: context.res.status,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    )
  })
  app.onError((error, context) => {
    console.error(
      JSON.stringify({
        requestId: context.res.headers.get('x-request-id'),
        error: error.message,
      }),
    )
    return context.json({ error: 'Internal server error' }, 500)
  })
  app.get('/health', (context) => context.json({ status: 'ok' }))
  app.get('/ready', async (context) => {
    try {
      if (dependencies.readiness) await dependencies.readiness()
      return context.json({ status: 'ready' })
    } catch {
      return context.json({ status: 'not_ready' }, 503)
    }
  })
  if (dependencies.db && dependencies.auth) {
    app.route('/api/auth', authRoutes(dependencies.db, dependencies.auth))
    app.use('/api/tags/*', requireSession(dependencies.auth))
    app.use('/api/daily-notes/*', requireSession(dependencies.auth))
    app.use('/api/planner-blocks/*', requireSession(dependencies.auth))
    app.use('/api/profile/*', requireSession(dependencies.auth))
    app.use('/api/projects/*', requireSession(dependencies.auth))
    app.use('/api/tasks/*', requireSession(dependencies.auth))
    app.use('/api/time-entries/*', requireSession(dependencies.auth))
    app.route('/api/tags', tagRoutes(dependencies.db))
    app.route('/api/daily-notes', dailyNoteRoutes(dependencies.db))
    app.route('/api/planner-blocks', plannerBlockRoutes(dependencies.db))
    app.route('/api/profile', profileRoutes(dependencies.db))
    app.route('/api/projects', projectRoutes(dependencies.db))
    app.route('/api/tasks', taskRoutes(dependencies.db))
    app.route('/api/time-entries', timeEntryRoutes(dependencies.db))
  }
  app.all('/api/*', (context) => context.json({ error: 'Not found' }, 404))
  return app
}

export type AppType = ReturnType<typeof createApp>
