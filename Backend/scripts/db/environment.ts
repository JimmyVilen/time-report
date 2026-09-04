import { z } from 'zod'

export function productionDatabaseUrl(): string {
  const value = process.env['DATABASE_URL']
  if (!value) throw new Error('DATABASE_URL is required')
  return validatePostgresUrl(value)
}

export function testDatabaseUrl(): string {
  if (process.env['NODE_ENV'] !== 'test')
    throw new Error('Refusing: NODE_ENV must equal test')
  const value = process.env['TEST_DATABASE_URL']
  if (!value)
    throw new Error(
      'TEST_DATABASE_URL is required; test scripts never fall back to DATABASE_URL',
    )
  const url = new URL(validatePostgresUrl(value))
  const host = url.hostname.toLowerCase()
  const database = url.pathname.slice(1).toLowerCase()
  if (!['localhost', '127.0.0.1', '::1', 'postgres'].includes(host))
    throw new Error(`Refusing non-local test database host: ${host}`)
  if (!/(^|[_-])(test|testing)([_-]|$)/.test(database))
    throw new Error(
      `Refusing database without an explicit test name: ${database}`,
    )
  if (host.endsWith('.supabase.co') || /prod|production|staging/.test(database))
    throw new Error('Refusing a production, staging, or Supabase target')
  return url.toString()
}

function validatePostgresUrl(value: string): string {
  const parsed = z.url().parse(value)
  if (!/^postgres(ql)?:/.test(parsed))
    throw new Error('A PostgreSQL URL is required')
  return parsed
}
