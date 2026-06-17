import { createFileRoute } from '@tanstack/react-router'
import { IncidentReports } from '@/features/incident-reports'

export const Route = createFileRoute('/_authenticated/incident-reports/')({
  component: IncidentReports,
})
