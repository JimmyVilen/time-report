import { ApiError } from './client'

export function exportDatabase(): void {
  window.location.href = '/api/admin/database/export'
}

export async function importDatabase(file: File): Promise<{ message: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/admin/database/import', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.error ?? `HTTP ${res.status}`, res.status)
  }

  return res.json()
}
