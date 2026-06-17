import { createFileRoute } from '@tanstack/react-router'
import { Rescuers } from '@/features/rescuers'

export const Route = createFileRoute('/_authenticated/rescuers/')({
  component: Rescuers,
})
