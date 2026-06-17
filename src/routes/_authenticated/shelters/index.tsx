import { createFileRoute } from '@tanstack/react-router'
import { Shelters } from '@/features/shelters'

export const Route = createFileRoute('/_authenticated/shelters/')({
  component: Shelters,
})
