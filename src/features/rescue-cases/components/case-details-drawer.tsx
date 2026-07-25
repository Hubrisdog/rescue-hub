import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Users,
  MapPin,
  Clock,
  Stethoscope,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Car,
  Heart,
  Trees,
} from 'lucide-react'
import { useRescueHubStore, type RescueCase } from '@/stores/rescue-hub-store'
import { getSpeciesPlaceholder } from '@/features/animals/utils/placeholders'
import { MockMapView } from '@/components/mock-map-view'

interface CaseDetailsDrawerProps {
  rescueCase: RescueCase | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick?: (rescueCase: RescueCase) => void
}

export function CaseDetailsDrawer({
  rescueCase,
  open,
  onOpenChange,
  onEditClick,
}: CaseDetailsDrawerProps) {
  const store = useRescueHubStore()

  if (!rescueCase) return null

  // Prefix-resistant lookups
  const rawCaseId = rescueCase.id.replace(/^case-/, '')
  const rawCaseAnimId = (rescueCase.animal_id || '').replace(/^ani-/, '')
  const rawCaseRescuerId = (rescueCase.rescuer_id || '').replace(/^(res|agt)-/, '')
  const rawCaseShelterId = (rescueCase.shelter_id || '').replace(/^sh-/, '')

  const teamIdStr = rescueCase.rescuer_id ? rescueCase.rescuer_id.replace(/^res-/, 'team-') : ''
  const rescuer = store.rescuers.find(
    (r) =>
      r.id === rescueCase.rescuer_id ||
      r.id.replace(/^(res|agt)-/, '') === rawCaseRescuerId ||
      (teamIdStr && r.team_id === teamIdStr)
  )

  const shelter = store.shelters.find(
    (s) => s.id === rescueCase.shelter_id || s.id.replace(/^sh-/, '') === rawCaseShelterId
  )

  const animal = store.animals.find(
    (a) =>
      a.id === rescueCase.animal_id ||
      (rawCaseAnimId && a.id.replace(/^ani-/, '') === rawCaseAnimId) ||
      a.case_id === rescueCase.id ||
      (a.case_id && a.case_id.replace(/^case-/, '') === rawCaseId)
  )

  const incident = rescueCase.incident_id
    ? store.incidents.find(
        (inc) => inc.id === rescueCase.incident_id || inc.id.replace(/^inc-/, '') === rescueCase.incident_id?.replace(/^inc-/, '')
      )
    : null

  // Latest treatment for this animal
  const rawAnimId = animal ? animal.id.replace(/^ani-/, '') : ''
  const treatment = animal
    ? store.treatments.find(
        (t) => t.animal_id === animal.id || t.animal_id.replace(/^ani-/, '') === rawAnimId
      )
    : null

  // Shelter Occupancy Calculation
  const shelterOccupancy = shelter
    ? store.animals.filter(
        (a) =>
          (a.shelter_id === shelter.id || a.shelter_id?.replace(/^sh-/, '') === shelter.id.replace(/^sh-/, '')) &&
          a.status !== 'Adopted' &&
          a.status !== 'Released'
      ).length
    : 0

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Badge className='bg-red-500 text-white font-bold'>Critical Priority</Badge>
      case 'High':
        return <Badge className='bg-amber-500 text-slate-950 font-bold'>High Priority</Badge>
      case 'Medium':
        return <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold'>Medium</Badge>
      case 'Low':
      default:
        return <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'>Low</Badge>
    }
  }

  // 6-Stage Timeline timestamps (calculated relative to report date)
  const reportDate = new Date(rescueCase.report_date || rescueCase.created_at)
  const formatTime = (minutesOffset: number) => {
    const d = new Date(reportDate.getTime() + minutesOffset * 60 * 1000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const timelineSteps = [
    { label: 'Incident Reported', time: formatTime(0), done: true, icon: FileText },
    { label: 'Dispatcher Triaged & Promoted', time: formatTime(3), done: true, icon: UserCheck },
    { label: 'Rescuer & Shelter Assigned', time: formatTime(6), done: ['ASSIGNED', 'EN_ROUTE', 'RESCUED', 'SHELTER_INTAKE', 'UNDER_TREATMENT', 'RECOVERED', 'ADOPTED', 'RELEASED', 'CLOSED'].includes(rescueCase.status), icon: Building2 },
    { label: 'Rescue Unit En Route', time: formatTime(18), done: ['EN_ROUTE', 'RESCUED', 'SHELTER_INTAKE', 'UNDER_TREATMENT', 'RECOVERED', 'ADOPTED', 'RELEASED', 'CLOSED'].includes(rescueCase.status), icon: Car },
    { label: 'Animal Secured in Field', time: formatTime(35), done: ['RESCUED', 'SHELTER_INTAKE', 'UNDER_TREATMENT', 'RECOVERED', 'ADOPTED', 'RELEASED', 'CLOSED'].includes(rescueCase.status), icon: CheckCircle2 },
    { label: 'Shelter Intake & Clinic Admission', time: formatTime(47), done: ['SHELTER_INTAKE', 'UNDER_TREATMENT', 'RECOVERED', 'ADOPTED', 'RELEASED', 'CLOSED'].includes(rescueCase.status), icon: Stethoscope },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='sm:max-w-xl w-full overflow-y-auto p-6 space-y-6'>
        {/* Header Section */}
        <SheetHeader className='space-y-2 pb-4 border-b text-left'>
          <div className='flex items-center justify-between gap-2 flex-wrap'>
            <SheetTitle className='text-xl font-black font-mono text-emerald-600 dark:text-emerald-400'>
              {rescueCase.case_number}
            </SheetTitle>
            {getPriorityBadge(rescueCase.severity)}
          </div>
          <SheetDescription className='text-xs text-muted-foreground flex items-center gap-2'>
            <Clock className='h-3.5 w-3.5 text-emerald-500' />
            Reported: {reportDate.toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        {/* 1. Target Animal Profile Banner */}
        <div className='space-y-2'>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
            🐾 Target Animal Record
          </h4>
          {animal ? (
            <div className='p-3 rounded-xl bg-card border shadow-sm flex items-center gap-3.5'>
              <img
                src={animal.photo_url || getSpeciesPlaceholder(animal.species)}
                alt={animal.name}
                className='h-14 w-14 rounded-xl object-cover border shrink-0 bg-slate-800'
              />
              <div className='space-y-0.5 overflow-hidden flex-1'>
                <div className='flex items-center justify-between'>
                  <h5 className='font-bold text-sm text-foreground truncate'>{animal.name}</h5>
                  <Badge variant='outline' className='text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400'>
                    ANM-00{animal.id}
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {animal.species} • {animal.breed} ({animal.sex}, {animal.estimated_age})
                </p>
                <p className='text-[11px] text-emerald-600 dark:text-emerald-400 font-medium italic'>
                  Condition: {animal.condition || 'Under Treatment'}
                </p>
              </div>
            </div>
          ) : (
            <div className='p-3 rounded-xl bg-muted/20 border border-dashed text-xs text-muted-foreground text-center'>
              Animal profile pending clinic intake details.
            </div>
          )}
        </div>

        {/* 2. Operational Assignment Details */}
        <div className='space-y-2.5 border-t pt-4'>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
            🚑 Operations Deployment
          </h4>
          <div className='grid grid-cols-2 gap-3 text-xs'>
            {/* Rescuer */}
            <div className='p-3 rounded-xl bg-card border space-y-1'>
              <span className='text-[10px] font-bold text-muted-foreground uppercase block'>Assigned Rescuer</span>
              <span className='font-bold text-foreground block truncate'>
                👤 {rescuer ? rescuer.name : 'Unassigned Agent'}
              </span>
              <span className='text-[10px] text-muted-foreground block'>
                {rescuer?.role || 'Field Rescuer'}
              </span>
            </div>

            {/* Shelter */}
            <div className='p-3 rounded-xl bg-card border space-y-1'>
              <span className='text-[10px] font-bold text-muted-foreground uppercase block'>Assigned Shelter</span>
              <span className='font-bold text-foreground block truncate'>
                📍 {shelter ? shelter.name : 'Unassigned Shelter'}
              </span>
              {shelter && (
                <span className='text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold block'>
                  Occupancy: {shelterOccupancy} / {shelter.capacity} beds
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Full Timestamped Case Journey Timeline */}
        <div className='space-y-3 border-t pt-4'>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
            📄 Case Dispatch Timeline & Progression
          </h4>
          <div className='relative pl-4 border-l-2 border-emerald-500/20 space-y-3'>
            {timelineSteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={idx} className='relative flex items-center justify-between text-xs group'>
                  <div
                    className={`absolute -left-[21px] h-4 w-4 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      step.done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-background border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    ✓
                  </div>

                  <div className='pl-2 space-y-0.5'>
                    <span className={`font-semibold flex items-center gap-1.5 ${step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      <Icon className={`h-3.5 w-3.5 ${step.done ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      {step.label}
                    </span>
                  </div>

                  <span className='font-mono text-[10px] text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded'>
                    {step.time}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. Veterinary Clinic Medical Summary */}
        {treatment && (
          <div className='space-y-2 border-t pt-4'>
            <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
              🩺 Clinic Veterinary Diagnostics
            </h4>
            <div className='p-3.5 rounded-xl bg-card border space-y-2 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='font-bold text-rose-500'>Diagnosis: {treatment.diagnosis}</span>
                <span className='text-[10px] text-muted-foreground font-mono'>Vet: {treatment.veterinarian}</span>
              </div>
              <p className='text-muted-foreground text-[11px]'>
                <strong>Procedure:</strong> {treatment.procedure}
              </p>
              <p className='text-muted-foreground text-[11px]'>
                <strong>Medication:</strong> {treatment.medication}
              </p>
            </div>
          </div>
        )}

        {/* 5. Location & Mock Map Preview */}
        <div className='space-y-2 border-t pt-4'>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
            📍 Distress Incident Location
          </h4>
          <p className='text-xs font-medium text-foreground flex items-center gap-1'>
            <MapPin className='h-3.5 w-3.5 text-rose-500 shrink-0' /> {rescueCase.location}
          </p>
          <div className='h-40 rounded-xl overflow-hidden border shadow-sm'>
            <MockMapView
              latitude={incident?.latitude || 14.5995}
              longitude={incident?.longitude || 120.9842}
              locationName={rescueCase.location}
            />
          </div>
        </div>

        {/* Case Notes */}
        {rescueCase.notes && (
          <div className='space-y-1.5 border-t pt-4'>
            <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground block'>
              Dispatch Notes
            </span>
            <p className='text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border italic'>
              "{rescueCase.notes}"
            </p>
          </div>
        )}

        {/* Drawer Action Buttons */}
        <div className='pt-4 border-t flex items-center gap-2'>
          <Button
            className='w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white'
            onClick={() => {
              onOpenChange(false)
              if (onEditClick) onEditClick(rescueCase)
            }}
          >
            Update Case Dispatch
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
