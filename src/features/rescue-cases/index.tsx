import { useState, useMemo } from 'react'
import {
  useRescueHubStore,
  type RescueCase,
  type RescueCaseStatusType,
  type SeverityType,
  VALID_CASE_TRANSITIONS,
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
  MapPin,
  Clock,
  Car,
  Building2,
  Users,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { MockMapView } from '@/components/mock-map-view'
import { getSpeciesPlaceholder } from '@/features/animals/utils/placeholders'
import { CaseStatsHeader } from './components/case-stats-header'
import { CaseDetailsDrawer } from './components/case-details-drawer'

export function RescueCases() {
  const store = useRescueHubStore()
  const userRole = useAuthStore((state) => state.auth.user?.role?.[0] || 'Rescuer')

  // Search, Filters & Pagination States
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [shelterFilter, setShelterFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Dialog & Drawer States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [mapTarget, setMapTarget] = useState<'add' | 'edit'>('add')

  const [selectedCase, setSelectedCase] = useState<RescueCase | null>(null)

  // Add Form States
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<SeverityType>('Medium')
  const [notes, setNotes] = useState('')

  // Edit Form States
  const [editStatus, setEditStatus] = useState<RescueCaseStatusType>('REPORTED')
  const [editRescuerId, setEditRescuerId] = useState('')
  const [editShelterId, setEditShelterId] = useState('')
  const [editSeverity, setEditSeverity] = useState<SeverityType>('Medium')
  const [editNotes, setEditNotes] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Reset pagination on filter change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val)
    setCurrentPage(1)
  }

  // Handlers
  const handleOpenDrawer = (c: RescueCase) => {
    setSelectedCase(c)
    setIsDrawerOpen(true)
  }

  const handleOpenAdd = () => {
    setLocation('')
    setDescription('')
    setSeverity('Medium')
    setNotes('')
    setIsAddOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location || !description) {
      toast.error('Location and Description are required.')
      return
    }

    store.addCase({
      incident_id: null,
      report_date: new Date().toISOString(),
      rescue_date: null,
      location,
      description,
      severity,
      status: 'REPORTED',
      rescuer_id: null,
      shelter_id: null,
      animal_id: null,
      notes,
    })

    setIsAddOpen(false)
    toast.success('Rescue dispatch case registered successfully.')
  }

  const handleOpenEdit = (c: RescueCase) => {
    setSelectedCase(c)
    setEditStatus(c.status)
    const teamIdStr = c.rescuer_id ? c.rescuer_id.replace(/^res-/, 'team-') : ''
    const teamRescuer = store.rescuers.find(
      (r) => r.team_id === teamIdStr || r.team_id === c.rescuer_id || r.id === c.rescuer_id
    )
    setEditRescuerId(teamRescuer ? teamRescuer.id : '')
    setEditShelterId(c.shelter_id || '')
    setEditSeverity(c.severity)
    setEditNotes(c.notes || '')
    setEditLocation(c.location)
    setEditDescription(c.description)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCase) return

    const err = store.updateCase(selectedCase.id, {
      status: editStatus,
      rescuer_id: editRescuerId || null,
      shelter_id: editShelterId || null,
      severity: editSeverity,
      notes: editNotes,
      location: editLocation,
      description: editDescription,
      rescue_date: (['RESCUED', 'SHELTER_INTAKE', 'UNDER_TREATMENT', 'RECOVERED', 'ADOPTED', 'RELEASED', 'CLOSED'].includes(editStatus) && !selectedCase.rescue_date)
        ? new Date().toISOString()
        : selectedCase.rescue_date
    })

    if (err) {
      toast.error(err)
      return
    }

    setIsEditOpen(false)
    toast.success(`Rescue Case ${selectedCase.case_number} updated.`)
  }

  const handleOpenDelete = (c: RescueCase) => {
    setSelectedCase(c)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCase) return
    const err = await store.deleteCase(selectedCase.id)
    if (err) {
      toast.error(err)
    } else {
      toast.success(`Rescue Case ${selectedCase.case_number} deleted.`)
    }
    setIsDeleteOpen(false)
  }

  // Enhanced Filtering
  const filteredCases = useMemo(() => {
    return store.cases.filter((c) => {
      const s = search.toLowerCase()
      const rawCaseId = c.id.replace(/^case-/, '')
      const rawCaseAnimId = (c.animal_id || '').replace(/^ani-/, '')
      const rawCaseRescuerId = (c.rescuer_id || '').replace(/^(res|agt)-/, '')
      const rawCaseShelterId = (c.shelter_id || '').replace(/^sh-/, '')

      const teamIdStr = c.rescuer_id ? c.rescuer_id.replace(/^res-/, 'team-') : ''
      const rescuer = store.rescuers.find(
        (r) =>
          r.id === c.rescuer_id ||
          r.id.replace(/^(res|agt)-/, '') === rawCaseRescuerId ||
          (teamIdStr && r.team_id === teamIdStr)
      )

      const shelter = store.shelters.find(
        (sh) => sh.id === c.shelter_id || sh.id.replace(/^sh-/, '') === rawCaseShelterId
      )

      const animal = store.animals.find(
        (a) =>
          a.id === c.animal_id ||
          (rawCaseAnimId && a.id.replace(/^ani-/, '') === rawCaseAnimId) ||
          a.case_id === c.id ||
          (a.case_id && a.case_id.replace(/^case-/, '') === rawCaseId)
      )

      const matchesSearch =
        c.case_number.toLowerCase().includes(s) ||
        c.location.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s) ||
        c.status.toLowerCase().includes(s) ||
        (animal && animal.name.toLowerCase().includes(s)) ||
        (rescuer && rescuer.name.toLowerCase().includes(s)) ||
        (shelter && shelter.name.toLowerCase().includes(s))

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter
      const matchesPriority = priorityFilter === 'All' || c.severity === priorityFilter
      const matchesShelter =
        shelterFilter === 'All' ||
        c.shelter_id === shelterFilter ||
        (shelter && shelter.id === shelterFilter)

      return matchesSearch && matchesStatus && matchesPriority && matchesShelter
    })
  }, [store.cases, store.animals, store.rescuers, store.shelters, search, statusFilter, priorityFilter, shelterFilter])

  // Pagination calculation
  const totalItems = filteredCases.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCases = filteredCases.slice(startIndex, startIndex + itemsPerPage)

  // Pending Incidents Count
  const pendingIncidentsCount = store.incidents.filter((inc) => inc.status === 'Pending').length

  // Priority Badges (Clean UI without circle emojis)
  const getPriorityBadge = (priority: SeverityType) => {
    switch (priority) {
      case 'Critical':
        return <Badge className='bg-red-500 text-white font-bold text-[11px] shadow-sm'>Critical</Badge>
      case 'High':
        return <Badge className='bg-amber-500 text-slate-950 font-bold text-[11px] shadow-sm'>High</Badge>
      case 'Medium':
        return <Badge className='bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold text-[11px]'>Medium</Badge>
      case 'Low':
      default:
        return <Badge className='bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold text-[11px]'>Low</Badge>
    }
  }

  // Progress Percentage & Stage Derivation
  const getStageProgress = (st: RescueCaseStatusType) => {
    switch (st) {
      case 'REPORTED':
        return { pct: 20, stage: 'Reported' }
      case 'ASSIGNED':
        return { pct: 40, stage: 'Assigned' }
      case 'EN_ROUTE':
        return { pct: 60, stage: 'En Route' }
      case 'RESCUED':
        return { pct: 75, stage: 'Rescued' }
      case 'SHELTER_INTAKE':
      case 'UNDER_TREATMENT':
        return { pct: 90, stage: 'Intake / Treatment' }
      case 'RECOVERED':
      case 'ADOPTED':
      case 'RELEASED':
      case 'CLOSED':
      default:
        return { pct: 100, stage: 'Resolved' }
    }
  }

  // Simulated ETA Indicator
  const getETA = (st: RescueCaseStatusType, idStr: string) => {
    if (st === 'EN_ROUTE') {
      const mins = ((idStr.length * 7) % 20) + 8
      return <span className='text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20'>ETA: {mins} mins</span>
    } else if (st === 'RESCUED') {
      return <span className='text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'>On Scene</span>
    } else if (['SHELTER_INTAKE', 'UNDER_TREATMENT', 'RECOVERED', 'ADOPTED', 'RELEASED', 'CLOSED'].includes(st)) {
      return <span className='text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>Completed</span>
    }
    return <span className='text-[10px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20'>Pending Dispatch</span>
  }

  return (
    <div className='flex-1 space-y-4 p-8 pt-6 max-w-[1600px] mx-auto'>
      {/* Module Title Header & Action Button */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b'>
        <div>
          <h2 className='text-3xl font-black tracking-tight text-foreground flex items-center gap-2'>
            🚨 Rescue Operations Command Center
          </h2>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Coordinate active dispatches, assign responders and shelters, and track cases through completion.
          </p>
        </div>

        {(userRole === 'Admin' || userRole === 'Dispatcher') && (
          <Button onClick={handleOpenAdd} size='sm' className='flex gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'>
            <Plus className='h-4 w-4' /> Register Case Dispatch
          </Button>
        )}
      </div>

      {/* 1. Summary Statistics Header Cards */}
      <CaseStatsHeader cases={store.cases} pendingIncidentsCount={pendingIncidentsCount} />

      {/* Toolbar: Search, Filters */}
      <div className='flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-sm'>
        {/* Search Bar */}
        <div className='flex items-center gap-2 max-w-md w-full'>
          <Search className='h-4 w-4 text-muted-foreground shrink-0' />
          <Input
            placeholder='Search Case Number, animal name, rescuer, shelter, location...'
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            className='h-9 text-xs'
          />
        </div>

        {/* Filters */}
        <div className='flex items-center gap-2 flex-wrap ml-auto text-xs'>
          <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Statuses</option>
            <option value='REPORTED'>REPORTED</option>
            <option value='ASSIGNED'>ASSIGNED</option>
            <option value='EN_ROUTE'>EN_ROUTE</option>
            <option value='RESCUED'>RESCUED</option>
            <option value='SHELTER_INTAKE'>SHELTER_INTAKE</option>
            <option value='UNDER_TREATMENT'>UNDER_TREATMENT</option>
            <option value='RECOVERED'>RECOVERED</option>
            <option value='CLOSED'>CLOSED</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Priorities</option>
            <option value='Critical'>Critical</option>
            <option value='High'>High</option>
            <option value='Medium'>Medium</option>
            <option value='Low'>Low</option>
          </select>

          {/* Shelter Filter */}
          <select
            value={shelterFilter}
            onChange={(e) => handleFilterChange(setShelterFilter, e.target.value)}
            className='flex h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground font-medium'
          >
            <option value='All'>All Shelters</option>
            {store.shelters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Operations Center Table */}
      <div className='rounded-xl border bg-card overflow-hidden shadow-sm transition-all duration-300 animate-in fade-in-50'>
        <Table>
          <TableHeader className='bg-muted/20'>
            <TableRow>
              <TableHead className='w-[100px]'>Case #</TableHead>
              <TableHead>Target Animal</TableHead>
              <TableHead>Rescuer & Team</TableHead>
              <TableHead>Shelter Station</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Dispatch Progress</TableHead>
              <TableHead>ETA Status</TableHead>
              <TableHead className='text-right'>Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='h-32 text-center text-muted-foreground'>
                  No rescue dispatches match your search or filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCases.map((c) => {
                const rawCaseId = (c.id || '').replace(/^case-/, '')
                const rawCaseAnimId = (c.animal_id || '').replace(/^ani-/, '')
                const rawCaseRescuerId = (c.rescuer_id || '').replace(/^(res|agt)-/, '')
                const rawCaseShelterId = (c.shelter_id || '').replace(/^sh-/, '')

                const rescuer = store.rescuers.find((r) => {
                  const rawRId = (r.id || '').replace(/^(res|agt)-/, '')
                  return r.id === c.rescuer_id || rawRId === rawCaseRescuerId
                })

                const shelter = store.shelters.find((s) => {
                  const rawSId = (s.id || '').replace(/^sh-/, '')
                  return s.id === c.shelter_id || rawSId === rawCaseShelterId
                })

                const animal = store.animals.find((a) => {
                  const rawAnimId = (a.id || '').replace(/^ani-/, '')
                  const rawAnimCaseId = (a.case_id || '').replace(/^case-/, '')
                  return (
                    a.id === c.animal_id ||
                    (rawCaseAnimId && rawAnimId === rawCaseAnimId) ||
                    a.case_id === c.id ||
                    (rawAnimCaseId && rawAnimCaseId === rawCaseId)
                  )
                })

                // Team name derivation
                const teamName =
                  rescuer?.role === 'Veterinarian'
                    ? 'Medical Care Team'
                    : rescuer?.role === 'Dispatcher'
                    ? 'Dispatch Center'
                    : rescuer?.team_id?.includes('1')
                    ? 'Rescue Team Alpha'
                    : 'Field Unit Bravo'

                // Shelter Occupancy
                const shelterOccupancy = shelter
                  ? store.animals.filter(
                      (a) =>
                        (a.shelter_id === shelter.id || a.shelter_id?.replace(/^sh-/, '') === shelter.id.replace(/^sh-/, '')) &&
                        a.status !== 'Adopted' &&
                        a.status !== 'Released'
                    ).length
                  : 0

                const progress = getStageProgress(c.status)

                return (
                  <TableRow
                    key={c.id}
                    className='hover:bg-muted/30 cursor-pointer transition-colors'
                    onClick={() => handleOpenDrawer(c)}
                  >
                    {/* Case Number */}
                    <TableCell className='font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400'>
                      {c.case_number}
                    </TableCell>

                    {/* Animal */}
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
                            <div className='text-[10px] text-muted-foreground truncate'>{animal.species} • {animal.breed}</div>
                          </div>
                        </div>
                      ) : (
                        <span className='text-xs text-amber-600 dark:text-amber-400 font-semibold italic flex items-center gap-1'>
                          <AlertTriangle className='h-3 w-3' /> Intake Pending
                        </span>
                      )}
                    </TableCell>

                    {/* Rescuer & Team */}
                    <TableCell className='text-xs'>
                      {rescuer ? (
                        <div className='space-y-0.5'>
                          <span className='font-bold text-foreground block truncate'>
                            👤 {rescuer.name}
                          </span>
                          <span className='text-[10px] text-muted-foreground block truncate flex items-center gap-1'>
                            <Car className='h-2.5 w-2.5 text-blue-500' /> {teamName}
                          </span>
                        </div>
                      ) : (
                        <span className='text-xs text-amber-600 dark:text-amber-400 font-semibold italic flex items-center gap-1'>
                          ⚠️ Waiting Dispatcher
                        </span>
                      )}
                    </TableCell>

                    {/* Shelter & Capacity */}
                    <TableCell className='text-xs'>
                      {shelter ? (
                        <div className='space-y-0.5'>
                          <span className='font-medium text-foreground block truncate flex items-center gap-1'>
                            <Building2 className='h-3 w-3 text-emerald-500' /> {shelter.name}
                          </span>
                          <span className='text-[10px] font-mono text-muted-foreground block'>
                            Beds: {shelterOccupancy} / {shelter.capacity}
                          </span>
                        </div>
                      ) : (
                        <span className='text-xs text-muted-foreground italic'>Unassigned Station</span>
                      )}
                    </TableCell>

                    {/* Priority */}
                    <TableCell>{getPriorityBadge(c.severity)}</TableCell>

                    {/* Dispatch Progress */}
                    <TableCell className='w-[140px]'>
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between text-[10px] font-semibold'>
                          <span className='text-muted-foreground truncate'>{progress.stage}</span>
                          <span className='text-emerald-600 dark:text-emerald-400 font-mono font-bold'>{progress.pct}%</span>
                        </div>
                        <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-emerald-500 rounded-full transition-all duration-500'
                            style={{ width: `${progress.pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* ETA Status */}
                    <TableCell>{getETA(c.status, c.id)}</TableCell>

                    {/* Quick Actions */}
                    <TableCell className='text-right' onClick={(e) => e.stopPropagation()}>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1'
                          onClick={() => handleOpenDrawer(c)}
                          title='View Case Details'
                        >
                          <Eye className='h-3.5 w-3.5' /> View
                        </Button>
                        {(userRole === 'Admin' || userRole === 'Dispatcher' || userRole === 'Rescuer') && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-7 px-2 text-xs font-semibold text-muted-foreground hover:bg-muted gap-1'
                            onClick={() => handleOpenEdit(c)}
                            title='Update Dispatch Status'
                          >
                            <Edit2 className='h-3.5 w-3.5' /> Edit
                          </Button>
                        )}
                        {userRole === 'Admin' && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-7 w-7 text-rose-500 hover:bg-rose-500/10'
                            onClick={() => handleOpenDelete(c)}
                            title='Delete Case'
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
            Showing <strong className='text-foreground font-mono'>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of <strong className='text-foreground font-mono'>{totalItems}</strong> rescue cases
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
              <DialogTitle>Register Rescue Dispatch Case</DialogTitle>
              <DialogDescription>Create a new emergency dispatch case.</DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='space-y-1'>
                <span className='text-sm font-medium'>Incident Location</span>
                <div className='flex gap-2'>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder='12 Maple St, Riverside' required />
                  <Button type='button' variant='outline' size='sm' onClick={() => { setMapTarget('add'); setIsMapOpen(true); }}>
                    Map Pin
                  </Button>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Priority / Severity</span>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityType)}
                    className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                  >
                    <option value='Low'>Low</option>
                    <option value='Medium'>Medium</option>
                    <option value='High'>High</option>
                    <option value='Critical'>Critical</option>
                  </select>
                </div>
              </div>

              <div className='space-y-1'>
                <span className='text-sm font-medium'>Description & Dispatch Notes</span>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Describe animal distress situation...' required />
              </div>
            </div>
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type='submit'>Register Case</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='sm:max-w-lg'>
          {selectedCase && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader>
                <DialogTitle>Update Case {selectedCase.case_number}</DialogTitle>
                <DialogDescription>Advance dispatch status or reassign personnel & shelter.</DialogDescription>
              </DialogHeader>
              <div className='grid gap-4 py-4 h-105 overflow-y-auto pr-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Dispatch Status</span>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as RescueCaseStatusType)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='REPORTED'>REPORTED</option>
                      <option value='ASSIGNED'>ASSIGNED</option>
                      <option value='EN_ROUTE'>EN_ROUTE</option>
                      <option value='RESCUED'>RESCUED</option>
                      <option value='SHELTER_INTAKE'>SHELTER_INTAKE</option>
                      <option value='UNDER_TREATMENT'>UNDER_TREATMENT</option>
                      <option value='RECOVERED'>RECOVERED</option>
                      <option value='CLOSED'>CLOSED</option>
                    </select>
                  </div>

                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Priority Level</span>
                    <select
                      value={editSeverity}
                      onChange={(e) => setEditSeverity(e.target.value as SeverityType)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value='Low'>Low</option>
                      <option value='Medium'>Medium</option>
                      <option value='High'>High</option>
                      <option value='Critical'>Critical</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Assigned Rescuer</span>
                    <select
                      value={editRescuerId}
                      onChange={(e) => setEditRescuerId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value=''>Unassigned Agent</option>
                      {store.rescuers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='space-y-1'>
                    <span className='text-sm font-medium'>Target Shelter</span>
                    <select
                      value={editShelterId}
                      onChange={(e) => setEditShelterId(e.target.value)}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'
                    >
                      <option value=''>Unassigned Shelter</option>
                      {store.shelters.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Incident Location</span>
                  <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required />
                </div>

                <div className='space-y-1'>
                  <span className='text-sm font-medium'>Dispatch Notes</span>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type='submit'>Save Case Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rescue Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this case record?
            </DialogDescription>
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

      {/* Case Details Drawer */}
      <CaseDetailsDrawer
        rescueCase={selectedCase}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onEditClick={handleOpenEdit}
      />

      {/* Map Picker Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Select Rescue Coordinates</DialogTitle>
            <DialogDescription>Click on the location map to set incident coordinates.</DialogDescription>
          </DialogHeader>
          <div className='h-80 w-full rounded-md border overflow-hidden'>
            <MockMapView
              latitude={14.5995}
              longitude={120.9842}
              locationName='Selected Rescue Site'
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsMapOpen(false)}>Confirm Coordinates</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
