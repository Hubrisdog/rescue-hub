import { createFileRoute } from '@tanstack/react-router'
import { Treatments } from '@/features/treatments'

export const Route = createFileRoute('/_authenticated/treatments/')({
  component: Treatments,
})
