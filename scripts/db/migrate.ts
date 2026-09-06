import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'node:url'
import { createDatabase } from '../../src/server/db/client'
import { productionDatabaseUrl } from './environment'

const { db, client } = createDatabase(productionDatabaseUrl(), 1)
try {
  console.info('Applying reviewed migrations from drizzle/')
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../../drizzle', import.meta.url)),
  })
  console.info('Migrations applied successfully')
} catch (error) {
  console.error(
    'Migration failed',
    error instanceof Error ? error.message : error,
  )
  process.exitCode = 1
} finally {
  await client.end()
}
