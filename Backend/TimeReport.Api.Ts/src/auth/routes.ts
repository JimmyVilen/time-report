import { count, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import type { Database } from '../db/client.js'
import { users } from '../db/schema.js'
import type { Auth } from './auth.js'

const credentials = z.object({ email: z.email(), password: z.string().min(1) })
const registration = credentials
  .extend({ passwordConfirmation: z.string() })
  .refine((body) => body.password === body.passwordConfirmation, {
    message: 'Passwords do not match',
  })

export function authRoutes(db: Database, auth: Auth) {
  const app = new Hono()
  app.get('/setup-status', async (context) => {
    const rows = await db.select({ value: count() }).from(users)
    return context.json({ usersExist: (rows[0]?.value ?? 0) > 0 })
  })
  app.post('/setup', async (context) => {
    const parsed = registration.safeParse(
      await context.req.json().catch(() => null),
    )
    if (!parsed.success)
      return context.json({ error: authValidationMessage(parsed.error) }, 400)
    if (parsed.data.password.length < 8)
      return context.json(
        { error: 'Password must be at least 8 characters' },
        400,
      )
    let response: Response | undefined
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(846372910)`)
      const rows = await tx.select({ value: count() }).from(users)
      if ((rows[0]?.value ?? 0) > 0) return
      response = await auth.api.signUpEmail({
        asResponse: true,
        headers: context.req.raw.headers,
        body: {
          email: parsed.data.email.trim().toLowerCase(),
          password: parsed.data.password,
          name: nameFromEmail(parsed.data.email),
        },
      })
      if (response.ok) {
        const body = (await response.clone().json()) as {
          user?: { id?: string | number }
        }
        if (body.user?.id !== undefined)
          await tx
            .update(users)
            .set({ isAdmin: true })
            .where(eq(users.id, Number(body.user.id)))
      }
    })
    if (!response)
      return context.json({ error: 'Setup already completed' }, 409)
    return legacyAuthResponse(response, { isAdmin: true })
  })
  app.post('/register', async (context) => {
    const rows = await db.select({ value: count() }).from(users)
    if ((rows[0]?.value ?? 0) === 0) return context.body(null, 403)
    const parsed = registration.safeParse(
      await context.req.json().catch(() => null),
    )
    if (!parsed.success)
      return context.json({ error: authValidationMessage(parsed.error) }, 400)
    if (parsed.data.password.length < 8)
      return context.json(
        { error: 'Password must be at least 8 characters' },
        400,
      )
    const response = await auth.api.signUpEmail({
      asResponse: true,
      headers: context.req.raw.headers,
      body: {
        email: parsed.data.email.trim().toLowerCase(),
        password: parsed.data.password,
        name: nameFromEmail(parsed.data.email),
      },
    })
    return legacyAuthResponse(response)
  })
  app.post('/login', async (context) => {
    const parsed = credentials.safeParse(
      await context.req.json().catch(() => null),
    )
    if (!parsed.success)
      return context.json({ error: 'Invalid email or password' }, 401)
    const response = await auth.api.signInEmail({
      asResponse: true,
      headers: context.req.raw.headers,
      body: {
        email: parsed.data.email.trim().toLowerCase(),
        password: parsed.data.password,
      },
    })
    if (!response.ok)
      return response.status === 401
        ? context.json({ error: 'Invalid email or password' }, 401)
        : response
    return legacyAuthResponse(response)
  })
  app.post('/logout', async (context) =>
    auth.api.signOut({ asResponse: true, headers: context.req.raw.headers }),
  )
  app.get('/me', async (context) => {
    const session = await auth.api.getSession({
      headers: context.req.raw.headers,
    })
    if (!session) return context.body(null, 401)
    const id = Number(session.user.id)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
    return user ? context.json(userDto(user)) : context.body(null, 401)
  })
  app.all('/better-auth/*', (context) => auth.handler(context.req.raw))
  return app
}

function authValidationMessage(error: z.ZodError): string {
  return error.issues.some(
    (issue) => issue.message === 'Passwords do not match',
  )
    ? 'Passwords do not match'
    : 'Invalid request'
}

function nameFromEmail(email: string): string {
  return (email.split('@')[0] ?? email).replace(/[._]/g, ' ')
}

async function legacyAuthResponse(
  response: Response,
  overrides: Record<string, unknown> = {},
): Promise<Response> {
  if (!response.ok) {
    const body = (await response
      .clone()
      .json()
      .catch(() => ({}))) as { message?: string; code?: string }
    const duplicate =
      response.status === 422 || body.code?.includes('USER_ALREADY_EXISTS')
    return Response.json(
      {
        error: duplicate
          ? 'Email already in use'
          : (body.message ?? 'Authentication failed'),
      },
      { status: duplicate ? 400 : response.status, headers: response.headers },
    )
  }
  const body = (await response.clone().json()) as {
    user: Record<string, unknown>
  }
  const user = body.user
  return Response.json(
    {
      id: Number(user['id']),
      email: user['email'],
      name: user['name'] ?? null,
      isAdmin: user['isAdmin'] ?? false,
      avatarUrl: user['image'] ?? null,
      jiraUrl: user['jiraUrl'] ?? null,
      jiraEmail: user['jiraEmail'] ?? null,
      jiraApiTokenSet: false,
      jiraIntegrationSystem: user['jiraIntegrationSystem'] ?? 'JIRA_CLOUD',
      ...overrides,
    },
    { headers: response.headers },
  )
}

export function userDto(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    avatarUrl: user.avatarUrl,
    jiraUrl: user.jiraUrl,
    jiraEmail: user.jiraEmail,
    jiraApiTokenSet: !!user.jiraApiToken,
    jiraIntegrationSystem: user.jiraIntegrationSystem,
  }
}
