import { z } from 'zod'

export const idParameter = z.coerce.number().int().positive()
export const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`)
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    )
  }, 'Invalid calendar date')

export function iso(value: Date): string {
  return value.toISOString()
}
