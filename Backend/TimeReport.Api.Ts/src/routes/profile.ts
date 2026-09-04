import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import type { AppEnv } from '../auth/middleware.js'
import { userDto } from '../auth/routes.js'
import type { Database } from '../db/client.js'
import { accounts, users } from '../db/schema.js'

const bodySchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().optional(),
  jiraUrl: z.string().optional(),
  jiraEmail: z.string().optional(),
  jiraApiToken: z.string().optional(),
  jiraIntegrationSystem: z.string().optional(),
  password: z.string().optional(),
  passwordConfirmation: z.string().optional(),
})
const nullable = (value: string) => value.trim() || null

export function profileRoutes(db: Database) {
  const app = new Hono<AppEnv>()
  app.get('/', async (c) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, c.get('currentUserId')))
      .limit(1)
    return user ? c.json(userDto(user)) : c.body(null, 404)
  })
  app.patch('/', async (c) => {
    const parsed = bodySchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
    const body = parsed.data
    if (body.password !== undefined && body.password !== '') {
      if (body.password !== body.passwordConfirmation)
        return c.json({ error: 'Passwords do not match' }, 400)
      if (body.password.length < 8)
        return c.json({ error: 'Password must be at least 8 characters' }, 400)
    }
    const userId = c.get('currentUserId')
    await db.transaction(async (tx) => {
      const updates: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      }
      if (body.name !== undefined) updates.name = body.name.trim()
      if (body.avatarUrl !== undefined)
        updates.avatarUrl = nullable(body.avatarUrl)
      if (body.jiraUrl !== undefined) updates.jiraUrl = nullable(body.jiraUrl)
      if (body.jiraEmail !== undefined)
        updates.jiraEmail = nullable(body.jiraEmail)
      if (body.jiraApiToken !== undefined)
        updates.jiraApiToken = nullable(body.jiraApiToken)
      if (body.jiraIntegrationSystem !== undefined)
        updates.jiraIntegrationSystem = body.jiraIntegrationSystem
      if (body.password) {
        const passwordHash = await hash(body.password, 12)
        updates.passwordHash = passwordHash
        await tx
          .update(accounts)
          .set({ password: passwordHash, updatedAt: new Date() })
          .where(
            and(
              eq(accounts.userId, userId),
              eq(accounts.providerId, 'credential'),
            ),
          )
      }
      await tx.update(users).set(updates).where(eq(users.id, userId))
    })
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return user ? c.json(userDto(user)) : c.body(null, 404)
  })
  return app
}
