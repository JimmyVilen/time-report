import { createFileRoute, redirect } from '@tanstack/react-router'
import { today } from '~/lib/dateUtils'

export const Route = createFileRoute('/')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: '/dashboard', search: { date: today() } })
  },
})
