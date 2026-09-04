import { hash } from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { pathToFileURL } from 'node:url'
import type { Database } from '../../src/db/client.js'
import { createDatabase } from '../../src/db/client.js'
import {
  accounts,
  dailyNotes,
  plannerBlocks,
  projects,
  tags,
  taskDefaultTags,
  tasks,
  timeEntries,
  timeEntryTags,
  users,
} from '../../src/db/schema.js'
import { testDatabaseUrl } from './environment.js'

const now = new Date('2026-01-05T08:00:00.000Z')

export async function seedTest(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    const password = await hash('TestPassword!1', 12)
    await tx
      .insert(users)
      .values([
        {
          id: 1,
          email: 'admin@example.test',
          name: 'Admin',
          isAdmin: true,
          passwordHash: password,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          email: 'alice@example.test',
          name: 'Alice',
          passwordHash: password,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 3,
          email: 'bob@example.test',
          name: 'Bob',
          passwordHash: password,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .onConflictDoNothing()
    await tx
      .insert(accounts)
      .values(
        [1, 2, 3].map((id) => ({
          id: `credential-${String(id)}`,
          accountId: String(id),
          providerId: 'credential',
          issuer: 'local:credential',
          userId: id,
          password,
          createdAt: now,
          updatedAt: now,
        })),
      )
      .onConflictDoNothing()
    await tx
      .insert(projects)
      .values([
        { id: 1, userId: 2, name: 'Client', createdAt: now, updatedAt: now },
        {
          id: 2,
          userId: 3,
          name: 'Private',
          isArchived: true,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .onConflictDoNothing()
    await tx
      .insert(tags)
      .values([
        {
          id: 1,
          userId: 2,
          name: 'Billable',
          color: 'green',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          userId: 3,
          name: 'Other',
          color: null,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .onConflictDoNothing()
    await tx
      .insert(tasks)
      .values([
        {
          id: 1,
          userId: 2,
          projectId: 1,
          title: 'Implementation',
          lastUsedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 2,
          userId: 3,
          projectId: null,
          title: 'Archived',
          isArchived: true,
          deletedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .onConflictDoNothing()
    await tx
      .insert(taskDefaultTags)
      .values({ taskId: 1, tagId: 1 })
      .onConflictDoNothing()
    await tx
      .insert(timeEntries)
      .values([
        {
          id: 1,
          userId: 2,
          taskId: 1,
          date: '2026-01-05',
          description: 'Seed entry',
          durationMinutes: 60,
          position: 0,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .onConflictDoNothing()
    await tx
      .insert(timeEntryTags)
      .values({ timeEntryId: 1, tagId: 1 })
      .onConflictDoNothing()
    await tx
      .insert(dailyNotes)
      .values({
        id: 1,
        userId: 2,
        date: '2026-01-05',
        content: 'Seed note',
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
    await tx
      .insert(plannerBlocks)
      .values({
        id: 1,
        userId: 2,
        date: '2026-01-05',
        title: 'Focus',
        startTime: '2026-01-05 09:00:00',
        endTime: null,
        color: 'blue',
        notes: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
    for (const table of [
      'users',
      'projects',
      'tasks',
      'time_entries',
      'daily_notes',
      'planner_blocks',
      'tags',
    ]) {
      await tx.execute(
        sql.raw(
          `select setval(pg_get_serial_sequence('${table}', 'id'), coalesce((select max(id) from ${table}), 0) + 1, false)`,
        ),
      )
    }
  })
  console.info('Deterministic test data seeded (password: TestPassword!1)')
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { db, client } = createDatabase(testDatabaseUrl(), 1)
  try {
    await seedTest(db)
  } finally {
    await client.end()
  }
}
