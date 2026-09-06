// The Start server runtime bundles its own `Response` class and silently drops
// any server-route result that is not an instance of it. Parts of the Hono app
// answer with Node's global `Response.json()` (see `legacyAuthResponse` in
// auth/routes.ts), which is a different class even though it is structurally the
// same object. Re-wrapping at the boundary keeps the backend code untouched.
//
// TypeScript sees both classes as the same `Response` type, so the mismatched
// branch narrows to `never` and has to be widened explicitly.
export function toRuntimeResponse(result: Response): Response {
  if (result instanceof Response) return result
  const foreign = result as unknown as {
    body: ReadableStream<Uint8Array> | null
    status: number
    statusText: string
    headers: Headers
  }
  return new Response(foreign.body, {
    status: foreign.status,
    statusText: foreign.statusText,
    headers: foreign.headers,
  })
}
