import { afterEach, describe, expect, it } from 'vitest'
import { testDatabaseUrl } from '../scripts/db/environment'

const original = { ...process.env }
afterEach(() => {
  process.env = { ...original }
})

describe('test database guard', () => {
  it('accepts explicit local test databases', () => {
    process.env['NODE_ENV'] = 'test'
    process.env['TEST_DATABASE_URL'] =
      'postgresql://u:p@localhost:5432/timereport_test'
    expect(testDatabaseUrl()).toContain('timereport_test')
  })
  it.each([
    'postgresql://u:p@db.example.com/timereport_test',
    'postgresql://u:p@localhost/timereport',
    'postgresql://u:p@localhost/production_test',
  ])('rejects unsafe target %s', (url) => {
    process.env['NODE_ENV'] = 'test'
    process.env['TEST_DATABASE_URL'] = url
    expect(() => testDatabaseUrl()).toThrow('Refusing')
  })
})
