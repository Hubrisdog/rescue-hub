import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Stethoscope,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Building2,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Tag,
  Home,
  Trees,
} from 'lucide-react'
import { useRescueHubStore, type Animal } from '@/stores/rescue-hub-store'
import { useAuthStore } from '@/stores/auth-store'
import { getSpeciesPlaceholder } from '../utils/placeholders'
import { toast } from 'sonner'

interface AnimalProfileDialogProps {
  animal: Animal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditClick?: () => void
}

export function AnimalProfileDialog({
  animal,
  open,
  onOpenChange,
  onEditClick,
}: AnimalProfileDialogProps) {
  const store = useRescueHubStore()
  const navigate = useNavigate()
  const userRole = useAuthStore((state) => state.auth.user?.role?.[0] || 'Rescuer')

  const isWildSpecies = (sp: string) =>
    ['bird', 'reptile', 'snake', 'monkey', 'wild'].includes((sp || '').toLowerCase())

  const rawAnimalCaseId = (animal?.case_id || '').replace(/^case-/, '')
  const rescueCase = store.cases.find(
    (c) => c.id === animal?.case_id || c.id.replace(/^case-/, '') === rawAnimalCaseId
  )

  const rescuer = useMemo(() => {
    if (!rescueCase?.rescuer_id) return null
    // Extract team ID prefix format (e.g. res-1 -> team-1)
    const teamIdStr = rescueCase.rescuer_id.replace(/^res-/, 'team-')
    const teamRescuers = store.rescuers.filter(
      (r) => r.team_id === teamIdStr || r.team_id === rescueCase.rescuer_id || r.id === rescueCase.rescuer_id
    )
    const actualRescuer = teamRescuers.find((r) => r.role === 'Rescuer')
    return actualRescuer || teamRescuers[0] || null
  }, [rescueCase, store.rescuers])

  if (!animal) return null

  const handleAdoptWorkflow = async () => {
    try {
      await store.updateAnimal(animal.id, { status: 'Adopted' })
      toast.success(`🎉 Adoption workflow finalized! ${animal.name} is now marked as Adopted.`)
      onOpenChange(false)
    } catch (e) {
      toast.error('Failed to complete adoption workflow.')
    }
  }

  const handleReleaseWorkflow = async () => {
    try {
      await store.updateAnimal(animal.id, { status: 'Released' })
      toast.success(`🕊️ Habitat release workflow finalized! ${animal.name} is now marked as Released.`)
      onOpenChange(false)
    } catch (e) {
      toast.error('Failed to complete release workflow.')
    }
  }

  const handleSetReadyAdoption = async () => {
    try {
      await store.updateAnimal(animal.id, { status: 'Ready for Adoption' })
      toast.success(`🏠 Status updated: ${animal.name} is now Ready for Adoption.`)
      onOpenChange(false)
    } catch (e) {
      toast.error('Failed to update status.')
    }
  }

  const handleSetReadyRelease = async () => {
    try {
      await store.updateAnimal(animal.id, { status: 'Ready for Release' })
      toast.success(`🌿 Status updated: ${animal.name} is now Ready for Release.`)
      onOpenChange(false)
    } catch (e) {
      toast.error('Failed to update status.')
    }
  }

  // Robust Linked entities lookup
  const rawAnimalShelterId = (animal.shelter_id || '').replace(/^sh-/, '')
  const shelter = store.shelters.find(
    (s) => s.id === animal.shelter_id || s.id.replace(/^sh-/, '') === rawAnimalShelterId
  )

  // Robust Latest treatment lookup
  const animalTreatments = store.treatments
    .filter((t) => {
      const rawTreatmentAnimId = (t.animal_id || '').replace(/^ani-/, '')
      const rawAnimId = (animal.id || '').replace(/^ani-/, '')
      return rawTreatmentAnimId === rawAnimId || t.animal_id === animal.id
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const latestTreatment = animalTreatments[0]

  // Computed Days in Shelter
  const createdDate = new Date(animal.created_at || Date.now())
  const diffTime = Math.abs(Date.now() - createdDate.getTime())
  const daysInShelter = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  // Outcome Badge Generator
  const getOutcomeBadge = () => {
    switch (animal.status) {
      case 'Intake':
        return (
          <Badge className='bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30 gap-1.5 py-1 px-3 text-xs font-semibold'>
            <Clock className='h-3.5 w-3.5' /> 🟠 Newly Admitted / Intake
          </Badge>
        )
      case 'Under Treatment':
        return (
          <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1 px-3 text-xs font-semibold'>
            <Stethoscope className='h-3.5 w-3.5' /> 🟢 Under Active Treatment
          </Badge>
        )
      case 'Recovered':
        const isWild = isWildSpecies(animal.species)
        return isWild ? (
          <Badge className='bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 gap-1.5 py-1 px-3 text-xs font-semibold'>
            <Trees className='h-3.5 w-3.5' /> 🌿 Ready for Release
          </Badge>
        ) : (
          <Badge className='bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1.5 py-1 px-3 text-xs font-semibold'>
            <Home className='h-3.5 w-3.5' /> 🏠 Ready for Adoption
          </Badge>
        )
      case 'Adopted':
        return (
          <Badge className='bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1.5 py-1 px-3 text-xs font-semibold'>
            <Heart className='h-3.5 w-3.5 fill-rose-500' /> ❤️ Permanently Adopted
          </Badge>
        )
      case 'Released':
        return (
          <Badge className='bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 gap-1.5 py-1 px-3 text-xs font-semibold'>
            <Sparkles className='h-3.5 w-3.5' /> 🕊 Released to Habitat
          </Badge>
        )
    }
  }

  // Workflow Timeline Calculation
  const timelineSteps = [
    { label: 'Incident Reported', done: true },
    { label: 'Rescue Team Assigned', done: !!rescueCase },
    { label: 'Animal Rescued', done: !!rescueCase && rescueCase.status !== 'REPORTED' },
    { label: 'Shelter Intake', done: true },
    {
      label: 'Under Treatment',
      done: ['Under Treatment', 'Recovered', 'Adopted', 'Released'].includes(animal.status),
    },
    {
      label: isWildSpecies(animal.species) ? 'Ready for Release' : 'Ready for Adoption',
      done: ['Recovered', 'Adopted', 'Released'].includes(animal.status),
    },
    {
      label: isWildSpecies(animal.species) ? 'Released' : 'Adopted',
      done: ['Adopted', 'Released'].includes(animal.status),
    },
  ]

  const handleViewTreatments = () => {
    onOpenChange(false)
    navigate({ to: '/treatments' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-teal-500/20 shadow-2xl'>
        {/* Header Hero Section */}
        <div className='relative bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white p-6 rounded-t-lg overflow-hidden'>
          <div className='absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none' />
          
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10'>
            {/* Animal Avatar Photo */}
            <div className='relative group shrink-0'>
              <img
                src={animal.photo_url || getSpeciesPlaceholder(animal.species)}
                alt={animal.name}
                className='h-24 w-24 rounded-xl object-cover border-2 border-white/20 shadow-xl bg-slate-800'
              />
              <span className='absolute -bottom-1.5 -right-1.5 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow'>
                ANM-00{animal.id}
              </span>
            </div>

            {/* Profile Meta Details */}
            <div className='space-y-1.5 flex-1'>
              <div className='flex items-center gap-2 flex-wrap'>
                <h2 className='text-2xl font-extrabold tracking-tight text-white'>
                  {animal.name}
                </h2>
                <Badge variant='outline' className='border-teal-400/40 text-teal-300 bg-teal-950/40 text-xs font-mono'>
                  {animal.species} • {animal.breed}
                </Badge>
              </div>

              <p className='text-xs text-slate-300 flex items-center gap-3 flex-wrap'>
                <span>Sex: <strong className='text-white'>{animal.sex}</strong></span>
                <span>•</span>
                <span>Age: <strong className='text-white'>{animal.estimated_age}</strong></span>
                <span>•</span>
                <span>Weight: <strong className='text-white'>{animal.weight} kg</strong></span>
                <span>•</span>
                <span>Color: <strong className='text-white'>{animal.color}</strong></span>
              </p>

              <div className='pt-1 flex items-center gap-2 flex-wrap'>
                {getOutcomeBadge()}
                <Badge variant='secondary' className='bg-white/10 text-slate-200 border-white/10 text-xs gap-1'>
                  <Clock className='h-3 w-3' /> {daysInShelter} Days in System
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Dialog Content Grid */}
        <div className='p-6 space-y-6 bg-card'>
          {/* Section: Status Progression Timeline */}
          <div className='space-y-3 bg-muted/20 p-4 rounded-xl border border-teal-500/10'>
            <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
              <Activity className='h-4 w-4 text-teal-500' /> Rescue Workflow Timeline
            </h3>

            <div className='grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1'>
              {timelineSteps.map((step, idx) => (
                <div key={idx} className='flex flex-col items-center text-center space-y-1 relative'>
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${
                      step.done
                        ? 'bg-teal-500 text-white shadow-teal-500/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {step.done ? <CheckCircle2 className='h-4 w-4' /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] leading-tight font-medium ${
                      step.done ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* 1. Basic Information Card */}
            <div className='space-y-3 p-4 rounded-xl border bg-muted/10'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5'>
                <Tag className='h-4 w-4' /> 1. Basic Profile Details
              </h3>
              <div className='grid grid-cols-2 gap-2.5 text-xs'>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Animal ID</span>
                  <span className='font-mono font-bold text-foreground'>ANM-00{animal.id}</span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Official Name</span>
                  <span className='font-semibold text-foreground'>{animal.name}</span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Species & Breed</span>
                  <span className='font-medium text-foreground'>{animal.species} ({animal.breed})</span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Color / Markings</span>
                  <span className='font-medium text-foreground'>{animal.color}</span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Sex & Est. Age</span>
                  <span className='font-medium text-foreground'>{animal.sex}, {animal.estimated_age}</span>
                </div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Registered Weight</span>
                  <span className='font-medium text-foreground'>{animal.weight} kg</span>
                </div>
              </div>
            </div>

            {/* 2. Rescue Information Card */}
            <div className='space-y-3 p-4 rounded-xl border bg-muted/10'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5'>
                <ShieldCheck className='h-4 w-4' /> 2. Rescue & Housing Provenance
              </h3>
              <div className='space-y-2 text-xs'>
                <div className='flex items-center justify-between border-b pb-1.5'>
                  <span className='text-muted-foreground'>Case Reference</span>
                  <span className='font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded'>
                    {rescueCase ? rescueCase.case_number : 'Direct Shelter Intake'}
                  </span>
                </div>
                <div className='flex items-center justify-between border-b pb-1.5'>
                  <span className='text-muted-foreground flex items-center gap-1'>
                    <Calendar className='h-3 w-3' /> Date Rescued
                  </span>
                  <span className='font-medium text-foreground'>
                    {rescueCase?.rescue_date
                      ? new Date(rescueCase.rescue_date).toLocaleDateString()
                      : new Date(animal.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className='flex items-center justify-between border-b pb-1.5'>
                  <span className='text-muted-foreground flex items-center gap-1'>
                    <MapPin className='h-3 w-3' /> Rescue Location
                  </span>
                  <span className='font-medium text-foreground truncate max-w-[180px]'>
                    {rescueCase?.location || 'Central Intake Facility'}
                  </span>
                </div>
                <div className='flex items-center justify-between border-b pb-1.5'>
                  <span className='text-muted-foreground flex items-center gap-1'>
                    <User className='h-3 w-3' /> Rescued By / Agent
                  </span>
                  <span className='font-medium text-foreground'>
                    {rescuer ? rescuer.name : 'Alpha Rescue Unit'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground flex items-center gap-1'>
                    <Building2 className='h-3 w-3' /> Housing Shelter
                  </span>
                  <span className='font-semibold text-teal-600 dark:text-teal-400'>
                    {shelter ? shelter.name : 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Medical Summary Card */}
          <div className='space-y-3 p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/20'>
            <div className='flex items-center justify-between'>
              <h3 className='text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5'>
                <Stethoscope className='h-4 w-4' /> 3. Latest Medical & Clinical Summary
              </h3>
              <Button
                variant='outline'
                size='sm'
                onClick={handleViewTreatments}
                className='h-7 text-xs gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              >
                View Full Treatment History ({animalTreatments.length}) <ExternalLink className='h-3 w-3' />
              </Button>
            </div>

            {latestTreatment ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 text-xs'>
                <div className='space-y-1.5'>
                  <div>
                    <span className='text-muted-foreground block text-[11px] font-medium'>Primary Diagnosis</span>
                    <p className='font-bold text-foreground text-sm bg-background p-2 rounded border border-emerald-500/10'>
                      {latestTreatment.diagnosis}
                    </p>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[11px] font-medium'>Treatment & Procedure</span>
                    <p className='text-muted-foreground bg-background p-2 rounded border border-emerald-500/10'>
                      {latestTreatment.procedure || 'Standard clinical stabilization'}
                    </p>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <div>
                    <span className='text-muted-foreground block text-[11px] font-medium'>Attending Veterinarian</span>
                    <p className='font-semibold text-foreground flex items-center gap-1 bg-background p-2 rounded border border-emerald-500/10'>
                      <User className='h-3.5 w-3.5 text-emerald-500' /> {latestTreatment.veterinarian}
                    </p>
                  </div>
                  <div>
                    <span className='text-muted-foreground block text-[11px] font-medium'>Prescribed Medication</span>
                    <p className='text-muted-foreground bg-background p-2 rounded border border-emerald-500/10'>
                      {latestTreatment.medication || 'None prescribed'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-background p-3 rounded border text-xs text-muted-foreground flex items-center justify-between'>
                <span>Physical condition logged: <strong>"{animal.condition}"</strong>. No clinical treatment records created yet.</span>
                <Button size='sm' variant='ghost' onClick={handleViewTreatments} className='h-6 text-xs text-emerald-600'>
                  + Add Medical Log
                </Button>
              </div>
            )}
          </div>

          {/* Section: Rescue Observations Notes */}
          <div className='space-y-2 p-4 rounded-xl border bg-muted/10'>
            <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
              <FileText className='h-4 w-4 text-teal-500' /> 5. Rescue & Behavioral Observations
            </h3>
            <p className='text-xs text-muted-foreground leading-relaxed bg-background p-3 rounded-md border italic'>
              {animal.notes || animal.condition || 'Animal responding well to shelter intake protocols. Behavior calm and alert during care procedures.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className='p-4 bg-muted/20 border-t flex items-center justify-between sm:justify-between gap-2 flex-wrap'>
          <Button variant='outline' onClick={() => onOpenChange(false)} className='text-xs'>
            Close Profile
          </Button>

          <div className='flex items-center gap-2'>
            {animal.status === 'Recovered' && (userRole === 'Admin' || userRole === 'Shelter Staff') && (
              isWildSpecies(animal.species) ? (
                <Button
                  onClick={handleSetReadyRelease}
                  className='text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold animate-pulse'
                >
                  <Trees className='h-3.5 w-3.5' /> Set Ready for Release
                </Button>
              ) : (
                <Button
                  onClick={handleSetReadyAdoption}
                  className='text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold animate-pulse'
                >
                  <Home className='h-3.5 w-3.5' /> Set Ready for Adoption
                </Button>
              )
            )}

            {animal.status === 'Ready for Adoption' && (userRole === 'Admin' || userRole === 'Shelter Staff') && (
              <Button
                onClick={handleAdoptWorkflow}
                className='text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold'
              >
                <Home className='h-3.5 w-3.5 animate-bounce' /> Process Family Adoption
              </Button>
            )}

            {animal.status === 'Ready for Release' && (userRole === 'Admin' || userRole === 'Shelter Staff') && (
              <Button
                onClick={handleReleaseWorkflow}
                className='text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
              >
                <Trees className='h-3.5 w-3.5 animate-bounce' /> Process Habitat Release
              </Button>
            )}

            {onEditClick && (
              <Button onClick={onEditClick} className='text-xs gap-1.5 bg-teal-600 hover:bg-teal-700 text-white'>
                Edit Profile Details
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
