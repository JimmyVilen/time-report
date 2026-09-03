import { createDatabase } from '../../src/db/client.js'
import { productionDatabaseUrl } from './environment.js'

// No reference rows are currently required. Keeping this command explicit makes
// bootstrap stable and ensures it never creates users or overwrites user data.
const { client } = createDatabase(productionDatabaseUrl(), 1)
console.info('No reference data to seed')
await client.end()
