import { useState, useMemo } from 'react'
import {
  useRescueHubStore,
  type MedicalTreatment,
} from '@/stores/rescue-hub-store'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Stethoscope,
  Clock,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Pill,
  ShieldAlert,
  Activity,
  Heart,
} from 'lucide-react'
import { getSpeciesPlaceholder } from '@/features/animals/utils/placeholders'
import { getRecoveryProgress } from '@/features/animals/utils/animal-helpers'
import { TreatmentStatsHeader } from './components/treatment-stats-header'
import { TreatmentDetailsDrawer } from './components/treatment-details-drawer'

export function MedicalTreatments() {
  const store = useRescueHubStore()
  const userRole = useAuthStore((state) => state.auth.user?.role?.[0] || 'Rescuer')

  // Search, Filter & Pagination States
  const [search, setSearch] = useState('')
  const [chipFilter, setChipFilter] = useState('All')
  const [vetFilter, setVetFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Dialog & Drawer States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [selectedTreatment, setSelectedTreatment] = useState<MedicalTreatment | null>(null)

  // Add Form
  const [animalId, setAnimalId] = useState('')
  const [veterinarian, setVeterinarian] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [procedure, setProcedure] = useState('')
  const [medication, setMedication] = useState('')
  const [treatmentDate, setTreatmentDate] = useState(new Date().toISOString().split('T')[0])
  const [followUpDate, setFollowUpDate] = useState('')
  const [notes, setNotes] = useState('')
  const [recommendation, setRecommendation] = useState<any>('Continue Treatment')

  // Filter change helper
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val)
    setCurrentPage(1)
  }

  // Handlers
  const handleOpenDrawer = (t: MedicalTreatment) => {
    setSelectedTreatment(t)
    setIsDrawerOpen(true)
  }

  const handleOpenAdd = () => {
    setAnimalId(store.animals[0]?.id || '')
    setVeterinarian(store.rescuers.find((r) => r.role === 'Veterinarian')?.name || 'Dr. Alice Vance')
    setDiagnosis('')
    setProcedure('Checkup')
    setMedication('')
    setTreatmentDate(new Date().toISOString().split('T')[0])
    setFollowUpDate('')
    setNotes('')
    setRecommendation('Continue Treatment')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!animalId || !diagnosis) {
      toast.error('Animal and Diagnosis are required.')
      return
    }

    store.addTreatment({
      animal_id: animalId,
      veterinarian,
      diagnosis,
      procedure,
      medication,
      treatment_date: treatmentDate,
      follow_up_date: followUpDate || null,
      notes,
      recommendation,
    })

    setIsAddOpen(false)
    toast.success(`Veterinary assessment submitted. Animal registry updated based on medical clearance!`)
  }

  const handleOpenEdit = (t: MedicalTreatment) => {
    setSelectedTreatment(t)
    setAnimalId(t.animal_id)
    setVeterinarian(t.veterinarian)
    setDiagnosis(t.diagnosis)
    setProcedure(t.procedure)
    setMedication(t.medication)
    setTreatmentDate(t.treatment_date || '')
    setFollowUpDate(t.follow_up_date || '')
    setNotes(t.notes || '')
    setRecommendation((t as any).recommendation || 'Continue Treatment')
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTreatment) return

    store.updateTreatment(selectedTreatment.id, {
      animal_id: animalId,
      veterinarian,
      diagnosis,
      procedure,
      medication,
      treatment_date: treatmentDate,
      follow_up_date: followUpDate || null,
      notes,
      recommendation,
    })

    setIsEditOpen(false)
    toast.success(`Medical record TRT-2026-${String(selectedTreatment.id).replace(/^(trt|treat)-/, '').padStart(4, '0')} updated. Animal registry status refreshed.`)
  }

  const handleOpenDelete = (t: MedicalTreatment) => {
    setSelectedTreatment(t)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTreatment) return
    const err = await store.deleteTreatment(selectedTreatment.id)
    if (err) {
      toast.error(err)
    } else {
      toast.success('Medical treatment record deleted.')
    }
    setIsDeleteOpen(false)
  }

  // Filtered Treatments List
  const filteredTreatments = useMemo(() => {
    return store.treatments.filter((t) => {
      const s = search.toLowerCase()
      const rawAnimId = String(t.animal_id || '').replace(/^ani-/, '')
      const animal = store.animals.find(
        (a) => a.id === t.animal_id || String(a.id || '').replace(/^ani-/, '') === rawAnimId
      )

      const rawShelterId = String(animal?.shelter_id || '').replace(/^sh-/, '')
      const shelter = store.shelters.find(
        (sh) => sh.id === animal?.shelter_id || String(sh.id || '').replace(/^sh-/, '') === rawShelterId
      )

      const matchesSearch =
        (t.diagnosis || '').toLowerCase().includes(s) ||
        (t.procedure || '').toLowerCase().includes(s) ||
        (t.veterinarian || '').toLowerCase().includes(s) ||
        (animal && (animal.name || '').toLowerCase().includes(s)) ||
        (shelter && (shelter.name || '').toLowerCase().includes(s))

      // Quick chip filters
      const todayStr = new Date().toISOString().split('T')[0]
      let matchesChip = true
      if (chipFilter === 'Critical') {
        matchesChip = (t.notes || '').toLowerCase().includes('critical') || (t.procedure || '').toLowerCase().includes('surgery') || (t.diagnosis || '').toLowerCase().includes('fracture') || false
      } else if (chipFilter === 'Ongoing') {
        matchesChip = animal?.status === 'Under Treatment'
      } else if (chipFilter === 'FollowUpToday') {
        matchesChip = !!t.follow_up_date && t.follow_up_date.startsWith(todayStr)
      } else if (chipFilter === 'Completed') {
        matchesChip = animal?.status === 'Recovered' || animal?.status === 'Adopted' || animal?.status === 'Released' || animal?.status === 'Ready for Adoption' || animal?.status === 'Ready for Release'
      }

      const matchesVet = vetFilter === 'All' || t.veterinarian === vetFilter

      return matchesSearch && matchesChip && matchesVet
    })
  }, [store.treatments, store.animals, store.shelters, search, chipFilter, vetFilter])

  // Find animals that have status 'Under Treatment' or 'Intake' but NO recorded treatments
  const pendingExamAnimals = useMemo(() => {
    return store.animals.filter((a) => {
      const rawAnimId = String(a.id || '').replace(/^ani-/, '')
      const hasTreatments = store.treatments.some(
        (t) => String(t.animal_id || '').replace(/^ani-/, '') === rawAnimId || t.animal_id === a.id
      )
      return (a.status === 'Under Treatment' || a.status === 'Intake') && !hasTreatments
    })
  }, [store.animals, store.treatments])

  // Pagination calculations
  const totalItems = filteredTreatments.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTreatments = filteredTreatments.slice(startIndex, startIndex + itemsPerPage)

  // Procedure Icons
  const getProcedureBadge = (proc?: string) => {
    const p = (proc || '').toLowerCase()
    if (p.includes('vaccin') || p.includes('shot') || p.includes('iv')) {
      return <span className='inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400'>💉 Vaccination / IV</span>
    }
    if (p.includes('surg') || p.includes('amputat') || p.includes('fracture')) {
      return <span className='inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400'>🦴 Surgery / Trauma</span>
    }
    if (p.includes('medic') || p.includes('antibiot') || p.includes('pill')) {
      return <span className='inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400'>💊 Medication</span>
    }
    if (p.includes('deworm') || p.includes('parasite') || p.includes('flea')) {
      return <span className='inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400'>🧼 Deworming</span>
    }
    return <span className='inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400'>🩺 Veterinary Checkup</span>
  }

  const getStatusBadge = (t: MedicalTreatment, status?: string) => {
    if ((t.notes || '').toLowerCase().includes('critical') || (t.diagnosis || '').toLowerCase().includes('fracture') || t.recommendation === 'Critical Care') {
      return <Badge className='bg-red-500 text-white font-bold text-[10px] shadow-sm'>Critical</Badge>
    }
    if (status === 'Recovered' || status === 'Adopted' || status === 'Released' || status === 'Ready for Adoption' || status === 'Ready for Release') {
      return <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold text-[10px]'>Completed</Badge>
    }
    if (status === 'Under Treatment') {
      return <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-bold text-[10px]'>Ongoing</Badge>
    }
    return <Badge className='bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold text-[10px]'>Scheduled</Badge>
  }

  // Follow-up Countdown
  const getFollowupCountdown = (fDate?: string | null) => {
    if (!fDate) return <span className='text-[10px] text-muted-foreground italic'>No Follow-up</span>
    const target = new Date(fDate).getTime()
    const now = new Date().setHours(0, 0, 0, 0)
    const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return (
        <span className='text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse'>
          OVERDUE ({Math.abs(diffDays)}d)
        </span>
      )
    } else if (diffDays === 0) {
      return (
        <span className='text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20'>
          TODAY
        </span>
      )
    } else if (diffDays === 1) {
      return (
        <span className='text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'>
          Tomorrow
        </span>
      )
    } else {
      return (
        <span className='text-[10px] font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
          {diffDays} days left
        </span>
      )
    }
  }



  return (
    <div className='flex-1 space-y-4 p-8 pt-6 max-w-[1600px] mx-auto'>
      {/* Module Title Header & Action Button */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b'>
        <div>
          <h2 className='text-3xl font-black tracking-tight text-foreground flex items-center gap-2'>
            🩺 Veterinary Care & Medical Records Center
          </h2>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Longitudinal medical history tracking, clinical procedures, prescriptions, and recovery progress.
          </p>
        </div>

        {(userRole === 'Admin' || userRole === 'Veterinarian') && (
          <Button onClick={handleOpenAdd} size='sm' className='flex gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'>
            <Plus className='h-4 w-4' /> Log Veterinary Record
          </Button>
        )}
      </div>

      {/* 1. Summary Statistics Header */}
      <TreatmentStatsHeader treatments={store.treatments} />

      {/* 2. Pending Veterinary Examination Queue */}
      {pendingExamAnimals.length > 0 && (
        <div className='bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-5 rounded-2xl border border-emerald-500/20 shadow-md space-y-3.5 transition-all duration-300 animate-in slide-in-from-top-4 duration-500'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <h3 className='text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 uppercase'>
                🩺 Queue: Patients Pending Intake Examination ({pendingExamAnimals.length})
              </h3>
              <p className='text-xs text-muted-foreground'>
                These rescued animals are marked as Intake/Under Treatment but have no clinical medical log created yet.
              </p>
            </div>
          </div>

          <div className='flex gap-4 overflow-x-auto pb-2 no-scrollbar'>
            {pendingExamAnimals.map((animal) => (
              <div
                key={animal.id}
                className='flex items-center gap-3 bg-card p-3 rounded-xl border border-emerald-500/10 shadow-sm shrink-0 w-[280px] hover:border-emerald-500/30 transition-all group'
              >
                <img
                  src={animal.photo_url || getSpeciesPlaceholder(animal.species)}
                  alt={animal.name}
                  className='h-12 w-12 rounded-lg object-cover border bg-slate-800 shrink-0'
                />
                <div className='overflow-hidden flex-1 min-w-0 space-y-1'>
                  <div className='font-bold text-xs text-foreground truncate group-hover:text-emerald-500 transition-colors'>
                    {animal.name}
                  </div>
                  <div className='text-[10px] text-muted-foreground truncate'>
                    {animal.species} • {animal.breed}
                  </div>
                  <div className='flex items-center justify-between pt-0.5'>
                    <Badge className='text-[9px] font-bold px-1.5 py-0 bg-orange-500/10 text-orange-600 border-orange-500/20' variant='outline'>
                      {animal.status}
                    </Badge>
                    {(userRole === 'Admin' || userRole === 'Veterinarian') && (
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-6 px-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-transparent rounded-md gap-0.5 transition-all'
                        onClick={() => {
                          setAnimalId(animal.id)
                          setVeterinarian(store.rescuers.find((r) => r.role === 'Veterinarian')?.name || 'Dr. Alice Vance')
                          setDiagnosis('')
                          setProcedure('Intake Physical Exam')
                          setMedication('')
                          setTreatmentDate(new Date().toISOString().split('T')[0])
                          setFollowUpDate('')
                          setNotes('')
                          setRecommendation('Continue Treatment')
                          setIsAddOpen(true)
                        }}
                      >
                        Log Exam
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Filter Chips & Toolbar */}
      <div className='space-y-3 bg-card p-3 rounded-xl border shadow-sm'>
        {/* Quick Filter Chips */}
        <div className='flex items-center gap-1.5 flex-wrap border-b pb-2 text-xs'>
          <span className='text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1'>
            <SlidersHorizontal className='h-3 w-3' /> Filter View:
          </span>
          {[
            { id: 'All', label: 'All Records' },
            { id: 'Critical', label: 'Critical Patients' },
            { id: 'Ongoing', label: 'Ongoing Treatment' },
            { id: 'FollowUpToday', label: 'Follow-up Today' },
            { id: 'Completed', label: 'Recovered / Completed' },
          ].map((chip) => (
            <Button
              key={chip.id}
              variant={chipFilter === chip.id ? 'default' : 'outline'}
              size='sm'
              onClick={() => handleFilterChange(setChipFilter, chip.id)}
              className={`h-7 text-xs px-2.5 rounded-full font-bold transition-all ${
                chipFilter === chip.id ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'text-muted-foreground'
              }`}
            >
              {chip.label}
            </Button>
          ))}
        </div>

        {/* Search & Vet Filter Dropdown */}
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2 max-w-md w-full'>
            <Search className='h-4 w-4 text-muted-foreground shrink-0' />
            <Input
              placeholder='Search patient name, veterinarian, diagnosis, procedure, or shelter...'
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className='h-9 text-xs'
            />
          </div>

          <div className='flex items-center gap-2 ml-auto text-xs'>
            <span className='font-medium text-muted-foreground'>Veterinarian:</span>
            <select
              value={vetFilter}
              onChange={(e) => handleFilterChange(setVetFilter, e.target.value)}
              className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
            >
              <option value='All'>All Veterinarians</option>
              {Array.from(new Set(store.treatments.map((t) => t.veterinarian))).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medical Records Table */}
      <div className='rounded-xl border bg-card overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in-50'>
        <Table>
          <TableHeader className='bg-muted/20'>
            <TableRow>
              <TableHead className='w-[90px]'>Record #</TableHead>
              <TableHead>Patient & Shelter</TableHead>
              <TableHead>Procedure</TableHead>
              <TableHead>Attending Vet</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Care Status</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Recovery</TableHead>
              <TableHead className='text-right'>Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTreatments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className='h-32 text-center text-muted-foreground'>
                  No veterinary medical records match your search or filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTreatments.map((t) => {
                const trtIdStr = String(t.id || '')
                const rawTrtId = trtIdStr.replace(/^(trt|treat)-/, '')
                const rawAnimId = String(t.animal_id || '').replace(/^ani-/, '')

                const animal = store.animals.find(
                  (a) => a.id === t.animal_id || String(a.id || '').replace(/^ani-/, '') === rawAnimId
                )

                const rawShelterId = String(animal?.shelter_id || '').replace(/^sh-/, '')
                const shelter = store.shelters.find(
                  (s) => s.id === animal?.shelter_id || String(s.id || '').replace(/^sh-/, '') === rawShelterId
                )

                const progress = getRecoveryProgress(animal?.status || 'Intake', animal?.condition, t.recommendation)

                return (
                  <TableRow
                    key={t.id}
                    className='hover:bg-muted/30 cursor-pointer transition-colors'
                    onClick={() => handleOpenDrawer(t)}
                  >
                    {/* Record # */}
                    <TableCell className='font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400'>
                      TRT-{rawTrtId.padStart(4, '0')}
                    </TableCell>

                    {/* Patient & Shelter */}
                    <TableCell>
                      {animal ? (
                        <div className='flex items-center gap-2.5'>
                          <img
                            src={animal.photo_url || getSpeciesPlaceholder(animal.species)}
                            alt={animal.name}
                            className='h-8 w-8 rounded-lg object-cover border bg-slate-800 shrink-0'
                          />
                          <div className='overflow-hidden space-y-0.5'>
                            <div className='font-bold text-xs text-foreground truncate'>{animal.name}</div>
                            <div className='text-[10px] text-muted-foreground truncate flex items-center gap-1'>
                              <Building2 className='h-2.5 w-2.5 text-rose-500 shrink-0' />
                              {shelter ? shelter.name : 'HQ Operations'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className='text-xs text-muted-foreground italic'>Unlinked Patient</span>
                      )}
                    </TableCell>

                    {/* Procedure */}
                    <TableCell>{getProcedureBadge(t.procedure)}</TableCell>

                    {/* Attending Vet */}
                    <TableCell className='text-xs font-bold text-foreground'>
                      <div className='flex items-center gap-1.5'>
                        <Stethoscope className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                        {t.veterinarian}
                      </div>
                    </TableCell>

                    {/* Diagnosis */}
                    <TableCell className='text-xs max-w-[150px] truncate font-medium text-foreground'>
                      {t.diagnosis}
                    </TableCell>

                    {/* Care Status */}
                    <TableCell>{getStatusBadge(t, animal?.status)}</TableCell>

                    {/* Follow-up */}
                    <TableCell>{getFollowupCountdown(t.follow_up_date)}</TableCell>

                    {/* Recovery % */}
                    <TableCell className='w-[110px]'>
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between text-[10px] font-semibold'>
                          <span className='text-muted-foreground'>Recovery</span>
                          <span className='text-emerald-600 dark:text-emerald-400 font-mono font-bold'>{progress}%</span>
                        </div>
                        <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-emerald-500 rounded-full transition-all duration-500'
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Quick Actions */}
                    <TableCell className='text-right' onClick={(e) => e.stopPropagation()}>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1'
                          onClick={() => handleOpenDrawer(t)}
                          title='View Patient Medical Journey'
                        >
                          <Eye className='h-3.5 w-3.5' /> View
                        </Button>
                        {(userRole === 'Admin' || userRole === 'Veterinarian') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-muted gap-1'
                            onClick={() => handleOpenEdit(t)}
                            title='Edit Record'
                          >
                            <Edit2 className='h-3.5 w-3.5' /> Edit
                          </Button>
                        )}
                        {userRole === 'Admin' && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-rose-500 hover:bg-rose-500/10'
                            onClick={() => handleOpenDelete(t)}
                            title='Delete Record'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm text-xs'>
          <span className='text-muted-foreground font-medium'>
            Showing <strong className='text-foreground font-mono'>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of <strong className='text-foreground font-mono'>{totalItems}</strong> medical records
          </span>

          <div className='flex items-center gap-1.5'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className='h-8 text-xs gap-1 font-semibold'
            >
              <ChevronLeft className='h-3.5 w-3.5' /> Previous
            </Button>

            <div className='flex items-center gap-1 px-2 font-mono text-xs font-bold text-muted-foreground'>
              Page <span className='text-foreground font-extrabold'>{currentPage}</span> of {totalPages}
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className='h-8 text-xs gap-1 font-semibold'
            >
              Next <ChevronRight className='h-3.5 w-3.5' />
            </Button>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle>Log Veterinary Medical Record</DialogTitle>
              <DialogDescription>Register a new clinical procedure or medication plan.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Patient Animal</span>
                  <select
                    value={animalId}
                    onChange={(e) => setAnimalId(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    {store.animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.species})
                      </option>
                    ))}
                  </select>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Attending Veterinarian</span>
                  <Input value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} placeholder='Dr. Alice Vance' required />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Clinical Diagnosis</span>
                  <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder='Fractured Femur' required />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Procedure</span>
                  <Input value={procedure} onChange={(e) => setProcedure(e.target.value)} placeholder='Orthopedic Surgery' required />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Treatment Date</span>
                  <Input type='date' value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} required />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Follow-up Date</span>
                  <Input type='date' value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                </div>
              </div>

              <div className='space-y-1 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30'>
                <span className='text-sm font-bold text-emerald-700 dark:text-emerald-300 block'>
                  🩺 Medical Clearance Decision
                </span>
                <span className='text-xs text-muted-foreground block pb-1'>
                  Submitting this clearance automatically updates the Animal Registry status.
                </span>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-semibold'
                >
                  <option value='Continue Treatment'>🟢 Continue Treatment (Remain Under Clinical Care)</option>
                  <option value='Under Observation'>🟡 Under Observation</option>
                  <option value='Critical Care'>🔴 Critical Care Required</option>
                  <option value='Recovered'>✅ Recovered (Medically Cleared)</option>
                </select>
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Medication & Dosage</span>
                <Input value={medication} onChange={(e) => setMedication(e.target.value)} placeholder='Amoxicillin 250mg, Meloxicam 0.5ml' />
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Clinical Notes</span>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Post-operative observations...' />
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold'>
                Save Assessment & Update Registry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          {selectedTreatment && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Edit Veterinary Medical Record</DialogTitle>
                <DialogDescription>Modify clinical diagnosis or medical clearance assessment.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Patient Animal</span>
                    <select
                      value={animalId}
                      onChange={(e) => setAnimalId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      {store.animals.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.species})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Attending Veterinarian</span>
                    <Input value={veterinarian} onChange={(e) => setVeterinarian(e.target.value)} required />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Clinical Diagnosis</span>
                    <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
                  </div>

                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Procedure</span>
                    <Input value={procedure} onChange={(e) => setProcedure(e.target.value)} required />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Treatment Date</span>
                    <Input type='date' value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} required />
                  </div>

                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Follow-up Date</span>
                    <Input type='date' value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  </div>
                </div>

                <div className='space-y-1 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30'>
                  <span className='text-sm font-bold text-emerald-700 dark:text-emerald-300 block'>
                    🩺 Medical Clearance Decision
                  </span>
                  <span className='text-xs text-muted-foreground block pb-1'>
                    Submitting this clearance automatically updates the Animal Registry status.
                  </span>
                  <select
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-semibold'
                  >
                    <option value='Continue Treatment'>🟢 Continue Treatment (Remain Under Clinical Care)</option>
                    <option value='Under Observation'>🟡 Under Observation</option>
                    <option value='Critical Care'>🔴 Critical Care Required</option>
                    <option value='Recovered'>✅ Recovered (Medically Cleared)</option>
                  </select>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Medication & Dosage</span>
                  <Input value={medication} onChange={(e) => setMedication(e.target.value)} />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Clinical Notes</span>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medical Record</DialogTitle>
            <DialogDescription>Are you sure you want to delete this veterinary record?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Treatment Details Drawer */}
      <TreatmentDetailsDrawer
        treatment={selectedTreatment}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onEditClick={handleOpenEdit}
      />
    </div>
  )
}

export const Treatments = MedicalTreatments

