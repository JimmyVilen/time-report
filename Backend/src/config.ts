import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z
    .url()
    .refine(
      (url) => url.startsWith('postgres://') || url.startsWith('postgresql://'),
      'Must be a PostgreSQL URL',
    ),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().min(1).max(65_535),
})

export type Config = z.infer<typeof schema>

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): Config {
  const result = schema.safeParse(environment)
  if (!result.success) {
    const details = z.flattenError(result.error).fieldErrors
    throw new Error(`Invalid environment: ${JSON.stringify(details)}`)
  }
  return result.data
}

export function requireTestDatabaseUrl(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  if (environment['NODE_ENV'] !== 'test')
    throw new Error('Database test tools require NODE_ENV=test')
  const value = environment['TEST_DATABASE_URL']
  if (!value)
    throw new Error(
      'TEST_DATABASE_URL is required; DATABASE_URL is never used by test tools',
    )
  return z.url().parse(value)
}
