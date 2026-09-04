import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import postgres from 'postgres'
import { productionDatabaseUrl } from './environment.js'

type Row = Record<string, unknown>
const tableOrder = [
  'users',
  'projects',
  'tasks',
  'tags',
  'time_entries',
  'daily_notes',
  'planner_blocks',
  'time_entry_tags',
  'task_default_tags',
] as const
const identityTables = [
  'users',
  'projects',
  'tasks',
  'tags',
  'time_entries',
  'daily_notes',
  'planner_blocks',
] as const
const booleanFields: Record<string, string[]> = {
  users: ['is_admin'],
  projects: ['is_archived'],
  tasks: ['is_archived', 'is_favorite'],
}

const args = process.argv.slice(2)
const sourceIndex = args.indexOf('--source')
const sourceArgument = sourceIndex < 0 ? undefined : args[sourceIndex + 1]
if (!sourceArgument)
  throw new Error('Usage: --source <sqlite-file> [--dry-run]')
const sourcePath = resolve(sourceArgument)
const dryRun = args.includes('--dry-run')
const source = new DatabaseSync(sourcePath, { readOnly: true })

try {
  const existing = new Set(
    (
      source
        .prepare("select name from sqlite_master where type='table'")
        .all() as Row[]
    ).map((row) => String(row['name'])),
  )
  const data = new Map<string, Row[]>()
  for (const table of tableOrder) {
    if (!existing.has(table))
      throw new Error(`SQLite source is missing table ${table}`)
    const rows = source.prepare(`select * from "${table}"`).all() as Row[]
    for (const row of rows) normalizeAndValidate(table, row)
    data.set(table, rows)
    console.info(`${table}: ${String(rows.length)} rows validated`)
  }
  if (dryRun) {
    console.info('Dry-run completed; PostgreSQL was not opened or changed')
    process.exit(0)
  }

  const target = postgres(productionDatabaseUrl(), { max: 1, prepare: false })
  try {
    await target.begin(async (tx) => {
      const targetRows = await tx<
        Row[]
      >`select (select count(*)::int from users) as users, (select count(*)::int from projects) as projects, (select count(*)::int from tasks) as tasks, (select count(*)::int from time_entries) as time_entries`
      if (
        Object.values(targetRows[0] ?? {}).some((count) => Number(count) !== 0)
      )
        throw new Error('PostgreSQL target already contains domain data')
      for (const table of tableOrder) {
        const rows = data.get(table) ?? []
        if (!rows.length) continue
        const columns = Object.keys(rows[0] ?? {})
        await tx`insert into ${tx(table)} ${tx(rows as never, columns)}`
      }
      const users = data.get('users') ?? []
      const credentialAccounts = users
        .filter(
          (row) =>
            typeof row['password_hash'] === 'string' && row['password_hash'],
        )
        .map((row) => ({
          id: `credential-${String(row['id'])}`,
          account_id: String(row['id']),
          provider_id: 'credential',
          issuer: 'local:credential',
          user_id: Number(row['id']),
          password: String(row['password_hash']),
          created_at: toDate(row['created_at']),
          updated_at: toDate(row['updated_at']),
        }))
      if (credentialAccounts.length)
        await tx`insert into accounts ${tx(credentialAccounts as never)}`
      for (const table of identityTables)
        await tx.unsafe(
          `select setval(pg_get_serial_sequence('${table}', 'id'), coalesce((select max(id) from ${table}), 0) + 1, false)`,
        )
      for (const table of tableOrder) {
        const result = await tx<
          Row[]
        >`select count(*)::int as count from ${tx(table)}`
        if (Number(result[0]?.['count']) !== (data.get(table)?.length ?? 0))
          throw new Error(`Row-count mismatch for ${table}`)
      }
      const orphanRows = await tx<
        Row[]
      >`select (select count(*) from tasks t left join users u on u.id=t.user_id where u.id is null) + (select count(*) from time_entries e left join users u on u.id=e.user_id left join tasks t on t.id=e.task_id where u.id is null or t.id is null) as count`
      if (Number(orphanRows[0]?.['count']) !== 0)
        throw new Error('Orphan records detected after migration')
      const accountRows = await tx<
        Row[]
      >`select count(*)::int as count from accounts where provider_id='credential'`
      if (Number(accountRows[0]?.['count']) !== credentialAccounts.length)
        throw new Error('Credential account count mismatch')
    })
    console.info('SQLite to PostgreSQL migration committed and verified')
  } finally {
    await target.end()
  }
} finally {
  source.close()
}

function normalizeAndValidate(table: string, row: Row): void {
  for (const field of booleanFields[table] ?? [])
    if (row[field] !== null && row[field] !== undefined)
      row[field] = Number(row[field]) !== 0
  if ('date' in row && !/^\d{4}-\d{2}-\d{2}$/.test(String(row['date'])))
    throw new Error(`${table} id=${String(row['id'])} has an invalid date`)
  for (const field of [
    'created_at',
    'updated_at',
    'last_used_at',
    'deleted_at',
    'pushed_at',
  ])
    if (row[field] !== null && row[field] !== undefined)
      row[field] = toDate(row[field])
}
function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  const raw = String(value)
  const normalized = /(?:Z|[+-]\d\d:\d\d)$/.test(raw)
    ? raw
    : `${raw.replace(' ', 'T')}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime()))
    throw new Error('Invalid audit timestamp in SQLite source')
  return date
}
