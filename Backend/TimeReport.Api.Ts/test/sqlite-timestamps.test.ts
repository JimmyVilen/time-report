import { describe, expect, it } from 'vitest'
import {
  toAuditDate,
  toPostgresLocalTimestamp,
} from '../scripts/db/sqlite-timestamps.js'

describe('SQLite timestamp migration', () => {
  it('preserves naive local wall-clock timestamps', () => {
    expect(
      toPostgresLocalTimestamp(
        '2026-08-31 07:30:00',
        'Europe/Stockholm',
      ).toISOString(),
    ).toBe('2026-08-31T07:30:00.000Z')
  })

  it('converts offset timestamps to Stockholm summer time', () => {
    expect(
      toPostgresLocalTimestamp(
        '2026-08-31T05:30:00.000+00:00',
        'Europe/Stockholm',
      ).toISOString(),
    ).toBe('2026-08-31T07:30:00.000Z')
  })

  it('converts offset timestamps to Stockholm winter time', () => {
    expect(
      toPostgresLocalTimestamp(
        '2025-11-24T06:00:00.000+00:00',
        'Europe/Stockholm',
      ).toISOString(),
    ).toBe('2025-11-24T07:00:00.000Z')
  })

  it('leaves already parsed audit timestamps unchanged', () => {
    const date = new Date('2026-08-31T05:45:08.600Z')
    expect(toAuditDate(date)).toBe(date)
  })
})
