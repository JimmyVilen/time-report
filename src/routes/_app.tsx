import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getMe, getSetupStatus } from '~/api/auth'
import { TopNav } from '~/components/TopNav'

export const Route = createFileRoute('/_app')({
  // The session lives in an HttpOnly cookie that only the browser holds, so the
  // guard runs client-side exactly as it did before the Start migration.
  ssr: false,
  beforeLoad: async ({ context }) => {
    const status = await getSetupStatus().catch(() => null)
    if (status?.usersExist === false) throw redirect({ to: '/setup' })

    const user = await getMe().catch(() => null)
    if (!user) throw redirect({ to: '/login' })

    context.queryClient.setQueryData(['auth/me'], user)
    return { user }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="app-shell">
      <TopNav />
      <main className="app-main flex">
        <Outlet />
      </main>
    </div>
  )
}
