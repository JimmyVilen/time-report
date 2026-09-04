const offsetSuffix = /(?:Z|[+-]\d\d:\d\d)$/

export function toPostgresLocalTimestamp(
  value: unknown,
  timeZone: string,
): Date {
  const raw = String(value)
  if (!offsetSuffix.test(raw)) return parseAsWallClock(raw)

  const instant = new Date(raw)
  if (Number.isNaN(instant.getTime())) throw new Error('invalid timestamp')
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  )
  const part = (name: string): string => {
    const value = parts[name]
    if (!value) throw new Error(`missing ${name} timestamp part`)
    return value
  }
  return parseAsWallClock(
    `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}.${String(instant.getUTCMilliseconds()).padStart(3, '0')}`,
  )
}

export function toAuditDate(value: unknown): Date {
  if (value instanceof Date) return value
  const raw = String(value)
  const normalized = offsetSuffix.test(raw)
    ? raw
    : `${raw.replace(' ', 'T')}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) throw new Error('invalid timestamp')
  return date
}

function parseAsWallClock(value: string): Date {
  const date = new Date(`${value.replace(' ', 'T')}Z`)
  if (Number.isNaN(date.getTime())) throw new Error('invalid timestamp')
  return date
}
