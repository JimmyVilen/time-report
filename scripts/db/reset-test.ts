import postgres from 'postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '../../src/server/db/client'
import { seedTest } from './seed-test'
import { testDatabaseUrl } from './environment'

const url = testDatabaseUrl()
const sql = postgres(url, { max: 1 })
try {
  await sql.unsafe('drop schema public cascade')
  await sql.unsafe('drop schema if exists drizzle cascade')
  await sql.unsafe('create schema public')
} finally {
  await sql.end()
}

const database = createDatabase(url, 1)
try {
  await migrate(database.db, {
    migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
  })
  await seedTest(database.db)
  console.info('Test database reset, migrated, and seeded')
} finally {
  await database.client.end()
}
