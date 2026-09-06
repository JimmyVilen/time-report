import { createFileRoute } from '@tanstack/react-router'
import { handleRequest } from '~/server/context'
import { toRuntimeResponse } from '~/server/response'

export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        toRuntimeResponse(await handleRequest(request)),
    },
  },
})
