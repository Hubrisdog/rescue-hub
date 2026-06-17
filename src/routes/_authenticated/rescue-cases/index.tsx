import { createFileRoute } from '@tanstack/react-router'
import { RescueCases } from '@/features/rescue-cases'

export const Route = createFileRoute('/_authenticated/rescue-cases/')({
  component: RescueCases,
})
