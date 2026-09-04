import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../auth/middleware.js'
import { idParameter, iso } from '../contracts/common.js'
import type { Database } from '../db/client.js'
import { tags } from '../db/schema.js'

const bodySchema = z.object({
  name: z.string(),
  color: z.string().nullable().optional(),
})
const dto = (tag: typeof tags.$inferSelect) => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
  createdAt: iso(tag.createdAt),
  updatedAt: iso(tag.updatedAt),
})

export function tagRoutes(db: Database) {
  const app = new Hono<AppEnv>()
  app.get('/', async (c) =>
    c.json(
      (
        await db
          .select()
          .from(tags)
          .where(eq(tags.userId, c.get('currentUserId')))
          .orderBy(asc(tags.name))
      ).map(dto),
    ),
  )
  app.post('/', async (c) => {
    const parsed = bodySchema.safeParse(await c.req.json().catch(() => null))
    if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
    const name = parsed.data.name.trim()
    if (!name) return c.json({ error: 'Tag name is required' }, 400)
    const duplicate = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        and(
          eq(tags.userId, c.get('currentUserId')),
          sql`lower(${tags.name}) = ${name.toLowerCase()}`,
        ),
      )
      .limit(1)
    if (duplicate.length)
      return c.json({ error: 'A tag with that name already exists' }, 400)
    const [created] = await db
      .insert(tags)
      .values({
        userId: c.get('currentUserId'),
        name,
        color: parsed.data.color?.trim() || null,
      })
      .returning()
    if (!created) throw new Error('Tag insert returned no row')
    return c.json(dto(created))
  })
  app.put('/:id', async (c) => {
    const id = idParameter.safeParse(c.req.param('id'))
    const parsed = bodySchema.safeParse(await c.req.json().catch(() => null))
    if (!id.success || !parsed.success)
      return c.json({ error: 'Invalid request' }, 400)
    const name = parsed.data.name.trim()
    if (!name) return c.json({ error: 'Tag name is required' }, 400)
    const duplicate = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        and(
          eq(tags.userId, c.get('currentUserId')),
          ne(tags.id, id.data),
          sql`lower(${tags.name}) = ${name.toLowerCase()}`,
        ),
      )
      .limit(1)
    if (duplicate.length)
      return c.json({ error: 'A tag with that name already exists' }, 400)
    const [updated] = await db
      .update(tags)
      .set({
        name,
        color: parsed.data.color?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(tags.id, id.data), eq(tags.userId, c.get('currentUserId'))))
      .returning()
    return updated ? c.json(dto(updated)) : c.body(null, 404)
  })
  app.delete('/:id', async (c) => {
    const id = idParameter.safeParse(c.req.param('id'))
    if (!id.success) return c.body(null, 404)
    const removed = await db
      .delete(tags)
      .where(and(eq(tags.id, id.data), eq(tags.userId, c.get('currentUserId'))))
      .returning({ id: tags.id })
    return removed.length ? c.body(null, 204) : c.body(null, 404)
  })
  return app
}
