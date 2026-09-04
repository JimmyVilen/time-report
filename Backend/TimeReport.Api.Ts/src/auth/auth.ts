import { randomUUID } from 'node:crypto'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth'
import { compare, hash } from 'bcryptjs'
import type { Config } from '../config.js'
import type { Database } from '../db/client.js'
import * as schema from '../db/schema.js'

export function createAuth(db: Database, config: Config) {
  return betterAuth({
    appName: 'TimeReport',
    baseURL: config.BETTER_AUTH_URL,
    basePath: '/api/auth/better-auth',
    secret: config.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
      usePlural: true,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      password: {
        hash: async (password) => hash(password, 12),
        verify: async ({ hash: passwordHash, password }) =>
          compare(password, passwordHash),
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    user: {
      fields: { image: 'avatarUrl', emailVerified: 'emailVerified' },
      additionalFields: {
        isAdmin: {
          type: 'boolean',
          required: true,
          defaultValue: false,
          input: false,
        },
        jiraUrl: { type: 'string', required: false, input: false },
        jiraEmail: { type: 'string', required: false, input: false },
        jiraIntegrationSystem: {
          type: 'string',
          required: true,
          defaultValue: 'JIRA_CLOUD',
          input: false,
        },
      },
    },
    advanced: {
      database: {
        generateId: ({ model }) => (model === 'user' ? false : randomUUID()),
      },
      cookiePrefix: 'timereport',
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.NODE_ENV === 'production',
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>
