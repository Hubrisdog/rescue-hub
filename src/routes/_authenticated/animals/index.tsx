import { createFileRoute } from '@tanstack/react-router'
import { Animals } from '@/features/animals'

export const Route = createFileRoute('/_authenticated/animals/')({
  component: Animals,
})
