import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'

const identity = (name: string) =>
  integer(name).primaryKey().generatedByDefaultAsIdentity()
const auditColumns = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
}

export const users = pgTable(
  'users',
  {
    id: identity('id'),
    email: varchar('email', { length: 320 }).notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    passwordHash: text('password_hash'),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    isAdmin: boolean('is_admin').notNull().default(false),
    jiraUrl: text('jira_url'),
    jiraEmail: text('jira_email'),
    jiraApiToken: text('jira_api_token'),
    jiraIntegrationSystem: text('jira_integration_system')
      .notNull()
      .default('JIRA_CLOUD'),
    ...auditColumns,
  },
  (t) => [uniqueIndex('users_email_key').on(t.email)],
)

export const projects = pgTable(
  'projects',
  {
    id: identity('id'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isArchived: boolean('is_archived').notNull().default(false),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('index_projects_on_user_id_and_name').on(t.userId, t.name),
    index('projects_user_id_idx').on(t.userId),
  ],
)

export const tasks = pgTable(
  'tasks',
  {
    id: identity('id'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: integer('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    title: text('title').notNull(),
    description: text('description'),
    isArchived: boolean('is_archived').notNull().default(false),
    isFavorite: boolean('is_favorite').notNull().default(false),
    jiraUrl: text('jira_url'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' }),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    ...auditColumns,
  },
  (t) => [
    index('tasks_user_id_idx').on(t.userId),
    index('tasks_user_id_project_id_idx').on(t.userId, t.projectId),
  ],
)

export const timeEntries = pgTable(
  'time_entries',
  {
    id: identity('id'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    description: text('description'),
    startTime: timestamp('start_time', { withTimezone: false, mode: 'string' }),
    endTime: timestamp('end_time', { withTimezone: false, mode: 'string' }),
    durationMinutes: integer('duration_minutes'),
    position: integer('position').notNull().default(0),
    jiraWorklogId: text('jira_worklog_id'),
    pushedToSystem: text('pushed_to_system'),
    pushedAt: timestamp('pushed_at', { withTimezone: true, mode: 'date' }),
    ...auditColumns,
  },
  (t) => [
    index('time_entries_user_id_idx').on(t.userId),
    index('time_entries_task_id_idx').on(t.taskId),
    index('time_entries_user_id_date_position_idx').on(
      t.userId,
      t.date,
      t.position,
    ),
  ],
)

export const dailyNotes = pgTable(
  'daily_notes',
  {
    id: identity('id'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    content: text('content').notNull(),
    ...auditColumns,
  },
  (t) => [uniqueIndex('daily_notes_user_id_date_key').on(t.userId, t.date)],
)

export const plannerBlocks = pgTable(
  'planner_blocks',
  {
    id: identity('id'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    title: text('title').notNull(),
    startTime: timestamp('start_time', { withTimezone: false, mode: 'string' }),
    endTime: timestamp('end_time', { withTimezone: false, mode: 'string' }),
    color: text('color'),
    notes: text('notes'),
    ...auditColumns,
  },
  (t) => [index('planner_blocks_user_id_date_idx').on(t.userId, t.date)],
)

export const tags = pgTable(
  'tags',
  {
    id: identity('id'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color'),
    ...auditColumns,
  },
  (t) => [
    uniqueIndex('tags_user_id_name_key').on(t.userId, t.name),
    index('tags_user_id_idx').on(t.userId),
  ],
)

export const timeEntryTags = pgTable(
  'time_entry_tags',
  {
    timeEntryId: integer('time_entry_id')
      .notNull()
      .references(() => timeEntries.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.timeEntryId, t.tagId] })],
)

export const taskDefaultTags = pgTable(
  'task_default_tags',
  {
    taskId: integer('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.tagId] })],
)

// Better Auth uses opaque string ids for its own records while users retain numeric ids.
export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    issuer: text('issuer').notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    scope: text('scope'),
    password: text('password'),
    ...auditColumns,
  },
  (t) => [index('accounts_user_id_idx').on(t.userId)],
)

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    token: text('token').notNull(),
    ...auditColumns,
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('sessions_token_key').on(t.token),
    index('sessions_user_id_idx').on(t.userId),
  ],
)

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
    ...auditColumns,
  },
  (t) => [index('verifications_identifier_idx').on(t.identifier)],
)
