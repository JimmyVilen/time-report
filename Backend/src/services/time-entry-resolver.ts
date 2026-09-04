export interface ResolvedTimeEntry {
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
}

const wallClockPattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/

function wallClockMillis(value: string): number {
  const match = wallClockPattern.exec(value)
  if (!match) throw new Error('Invalid local date-time')
  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? 0),
    Number((match[7] ?? '').padEnd(3, '0').slice(0, 3)),
  )
}

function addMinutes(value: string, minutes: number): string {
  const date = new Date(wallClockMillis(value) + minutes * 60_000)
  return date.toISOString().slice(0, value.length >= 19 ? 19 : 16)
}

function validateDate(date: string, ...values: (string | null)[]): void {
  for (const value of values)
    if (value && value.slice(0, 10) !== date)
      throw new Error(
        `Time ${value.slice(11, 16)} does not fall on date ${date}`,
      )
}

export function resolveTimeEntry(
  date: string,
  start: string | null,
  end: string | null,
  duration: number | null,
): ResolvedTimeEntry {
  if (start && end) {
    const difference = Math.round(
      (wallClockMillis(end) - wallClockMillis(start)) / 60_000,
    )
    if (difference <= 0) throw new Error('End time must be after start time')
    validateDate(date, start, end)
    return { startTime: start, endTime: end, durationMinutes: difference }
  }
  if (start && duration && duration > 0) {
    const calculatedEnd = addMinutes(start, duration)
    validateDate(date, start, calculatedEnd)
    return {
      startTime: start,
      endTime: calculatedEnd,
      durationMinutes: duration,
    }
  }
  if (end && duration && duration > 0) {
    const calculatedStart = addMinutes(end, -duration)
    validateDate(date, calculatedStart, end)
    return {
      startTime: calculatedStart,
      endTime: end,
      durationMinutes: duration,
    }
  }
  if (!start && !end && duration && duration > 0)
    return { startTime: null, endTime: null, durationMinutes: duration }
  if (!start && !end) throw new Error('Provide duration or start/end time')
  return { startTime: start, endTime: end, durationMinutes: null }
}

export function parseTimeOnDate(
  date: string,
  time: string | null | undefined,
): string | null {
  if (!time) return null
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Invalid time')
  return `${date}T${time}:00`
}
