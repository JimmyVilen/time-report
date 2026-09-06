import { createFileRoute } from '@tanstack/react-router'
import { handleRequest } from '~/server/context'
import { toRuntimeResponse } from '~/server/response'

// Every /api/* request is delegated to the Hono app unchanged, so the HTTP
// contract, Zod validation and Better Auth cookie handling stay exactly as they
// were when the backend was a standalone server.
async function handler({ request }: { request: Request }): Promise<Response> {
  return toRuntimeResponse(await handleRequest(request))
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
      PUT: handler,
      PATCH: handler,
      DELETE: handler,
    },
  },
})
