import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'

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
})
