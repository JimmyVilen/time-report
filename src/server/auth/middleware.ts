import { createMiddleware } from 'hono/factory'
import type { Auth } from './auth'

export interface AppEnv {
  Variables: { currentUserId: number }
}

export function requireSession(auth: Auth) {
  return createMiddleware<AppEnv>(async (context, next) => {
    const session = await auth.api.getSession({
      headers: context.req.raw.headers,
    })
    const currentUserId = Number(session?.user.id)
    if (!session || !Number.isSafeInteger(currentUserId) || currentUserId < 1)
      return context.json({ error: 'Unauthorized' }, 401)
    context.set('currentUserId', currentUserId)
    await next()
  })
}
