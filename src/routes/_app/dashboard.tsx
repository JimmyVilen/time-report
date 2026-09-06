import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardPage } from '~/features/dashboard/DashboardPage'
import { today } from '~/lib/dateUtils'

export const Route = createFileRoute('/_app/dashboard')({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search['date'] === 'string' ? search['date'] : today(),
  }),
  component: Dashboard,
})

function Dashboard() {
  const { date } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  return (
    <DashboardPage
      date={date}
      onDateChange={(next) => {
        void navigate({ search: { date: next }, replace: true })
      }}
    />
  )
}
