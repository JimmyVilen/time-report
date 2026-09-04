const tokenPattern = /(\d+(?:\.\d+)?)\s*(h|m)\b/gi

// Mirrors System.Math.Round's default midpoint-to-even behavior.
function roundToEven(value: number): number {
  const floor = Math.floor(value)
  const fraction = value - floor
  if (Math.abs(fraction - 0.5) < Number.EPSILON * Math.max(1, value))
    return floor % 2 === 0 ? floor : floor + 1
  return Math.round(value)
}

export function parseDuration(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null
  const input = raw.trim().toLowerCase()
  if (input.startsWith('-')) return null
  tokenPattern.lastIndex = 0
  let total = 0
  let lastEnd = 0
  let found = false
  for (const match of input.matchAll(tokenPattern)) {
    if (input.slice(lastEnd, match.index).trim()) return null
    const number = Number(match[1])
    if (!Number.isFinite(number) || number < 0) return null
    total += roundToEven(match[2] === 'h' ? number * 60 : number)
    lastEnd = match.index + match[0].length
    found = true
  }
  if (!found || input.slice(lastEnd).trim()) return null
  return total > 0 ? total : null
}

export function formatMinutes(minutes: number): string {
  if (minutes <= 0) return '0m'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours && remainder) return `${String(hours)}h ${String(remainder)}m`
  return hours ? `${String(hours)}h` : `${String(remainder)}m`
}
