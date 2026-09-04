import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import type { Auth } from '../src/auth/auth.js'
import type { Database } from '../src/db/client.js'

describe('service endpoints', () => {
  it('reports health', async () =>
    expect(await (await createApp().request('/health')).json()).toEqual({
      status: 'ok',
    }))
  it('reports failed readiness', async () => {
    const response = await createApp({
      readiness: async () => {
        throw new Error('down')
      },
    }).request('/ready')
    expect(response.status).toBe(503)
  })
  it('returns JSON for unknown APIs', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const response = await createApp().request('/api/missing')
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain('application/json')
  })
  it('does not expose the raw Better Auth API', async () => {
    const handler = vi.fn(() => Response.json({}))
    const response = await createApp({
      db: {} as Database,
      auth: { handler } as unknown as Auth,
    }).request('/api/auth/better-auth/sign-up/email', { method: 'POST' })

    expect(response.status).toBe(404)
    expect(handler).not.toHaveBeenCalled()
  })
})
