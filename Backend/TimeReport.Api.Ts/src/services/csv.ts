export function csvEscape(value: string): string {
  return /[,"\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}
