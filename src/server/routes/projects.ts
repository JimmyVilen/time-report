import { and, asc, desc, eq, isNull, ne, sql } from 'drizzle-orm'
import { Hono, type Context } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../auth/middleware'
import { idParameter, iso } from '../contracts/common'
import type { Database } from '../db/client'
import { projects, tasks } from '../db/schema'
import { extractIssueKey } from '../services/jira'

const bodySchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
})
const assignSchema = z.object({ taskId: z.number().int().positive() })
const projectSelection = {
  id: projects.id,
  userId: projects.userId,
  name: projects.name,
  description: projects.description,
  isArchived: projects.isArchived,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
  taskCount: sql<number>`(select count(*)::int from tasks t where t.project_id = projects.id and t.user_id = projects.user_id and not t.is_archived)`,
  totalMinutes: sql<number>`coalesce((select sum(case when e.start_time is not null and e.end_time is not null then round(extract(epoch from (e.end_time-e.start_time))/60) else coalesce(e.duration_minutes,0) end)::int from time_entries e join tasks t on t.id=e.task_id where t.project_id=projects.id and t.user_id=projects.user_id and e.user_id=projects.user_id),0)`,
}
type ProjectRow = typeof projects.$inferSelect & {
  taskCount: number
  totalMinutes: number
}
const dto = (p: ProjectRow) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  isArchived: p.isArchived,
  userId: p.userId,
  createdAt: iso(p.createdAt),
  updatedAt: iso(p.updatedAt),
  taskCount: p.taskCount,
  totalMinutes: p.totalMinutes,
})

export function projectRoutes(db: Database) {
  const app = new Hono<AppEnv>()
  app.get('/', async (c) =>
    c.json(
      (
        await db
          .select(projectSelection)
          .from(projects)
          .where(eq(projects.userId, c.get('currentUserId')))
          .orderBy(asc(projects.name))
      ).map((p) => dto(p as ProjectRow)),
    ),
  )
  app.get('/:id', async (c) => {
    const id = idParameter.safeParse(c.req.param('id'))
    if (!id.success) return c.body(null, 404)
    const [project] = await db
      .select(projectSelection)
      .from(projects)
      .where(
        and(
          eq(projects.id, id.data),
          eq(projects.userId, c.get('currentUserId')),
        ),
      )
      .limit(1)
    if (!project) return c.body(null, 404)
    const unassigned = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, c.get('currentUserId')),
          isNull(tasks.projectId),
          eq(tasks.isArchived, false),
        ),
      )
      .orderBy(desc(tasks.isFavorite), desc(tasks.lastUsedAt))
    return c.json({
      project: dto(project as ProjectRow),
      unassignedTasks: unassigned.map(taskSummary),
    })
  })
  app.post('/', async (c) => upsertProject(c, db))
  app.put('/:id', async (c) => {
    const id = idParameter.safeParse(c.req.param('id'))
    return id.success
      ? upsertProject(c, db, id.data)
      : c.json({ error: 'Invalid request' }, 400)
  })
  app.delete('/:id', async (c) => {
    const id = idParameter.safeParse(c.req.param('id'))
    if (!id.success) return c.body(null, 404)
    const rows = await db
      .delete(projects)
      .where(
        and(
          eq(projects.id, id.data),
          eq(projects.userId, c.get('currentUserId')),
        ),
      )
      .returning({ id: projects.id })
    return rows.length ? c.body(null, 200) : c.body(null, 404)
  })
  for (const [path, archived] of [
    ['archive', true],
    ['unarchive', false],
  ] as const)
    app.patch(`/:id/${path}`, async (c) => {
      const id = idParameter.safeParse(c.req.param('id'))
      if (!id.success) return c.body(null, 404)
      const [row] = await db
        .update(projects)
        .set({ isArchived: archived, updatedAt: new Date() })
        .where(
          and(
            eq(projects.id, id.data),
            eq(projects.userId, c.get('currentUserId')),
          ),
        )
        .returning()
      if (!row) return c.body(null, 404)
      const [selected] = await db
        .select(projectSelection)
        .from(projects)
        .where(eq(projects.id, row.id))
      return c.json(dto(selected as ProjectRow))
    })
  for (const [path, add] of [
    ['add-task', true],
    ['remove-task', false],
  ] as const)
    app.patch(`/:id/${path}`, async (c) => {
      const id = idParameter.safeParse(c.req.param('id'))
      const body = assignSchema.safeParse(await c.req.json().catch(() => null))
      if (!id.success || !body.success)
        return c.json({ error: 'Invalid request' }, 400)
      const uid = c.get('currentUserId')
      const ownedProject = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, id.data), eq(projects.userId, uid)))
        .limit(1)
      if (!ownedProject.length) return c.body(null, 404)
      const changed = await db
        .update(tasks)
        .set({ projectId: add ? id.data : null, updatedAt: new Date() })
        .where(and(eq(tasks.id, body.data.taskId), eq(tasks.userId, uid)))
        .returning({ id: tasks.id })
      return changed.length ? c.body(null, 200) : c.body(null, 404)
    })
  return app
}

async function upsertProject(c: Context<AppEnv>, db: Database, id?: number) {
  const parsed = bodySchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  const name = parsed.data.name.trim()
  const uid = c.get('currentUserId')
  if (!name) return c.json({ error: 'Invalid request' }, 400)
  const duplicate = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.userId, uid),
        id ? ne(projects.id, id) : undefined,
        sql`lower(${projects.name})=${name.toLowerCase()}`,
      ),
    )
    .limit(1)
  if (duplicate.length)
    return c.json({ error: 'A project with that name already exists' }, 400)
  const values = {
    name,
    description: parsed.data.description?.trim() || null,
    updatedAt: new Date(),
  }
  const rows = id
    ? await db
        .update(projects)
        .set(values)
        .where(and(eq(projects.id, id), eq(projects.userId, uid)))
        .returning()
    : await db
        .insert(projects)
        .values({ ...values, userId: uid })
        .returning()
  const row = rows[0]
  if (!row) return c.body(null, 404)
  const [selected] = await db
    .select(projectSelection)
    .from(projects)
    .where(eq(projects.id, row.id))
  return c.json(dto(selected as ProjectRow))
}
const taskSummary = (t: typeof tasks.$inferSelect) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  jiraUrl: t.jiraUrl,
  jiraKey: extractIssueKey(t.jiraUrl),
  projectId: t.projectId,
  isFavorite: t.isFavorite,
  isArchived: t.isArchived,
})
